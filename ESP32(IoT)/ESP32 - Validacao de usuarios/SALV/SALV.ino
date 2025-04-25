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

#define PIR_PIN 4
LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ ss_pin };
MFRC522 mfrc522{ driver };

// Variáveis globais
bool cartaoLido = false, alertaEnviado = false, acessoLiberado = false;
bool contagemSeguranca = false, emCooldown = false, movimentoDetectado = false;
unsigned long tempoAlertar = 0, ultimaLeitura = 0, tempoAcessoLiberado = 0;
unsigned long inicioContagem = 0, tempoCooldown = 0, tempoDetectado = 0;
unsigned long ultimaAtualizacaoCooldown = 0, tempoUltimoRelatorio = 0;
String horaInicio = "", horaFim = "";

// APIs e configurações de rede
const char* API_Cartao = "https://[REDACTED]/verificar-cartao";
const char* Api_registraEntrada = "https://[REDACTED]/registro-entrada";
const char* Api_registraSaida = "https://[REDACTED]/registro-acesso";
const char* ssid = "[REDACTED_SSID]";
const char* password = "[REDACTED_PASSWORD]";
const char* mqtt_server = "[REDACTED_MQTT_SERVER]";
const int mqtt_port = 8883;
const char* mqtt_user = "[REDACTED_MQTT_USER]";
const char* mqtt_password = "[REDACTED_MQTT_PASS]";
const char* pc_mac_str = "[REDACTED_MAC]";
uint8_t mac_address[6];
const int wol_port = 9;

// Objetos de rede
WiFiUDP ntpUDP, udp;
NTPClient timeClient(ntpUDP, "pool.ntp.org", -10800, 3600);
WiFiClientSecure espClient;
PubSubClient client(espClient);


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

      // Subscreva a todos os tópicos relevantes
      client.subscribe("comando/wol");
      client.subscribe("status/#");  // Monitora todos os subtópicos de status

      // Publica mensagem de conexão
      client.publish("status/connection", "ESP32 reconectado");
      delay(1000);
    } else {
      Serial.print("Falha, rc=");
      Serial.println(client.state());
      lcd.setCursor(0, 1);
      lcd.print("Falha: " + String(client.state()));
      delay(5000);
    }
  }
}

