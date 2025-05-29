#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>

#define SS_PIN 5  // Pino SDA do MFRC522
MFRC522DriverPinSimple ss_pin(SS_PIN);
MFRC522DriverSPI driver{ ss_pin };
MFRC522 mfrc522{ driver };

void setup() {
  Serial.begin(115200);
  while (!Serial);  
  
  SPI.begin();      
  mfrc522.PCD_Init(); 
  Serial.println("Aproxime o cartão RFID...");
}

void loop() {
  // Verifica presença de cartão
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return;

  Serial.print("ID do Cartão: ");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) Serial.print("0");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();
  delay(1000);  
}
