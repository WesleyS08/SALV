#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>

// Definindo o endereço do LCD e o número de colunas e linhas
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Credenciais da sua rede Wi-Fi
const char* ssid = "LIVE TIM_0C19_2G";       // Substitua com o nome da sua rede Wi-Fi
const char* password = "2f5r2pmppenr7u46";   // Substitua com a senha da sua rede Wi-Fi

void setup() {
  // Inicializa o LCD
  lcd.init();
  lcd.backlight();  

  // Inicializa a comunicação serial
  Serial.begin(9600);

  // Exibe a mensagem inicial
  lcd.setCursor(0, 0);
  lcd.print("Tentando conectar...");
  lcd.setCursor(0, 1);
  lcd.print("Aguarde");

  // Conectando ao Wi-Fi
  WiFi.begin(ssid, password);

  // Aguarda a conexão
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");  // Exibe um ponto no monitor serial para indicar tentativa
  }

  // Se conectado com sucesso, exibe o IP no LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectado!");
  lcd.setCursor(0, 1);
  lcd.print("IP: ");
  lcd.print(WiFi.localIP());  // Exibe o IP do dispositivo

  Serial.println("");  // Pula uma linha no monitor serial
  Serial.print("Conectado! Endereço IP: ");
  Serial.println(WiFi.localIP());  // Exibe o IP no monitor serial
}

void loop() {
  // Nada precisa ser feito no loop por enquanto
}