// Função auxiliar para traduzir códigos de erro MQTT
String obterMensagemEstadoMQTT(int estado) {
  switch (estado) {
    case -4: return "Tempo esgotado";
    case -3: return "Conexão perdida";
    case -2: return "Falha na conexão";
    case -1: return "Desconectado";
    case 0: return "Conectado";
    case 1: return "Protocolo inválido";
    case 2: return "ID cliente inválido";
    case 3: return "Servidor indisponível";
    case 4: return "Credenciais inválidas";
    case 5: return "Não autorizado";
    default: return "Erro desconhecido";
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
  // Converte payload para string
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("Mensagem recebida [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  // Exibe no LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MQTT: " + String(topic).substring(0, 10));
  lcd.setCursor(0, 1);
  lcd.print(String(message).substring(0, 16));

  // Processa comandos
  if (String(topic) == "comando/wol") {
    if (String(message) == "ligarPC") {
      sendWOL();
    }
  }

  // Adicione outros tópicos conforme necessário
  delay(1000);  // Tempo para ler a mensagem no LCD
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
  client.setSocketTimeout(30); 
  client.setKeepAlive(60);
  pinMode(PIR_PIN, INPUT);
  if (!mfrc522.PCD_Init()) {
    Serial.println("Falha na inicialização do MFRC522!");
    while (true)
      ;
  }
  Serial.println("MFRC522 inicializado!");
}

void enviarMensagemMQTT(const char* topico, const char* mensagem) {
  if (!client.connected()) {
    reconnect();
  }

  if (client.publish(topico, mensagem)) {
    Serial.print("Mensagem enviada [");
    Serial.print(topico);
    Serial.print("]: ");
    Serial.println(mensagem);
  } else {
    Serial.println("Falha ao enviar mensagem MQTT");
    reconnect();
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  timeClient.update();
  static unsigned long lastMqttCheck = 0;
  if (millis() - lastMqttCheck > 30000) {  // A cada 30 segundos
    if (!client.connected()) {
      reconnect();
    }
    lastMqttCheck = millis();
  }
  // Cooldown de 2 horas
  if (emCooldown) {
    unsigned long tempoRestante = 7200000 - (millis() - tempoCooldown);
    if (tempoRestante > 0) {
      lcd.clear();
      lcd.print("Acesso recente!");
      lcd.setCursor(0, 1);
      lcd.print("Tempo restante:");
      unsigned long segundos = tempoRestante / 1000;
      lcd.print(String(segundos / 3600) + "h " + String((segundos % 3600) / 60) + "m " + String(segundos % 60) + "s");
    } else emCooldown = false;
    return;
  }

  // Detecção de movimento
  if (digitalRead(PIR_PIN) && !movimentoDetectado) {
    movimentoDetectado = true;
    bool cancelAlert = false;
    unsigned long tempoInicio = millis();

    // Loop de leitura do cartão (60 segundos)
    while (millis() - tempoInicio < 60000 && !cartaoLido && !cancelAlert) {
      lcd.setCursor(0, 0);
      lcd.print("leia o cartao...");
      lcd.setCursor(0, 1);
      lcd.print("Tempo: " + String(60 - ((millis() - tempoInicio) / 1000)) + "s");

      if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        String uid = "";
        for (byte i = 0; i < mfrc522.uid.size; i++) uid += String(mfrc522.uid.uidByte[i], HEX);
        String nome = verificaCartaoNaAPI(uid);
        if (nome != "") {
          lcd.clear();
          lcd.print("Bem-vindo:");
          lcd.setCursor(0, 1);
          lcd.print(nome);
          tempoCooldown = millis();
          emCooldown = true;
          cartaoLido = true;
          delay(5000);
          return;
        }
      }
      delay(100);
    }

    // Acesso negado
    if (!cartaoLido && !cancelAlert) {
      lcd.clear();
      lcd.print("Alerta:");
      lcd.setCursor(0, 1);
      lcd.print("Usuario nao auth");
      enviarMensagemMQTT("status/alert", "acesso negado");
      Serial.println("Debug - Publicado no tópico: alert");
      Serial.print("Estado MQTT: ");
      Serial.println(client.state());

      // Loop de alerta (5 minutos)
      unsigned long tempoAlertaInicio = millis();
      while (digitalRead(PIR_PIN) && millis() - tempoAlertaInicio < 300000) {
        if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
          String uid = "";
          for (byte i = 0; i < mfrc522.uid.size; i++) uid += String(mfrc522.uid.uidByte[i], HEX);
          String nome = verificaCartaoNaAPI(uid);
          if (nome != "") {
            enviarMensagemMQTT("status/alert", "alerta cancelado, acesso liberado");
            contagemSeguranca = true;
            inicioContagem = millis();
            lcd.clear();
            lcd.print("Local Seguro!");
            lcd.setCursor(0, 1);
            lcd.print("Verificacao...");
            delay(2000);
            break;
          }
        }
        delay(100);
      }

      // Contagem regressiva de 10 minutos
      if (contagemSeguranca) {
        unsigned long tempoAtual = millis();
        while (millis() - inicioContagem < 600000) {
          lcd.clear();
          lcd.print("Verificacao em:");
          lcd.setCursor(0, 1);
          int segundos = 600 - ((millis() - inicioContagem) / 1000);
          lcd.print(String(segundos / 60) + "m " + String(segundos % 60) + "s");
          delay(1000);
        }
        ESP.restart();
      } else {
        lcd.clear();
        lcd.print("Modo economia.");
        esp_deep_sleep_start();
      }
    }
  }

  if (digitalRead(PIR_PIN) == LOW && movimentoDetectado) movimentoDetectado = false;
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

      // Obter apenas a hora no formato HH:MM:SS
      String saidaTime = timeClient.getFormattedTime();  // Já retorna HH:MM:SS

      // Registrar saída
      registraSaidaNaAPI(uid, saidaTime);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Saída registrada");
      lcd.setCursor(0, 1);
      lcd.print(nome);
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

  Serial.print("Enviando JSON para saída: ");
  Serial.println(jsonData);

  int httpResponseCode = http.POST(jsonData);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API: " + response);

    // Verifica se a resposta contém um erro
    if (response.indexOf("\"status\":\"error\"") != -1) {
      Serial.println("Erro ao registrar saída:");
      // Extrai a mensagem de erro
      int msgStart = response.indexOf("\"message\":\"") + 10;
      int msgEnd = response.indexOf("\"", msgStart);
      String errorMsg = response.substring(msgStart, msgEnd);
      Serial.println(errorMsg);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Erro registro:");
      lcd.setCursor(0, 1);
      lcd.print(errorMsg.substring(0, 16));  // Limita ao tamanho do LCD
    }
  } else {
    Serial.print("Erro na requisição: ");
    Serial.println(httpResponseCode);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Erro HTTP:");
    lcd.setCursor(0, 1);
    lcd.print(httpResponseCode);
  }
  http.end();
}