# SALV - Sistema de Alerta Laboratorial com Visão ⚡🔍📡


---

## 🚀 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
  - [Hardware e Sensores](#hardware-e-sensores)
  - [Software e Backend](#software-e-backend)
  - [Protocolos de Automação](#protocolos-de-automação)
  - [Comunicação e Protocolos](#comunicação-e-protocolos)
- [ESP32](#esp32)
- [Autores](#autores-)

---

## Sobre o Projeto⚡🔍📡

SALV (Sistema de Alerta Laboratorial com Visão) é uma solução de segurança que integra a detecção de movimento, detecção facial e notificações instantâneas para monitoramento eficiente e automatizado de ambientes. Ideal para laboratórios e locais restritos, o sistema oferece proteção de dados e controle de acesso acessível e de baixo custo.

## Funcionalidades

| **Funcionalidade**               | **Descrição**                                                                                  |
|:------------------------------------:|:-----------------------------------------------------------------------------------------------:|
| **Detecção de Movimento**         | Monitora o ambiente e ativa o sistema quando movimento é detectado.                           |
| **Detecção Facial**                | Reconhece o rosto da pessoa e destaca na filmagem.                                            |
| **Autenticação com Cartões de Acesso** | Permite o acesso apenas a usuários com cartões válidos.                                   |
| **Gravação Automática**            | Registra imagens e vídeos quando acessos não autorizados são detectados.                      |
| **Notificações em Tempo Real**    | Envia alertas instantâneos para o aplicativo móvel, permitindo respostas rápidas.              |

---

## Tecnologias Utilizadas

O SALV foi desenvolvido com uma série de tecnologias e APIs divididas em algumas partes principais para garantir escalabilidade, eficiência e facilidade de manutenção. Confira abaixo as tecnologias utilizadas:

### **Hardware e Sensores**

Responsáveis pela captura de dados do ambiente, utilizando sensores de movimento, câmeras e dispositivos de autenticação.

| **Tecnologia**              | **Descrição**                                                               |
|-----------------------------|----------------------------------------------------------------------------:|
| **ESP32**                   | Controladores que integram sensores e comunicam com o sistema central.      |
| **Webcam**                  | Alternativa para o Raspberry Pi câmera afim de diminuir o custo             |
| **Leitor RFID**             | Permite autenticação através de cartões de acesso.                          |
| **LCD ( Pode ser substituído por leds)**                     | Melhora no entendimento do sistema permitindo repassar mensagens do sistema.|
| **Comunicação via MQTT**    | Protocolo de comunicação eficiente para troca de dados entre dispositivos.  |

---

### **Software e Backend**

O software é responsável pelo processamento dos dados, incluindo a detecção facial, autenticação de usuários e envio de notificações.

| **Tecnologia**              | **Descrição**                                                               |
|-----------------------------|:----------------------------------------------------------------------------:|
| **YOLOv8 e  MediaPipe**                  | Biblioteca para detecção de movimento e faces em tempo real.                |
| **Python**                  | Linguagem principal para controle e análise das imagens e dados.           |
| **Supabase**                | Banco de dados e serviço de autenticação segura.                            |
| **React Native**            | Framework para o desenvolvimento do aplicativo móvel.                       |
| **Firebase Cloud Messaging**| Envio de notificações em tempo real para o aplicativo móvel.               |
| **Supabase Store**          | Armazenamento de imagens e vídeos de acessos não autorizados.               |

---

### **Protocolos de Automação**

Esses protocolos garantem a operação contínua e autônoma do sistema, com funcionalidades como inicialização automática e acionamento remoto de dispositivos.

| **Tecnologia**           | **Descrição**                                                               |
|--------------------------|:----------------------------------------------------------------------------:|
| **Wake-on-Lan (WOL)**     | Permite ligar o PC remotamente usando o ESP32, caso o PC esteja desligado ( Garanta que seu computador seja compatível). |
| **Task Scheduler**        | Automatiza a inicialização do programa Python ao ligar o PC.                |
| **AutoStart (Python Script)** | Configuração para iniciar automaticamente os serviços ao ligar a máquina. |

---
---

## **Comunicação e Protocolos**

O sistema **SALV** utiliza protocolos de comunicação e APIs para garantir uma troca de informações eficiente e em tempo real entre os dispositivos, como sensores, câmeras, e o sistema central. O uso do **MQTT** e APIs específicas permite uma integração ágil e a resposta rápida aos eventos detectados.

#### - **MQTT - Message Queuing Telemetry Transport (protocolo de comunicação máquina para máquina)**

O MQTT (Message Queuing Telemetry Transport) é um protocolo de comunicação eficiente e de baixo consumo de banda, ideal para o SALV, pois possibilita uma comunicação em tempo real entre dispositivos e o servidor. Com sua leveza e baixo overhead, o MQTT facilita a troca de dados de maneira confiável, permitindo que sensores como os de movimento e câmeras se comuniquem rapidamente com o backend para o processamento de informações críticas.

| **Tecnologia**            | **Descrição**                                                                 |
|---------------------------|:-------------------------------------------------------------------------------:|
| **MQTT Broker**            | Responsável por gerenciar a troca de mensagens entre os dispositivos.          |
| **Dispositivos de Envio**  | Sensores de movimento que enviam dados via MQTT para o servidor.    |
| **Assinantes MQTT**       | Backend e aplicativos que recebem notificações sobre eventos e mudanças.      |
| **Gerenciamento de Tópicos** | Organiza os fluxos de comunicação, como o status do sistema e eventos críticos. |

Para este projeto, optamos pelo **[HiveMQ](https://www.hivemq.com/)**, uma plataforma MQTT robusta e confiável. No entanto, outras opções amplamente usadas no mercado, como o **Mosquitto**, também podem ser implementadas de acordo com a necessidade do projeto.

Com o objetivo de uma melhor organização e gestão das mensagens, nosso MQTT utiliza três tópicos principais:

| **Tópico**            | **Descrição**                                                                 |
|-----------------------|:-------------------------------------------------------------------------------:|
| **topico/Teste**       | Tópico dedicado exclusivamente para testes com o MQTT, sem funções específicas. |
| **Acesso/Permitido**   | Tópico responsável por enviar atualizações à API, sinalizando que o acesso foi autorizado. |
| **Acesso/Negado**      | Tópico que aciona os protocolos de segurança do sistema, como início de gravação, alertas e outras medidas de segurança, caso o acesso seja negado. |


---
#### ° **API RESTful para Integração de Funcionalidades**

A API RESTful desenvolvida para o SALV (Sistema de Alerta Laboratorial com Visão) desempenha um papel fundamental na integração e comunicação entre os diversos componentes do sistema. Com um design orientado a serviços, a API permite que diferentes módulos, como sensores de movimento, câmeras e a interface do aplicativo móvel, interajam de forma eficiente e segura.
 Você pode acessar a [API do SALV](https://github.com/WesleyS08/API_SALV).

| **Características**            | **Descrição**                                                                 |
|-----------------------|:-------------------------------------------------------------------------------:|
| Endpoints Bem Definidos       | A API oferece endpoints específicos para funcionalidades como autenticação, consulta de status do sistema e gerenciamento de eventos, garantindo acesso simples e direto aos dados. |
| Autenticação Segura   | A segurança é uma prioridade, com mecanismos robustos de autenticação que utilizam tokens JWT (JSON Web Tokens) para validar usuários e proteger informações sensíveis.|
| Comunicação em Tempo Real | Integração com o protocolo MQTT permite comunicação em tempo real entre dispositivos, com eventos como detecção de movimento sendo enviados imediatamente ao backend.|
| Gerenciamento de Eventos | A API registra e gerencia eventos adequadamente, acionando gravação de vídeos e notificações ao detectar atividades não autorizadas, além de registrar detalhes no banco de dados.|
| Escalabilidade e Manutenção | Com uma arquitetura modular, a API é facilmente escalável, facilitando a adição de novas funcionalidades e manutenção do sistema para atender às necessidades dos usuários.|

---
## ESP32 
Sendo uma das principais partes do sistema, este módulo requer atenção especial quanto ao seu funcionamento. Recomendamos fortemente a consulta aos arquivos no repositório [ESP32(IoT)](https://github.com/WesleyS08/SALV/tree/main/ESP32(IoT)), onde estão disponíveis os três principais arquivos:

- **ESP32 - Validação de usuários**
- **endereco_do_lcd**
- **LeitorDeCartao**

Além desses, há arquivos auxiliares, como o `validacao_de_usuarios.py`, que será citado posteriormente.

Para o desenvolvimento e upload do código, é necessário o uso da IDE Arduino.

### ESP32 - Validação de usuários

Este é o principal código do IoT, responsável pelo controle dos sensores e pelo envio de alertas via MQTT. É importante destacar que, caso a montagem do hardware seja diferente da descrita na documentação deste projeto, será necessário ajustar os seguintes parâmetros no código:

```cpp
#define PIR_PIN 4
LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ ss_pin };
MFRC522 mfrc522{ driver };
```
Além disso, é imprescindível alterar as credenciais de rede e outras configurações, como mostrado a seguir:
```cpp
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

```
Os demais códigos disponíveis são necessários para auxiliar na montagem e operação do sistema.

---

### endereco_do_lcd

Este código tem como objetivo identificar e exibir o endereço I2C do display LCD conectado ao ESP32. Isso é importante para garantir que o endereço configurado no código principal corresponda ao endereço físico do dispositivo, evitando falhas na comunicação.

A execução desse programa auxilia o usuário a encontrar o endereço correto do LCD, que pode variar dependendo do modelo ou fabricante, além de ajudar a identificar falhas.

Com esse programa, o usuário deve observar no monitor serial o endereço do LCD, que poderá ser utilizado no código principal para configurar corretamente o display:

```cpp
LiquidCrystal_I2C lcd(0x27, 16, 2);
```
onde `0x27` deve ser substituído pelo endereço encontrado, caso seja diferente.

### LeitorDeCartao

Este módulo é responsável pela interface com o leitor RFID MFRC522. Ele gerencia a leitura dos cartões RFID, exibindo o ID do cartão para o usuário, facilitando assim a identificação e o cadastro no aplicativo.

É fundamental assegurar que o pino SS (Slave Select) esteja corretamente configurado, conforme a placa utilizada (por exemplo, pino 5):

```cpp
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ ss_pin };
MFRC522 mfrc522{ driver };
```
Ressalta-se que o código considera que o ESP32 estará conectado ao `pino 5`.

Os demais códigos, como `validacaodecartao.py` e seu executável, disponíveis na pasta dist, têm como objetivo proporcionar uma interface mais amigável para o usuário.

--- 

## Autores 👨‍💻👨‍💻🎓

- [Davi de Brito Junior](https://github.com/DaveBrito)
- [Maria Luiza Cruvinel dos Santos](https://github.com/Cruvnel)
- [Wesley Silva dos Santos](https://github.com/WesleyS08)

Este trabalho foi apresentado como requisito parcial para obtenção do título de graduação tecnológica em **Desenvolvimento de Software Multiplataforma** na **Faculdade de Tecnologia Zona Sul – Dom Paulo Evaristo Arns**, sob a orientação do Prof. Dr. Winston Aparecido Andrade.
