#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <WiFiUdp.h>
#include <LiquidCrystal_I2C.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <NTPClient.h>
#include <HTTPClient.h>
#include <time.h>
#include "esp_sleep.h"

// Sensor de movimento
#define PIR_PIN 4
LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ ss_pin };
MFRC522 mfrc522{ driver };
bool cartaoLido = false;
unsigned long tempoAlertar = 0;
// URLs da API
const char* API_Cartao = "<Rota da susa API>";  // Endpoint para cartão
const char* API_bancodedados = "<Rota da sua API>";  // Endpoint para banco de dados
const char* Api_registraEntrada = "<Rota>";  // Endpoint para entrada
const char* Api_registraSaida = "<Rota da sua API>";     // Endpoint para saída

// Configurações de Wi-Fi
const char* ssid = "<Nome da sua rede>";
const char* password = "<Senha da sua rede>";

// Configurações do MQTT
const char* mqtt_server = "<Endereço do seu servidor>";
const int mqtt_port = 8883;
const char* mqtt_user = "<Usuário do seu servidor>";
const char* mqtt_password = "<Senha do seu servidor>";

// Configurações Wake-on-LAN
const char* pc_mac_str = "<Endereço MAC do seu PC>";
uint8_t mac_address[6];
const int wol_port = 9;

// NTPClient
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", -10800, 3600); 

WiFiClientSecure espClient;
PubSubClient client(espClient);
WiFiUDP udp;

// Variáveis de controle de movimento
bool movimentoDetectado = false;
unsigned long tempoDetectado = 0;
String horaInicio = "";
String horaFim = "";
unsigned long tempoUltimoRelatorio = 0;

// Função para obter data/hora completa no formato "YYYY-MM-DD HH:MM:SS"
String getFormattedDateTime() {
  time_t rawTime = timeClient.getEpochTime();
  struct tm* timeinfo = localtime(&rawTime);
  char buffer[20];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
          timeinfo->tm_year + 1900, timeinfo->tm_mon + 1, timeinfo->tm_mday,
          timeinfo->tm_hour, timeinfo->tm_min, timeinfo->tm_sec);
  return String(buffer);
}

void setup_wifi() {
  Serial.begin(115200);
  Serial.print("Conectando a ");
  Serial.println(ssid);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando WiFi");

  WiFi.begin(ssid, password);
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
    lcd.setCursor(0, 1);
    switch (tentativas % 6) {
      case 0: lcd.print("   "); break;
      case 1: lcd.print(".  "); break;
      case 2: lcd.print(".. "); break;
      case 3: lcd.print("..."); break;
      case 4: lcd.print("...."); break;
      case 5: lcd.print("....."); break;
    }
    tentativas++;
    if (tentativas > 10) {
      Serial.println("\nMuitas tentativas falhas! Reiniciando ESP...");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Erro WiFi, Reset!");
      delay(2000);
      ESP.restart();
    }
  }
  Serial.println("\nConectado! IP: ");
  Serial.println(WiFi.localIP());
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Conectado!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  delay(2000);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando ao MQTT...");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Conectando MQTT");
    if (client.connect("ESP32Client", mqtt_user, mqtt_password)) {
      Serial.println("Conectado!");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("MQTT Conectado!");
      client.publish("status/connected", "ESP32 Conectado!");
      delay(1000);
      client.subscribe("comando/wol");
    } else {
      Serial.print("Falha, rc=");
      Serial.print(client.state());
      Serial.println(" Tentando em 5s...");
      lcd.setCursor(0, 1);
      lcd.print("Falha. Retry...");
      delay(5000);
    }
  }
}

