 
#include <Wire.h>
void setup() {
	Wire.begin(21, 22); // Pinos SDA (21) e SCL (22)
	Serial.begin(9600);
	while (!Serial);
	Serial.println("\nI2C Scanner - ESP32");
}
 
void loop() {
	byte error, address;
	int nDevices = 0;
	Serial.println("Procurando dispositivos I2C...");
 
	for (address = 1; address < 127; address++) {
		Wire.beginTransmission(address);
		error = Wire.endTransmission();
		if (error == 0) {
			Serial.print("Dispositivo encontrado no endereço 0x");
			if (address < 16) Serial.print("0");
			Serial.println(address, HEX);
			nDevices++;
		}
	}
	if (nDevices == 0) {
		Serial.println("Nenhum dispositivo I2C encontrado.");
	} else {
		Serial.println("Varredura concluída.");
	}
	delay(5000);
}