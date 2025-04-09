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


## Autores 👨‍💻👨‍💻🎓

- **Davi de Brito Junior**
- **Wesley Silva dos Santos**

Este trabalho foi apresentado como requisito parcial para obtenção do título de graduação tecnológica em **Desenvolvimento de Software Multiplataforma** na **Faculdade de Tecnologia Zona Sul – Dom Paulo Evaristo Arns**, sob a orientação do Prof. Dr. Winston Aparecido Andrade.