void sendWOL() {
  uint8_t magicPacket[102];
  memset(magicPacket, 0xFF, 6);
  for (int i = 6; i < 102; i += 6) {
    memcpy(&magicPacket[i], mac_address, 6);
  }
  udp.beginPacket("255.255.255.255", wol_port);
  udp.write(magicPacket, sizeof(magicPacket));
  udp.endPacket();
  Serial.println("Pacote WoL enviado!");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WoL Enviado!");
  delay(2000);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensagem [");
  Serial.print(topic);
  Serial.print("]: ");
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MQTT Msg:");
  lcd.setCursor(0, 1);
  lcd.print(message);
  delay(2000);
  if (message == "ligarPC") {
    sendWOL();
  }
}

void setup() {
  Wire.begin(25, 33);
  lcd.begin(16, 2);
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Iniciando...");
  delay(500);
  setup_wifi();
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  pinMode(PIR_PIN, INPUT);
  if (!mfrc522.PCD_Init()) {
    Serial.println("Falha na inicialização do MFRC522!");
    while (true)
      ;
  }
  Serial.println("MFRC522 inicializado!");
}

// Função para enviar mensagem para o MQTT
void enviarMensagemMQTT(const char* topico, const char* mensagem) {
  Serial.print("função de mensagem chamada ");
  if (!client.connected()) {
    reconnect();  
  }

  if (client.connected()) {
    Serial.print("Enviando mensagem para o MQTT: ");
    Serial.println(mensagem);
    client.publish(topico, mensagem);
  } else {
    Serial.println("Falha na conexão MQTT. Tentando reconectar...");
    reconnect();
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  timeClient.update();

  int movimento = digitalRead(PIR_PIN);
  Serial.print("Estado PIR: ");
  Serial.println(movimento);

  // Se movimento for detectado e não estivermos processando leitura
  if (movimento == HIGH && !movimentoDetectado) {
    movimentoDetectado = true;
    tempoDetectado = millis();
    horaInicio = timeClient.getFormattedTime();
    Serial.print("Movimento! Hora: ");
    Serial.println(horaInicio);

    unsigned long tempoInicio = millis();
    while (millis() - tempoInicio < 60000) {
      lcd.setCursor(0, 0);
      lcd.print("leia o cartao...");

      lcd.setCursor(0, 1);
      int segundosRestantes = 60 - ((millis() - tempoInicio) / 1000);

      lcd.print("Tempo: ");
      lcd.print(segundosRestantes);
      lcd.print("s ");

      if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        Serial.println("Cartão detectado!");
        String uid = "";
        for (byte i = 0; i < mfrc522.uid.size; i++) {
          uid += String(mfrc522.uid.uidByte[i], HEX);
        }
        Serial.println("UID do cartão: " + uid);
        String nome = verificaCartaoNaAPI(uid);
        if (nome != "") {
          Serial.println("Cartão lido! Acesso liberado.");
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Bem-vindo:");
          lcd.setCursor(0, 1);
          lcd.print(nome);
          delay(5000);
          lcd.noBacklight();
          lcd.noDisplay();
        } else {
          Serial.println("Cartão inválido.");
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Acesso negado!");
          delay(5000);
        }
        movimentoDetectado = false;
        return;
      }
    }

    // Timeout: tempo para leitura do cartão expirou
    Serial.println("Acesso negado, tempo expirado!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Alerta:");
    lcd.setCursor(0, 1);
    lcd.print("Usuario nao auth");

    // Enviar alerta MQTT
    enviarMensagemMQTT("status/alert", "acesso negado");

    // Armazenando o tempo em que o alerta foi iniciado
    tempoAlertar = millis();

    // Modo alerta: enquanto houver movimento, o alerta fica ativo
    bool cancelAlert = false;
    while (digitalRead(PIR_PIN) == HIGH) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Alerta:");
      lcd.setCursor(0, 1);
      lcd.print("Usuario nao auth");
      enviarMensagemMQTT("alert", "acesso negado");  
      delay(3000);

      // Verifica se um cartão válido é lido para cancelar o alerta
      if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        String uid = "";
        for (byte i = 0; i < mfrc522.uid.size; i++) {
          uid += String(mfrc522.uid.uidByte[i], HEX);
        }
        String nome = verificaCartaoNaAPI(uid);
        if (nome != "") {
          Serial.println("Cartão válido lido durante alerta. Alerta cancelado.");
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Bem-vindo:");
          lcd.setCursor(0, 1);
          lcd.print(nome);
          enviarMensagemMQTT("alert", "alerta cancelado, acesso liberado");
          cancelAlert = true;
          delay(5000);

          // Tempo de espera de 10 minutos (600.000 ms)
          unsigned long tempoEspera = 600000;          
          unsigned long tempoInicioEspera = millis();  

          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Reiniciando em");

          // Loop de espera de 10 minutos
          while (millis() - tempoInicioEspera < tempoEspera) {
            // Calcula o tempo restante em minutos e segundos
            int minutosRestantes = (tempoEspera - (millis() - tempoInicioEspera)) / 60000;
            int segundosRestantes = (tempoEspera - (millis() - tempoInicioEspera)) % 60000 / 1000;

            // Atualiza a parte do LCD onde o tempo é mostrado
            lcd.setCursor(0, 1);
            lcd.print("Tempo:");
            lcd.print(minutosRestantes);
            lcd.print("min ");
            lcd.print(segundosRestantes);
            lcd.print("s");


            delay(1000); 
          }


          // Após 10 minutos, reinicia ou prossegue com a lógica desejada
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Reiniciando...");
          delay(2000);
          break;
        }
      }
    }

    // Se o alerta não foi cancelado (ou seja, não há mais movimento), entra em deep sleep
    if (!cancelAlert) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Sem movimento.");
      lcd.setCursor(0, 1);
      lcd.print("Modo economia.");
      delay(2000);
      esp_sleep_enable_ext0_wakeup((gpio_num_t)PIR_PIN, HIGH);
      esp_deep_sleep_start();
    }
    movimentoDetectado = false;
  }

  if (movimento == LOW && movimentoDetectado) {
    movimentoDetectado = false;
    horaFim = timeClient.getFormattedTime();
    Serial.print("Movimento terminou! Hora: ");
    Serial.println(horaFim);
    enviarMensagemMQTT("alert", "sem ninguém na sala verifique");
  }
  delay(1000);
}


void registraAcessoNaAPI(String uid, String nome, String dispositivo_id, String entrada) {
  HTTPClient http;
  String url = String(Api_registraEntrada);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String jsonData = "{\"uid\":\"" + uid + "\",\"nome_usuario\":\"" + nome + "\",\"dispositivo_id\":\"" + dispositivo_id + "\",\"entrada\":\"" + entrada + "\"}";
  Serial.print("Enviando JSON para entrada: ");
  Serial.println(jsonData);
  int httpResponseCode = http.POST(jsonData);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API: " + response);
  } else {
    Serial.print("Erro na requisição: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

String verificaCartaoNaAPI(String uid) {
  HTTPClient http;
  String url = String(API_Cartao) + "?uid=" + uid;
  Serial.print("Requisição para URL: ");
  Serial.println(url);
  http.begin(url);
  int httpResponseCode = http.GET();
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API: " + response);
    // Se o retorno indicar "entrada"
    if (response.indexOf("\"tipo\":\"entrada\"") != -1) {
      int nomePos = response.indexOf("\"Nome\":\"") + 8;
      int nomeEnd = response.indexOf("\"", nomePos);
      String nome = response.substring(nomePos, nomeEnd);
      String dispositivo_id = "esp32_001";
      String entrada = getFormattedDateTime();
      registraAcessoNaAPI(uid, nome, dispositivo_id, entrada);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Entrada regist.");
      lcd.setCursor(0, 1);
      lcd.print("Resp: " + nome);
      return nome;
    }
    // Se o retorno indicar "saida", envia somente o horário
    else if (response.indexOf("\"tipo\":\"saida\"") != -1) {
      int nomePos = response.indexOf("\"Nome\":\"") + 8;
      int nomeEnd = response.indexOf("\"", nomePos);
      String nome = response.substring(nomePos, nomeEnd);
      String saidaTime = timeClient.getFormattedTime();
      registraSaidaNaAPI(uid, saidaTime);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Acesso");
      lcd.setCursor(0, 1);
      lcd.print("liberado!");
      return nome;
    } else {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Acesso negado!");
      return "";
    }
  } else {
    Serial.print("Erro na requisição: ");
    Serial.println(httpResponseCode);
    lcd.setCursor(0, 1);
    lcd.print("Erro na conexao!");
    http.end();
    return "";
  }
}

void registraSaidaNaAPI(String uid, String saida) {
  HTTPClient http;
  String url = String(Api_registraSaida);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String jsonData = "{\"uid\":\"" + uid + "\",\"saida\":\"" + saida + "\"}";
  int httpResponseCode = http.POST(jsonData);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API: " + response);
  } else {
    Serial.print("Erro na requisição: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}
