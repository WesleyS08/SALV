# SALV - Sistema de Alerta Laboratorial com Visão ⚡🔍📡

**SALV** é um sistema de segurança integrado que utiliza tecnologias como detecção de movimento, reconhecimento facial e notificações em tempo real. Projetado para monitoramento automatizado de laboratórios ou ambientes restritos, oferece uma solução acessível e eficiente para controle de acesso e proteção de dados.

---

## 🚀 Índice

- [Sobre o Projeto](#sobre-o-projeto-)
- [Autores](#autores-)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)

  
---

## Sobre o Projeto ⚡🔍📡

SALV (Sistema de Alerta Laboratorial com Visão) é uma solução de segurança que integra a detecção de movimento, reconhecimento facial e notificações instantâneas para monitoramento eficiente e automatizado de ambientes. Ideal para laboratórios e locais restritos, o sistema oferece proteção de dados e controle de acesso acessível e de baixo custo.

---

## Autores 👨‍💻👨‍💻🎓

- **Davi de Brito Junior**
- **Wesley Silva dos Santos**

Este trabalho foi apresentado como requisito parcial para obtenção do título de graduação tecnológica em **Desenvolvimento de Software Multiplataforma** na **Faculdade de Tecnologia Zona Sul – Dom Paulo Evaristo Arns**, sob a orientação do Prof. Dr. Winston Aparecido Andrade.

---

## Funcionalidades

| **Funcionalidade**                | **Descrição**                                                                                  |
|------------------------------------|-----------------------------------------------------------------------------------------------|
| **Detecção de Movimento**          | Monitora o ambiente e ativa o sistema quando movimento é detectado.                           |
| **Detecção Facial**                | Reconhece o rosto da pessoa e destaca na filmagem.                                            |
| **Autenticação com Cartões de Acesso** | Permite o acesso apenas a usuários com cartões válidos.                                   |
| **Gravação Automática**            | Registra imagens e vídeos quando acessos não autorizados são detectados.                      |
| **Notificações em Tempo Real**    | Envia alertas instantâneos para o aplicativo móvel, permitindo respostas rápidas.              |


---

## Tecnologias Utilizadas

O SALV foi desenvolvido com uma série de tecnologias e APIs divididas em três componentes principais para garantir escalabilidade, eficiência e facilidade de manutenção. Confira abaixo as tecnologias utilizadas:

### 1. **Hardware e Sensores**

Responsáveis pela captura de dados do ambiente, utilizando sensores de movimento, câmeras e dispositivos de autenticação.

| **Tecnologia**              | **Descrição**                                                               |
|-----------------------------|----------------------------------------------------------------------------|
| **ESP32**                   | Controladores que integram sensores e comunicam com o sistema central.      |
| **Raspberry Pi Camera**     | Câmeras que capturam imagens para a detecção facial.                        |
| **Webcam**                  | Alternativa para o Raspberry Pi câmera afim de diminuir o custo             |
| **Leitor RFID**             | Permite autenticação através de cartões de acesso.                          |
| **LCD ( Pode ser substituído por leds)**                     | Melhora no entendimento do sistema permitindo repassar mensagens do sistema.|
| **Comunicação via MQTT**    | Protocolo de comunicação eficiente para troca de dados entre dispositivos.  |

---

### 2. **Software e Backend**

O software é responsável pelo processamento dos dados, incluindo a detecção facial, autenticação de usuários e envio de notificações.

| **Tecnologia**              | **Descrição**                                                               |
|-----------------------------|----------------------------------------------------------------------------|
| **OpenCV**                  | Biblioteca para detecção de movimento e faces em tempo real.                |
| **Python**                  | Linguagem principal para controle e análise das imagens e dados.           |
| **Supabase**                | Banco de dados e serviço de autenticação segura.                            |
| **React Native**            | Framework para o desenvolvimento do aplicativo móvel.                       |
| **Firebase Cloud Messaging**| Envio de notificações em tempo real para o aplicativo móvel.               |
| **Supabase Store**          | Armazenamento de imagens e vídeos de acessos não autorizados.               |

---

### 3. **Protocolos de Automação**

Esses protocolos garantem a operação contínua e autônoma do sistema, com funcionalidades como inicialização automática e acionamento remoto de dispositivos.

| **Tecnologia**           | **Descrição**                                                               |
|--------------------------|----------------------------------------------------------------------------|
| **Wake-on-Lan (WOL)**     | Permite ligar o PC remotamente usando o ESP32, caso o PC esteja desligado. |
| **Task Scheduler**        | Automatiza a inicialização do programa Python ao ligar o PC.                |
| **AutoStart (Python Script)** | Configuração para iniciar automaticamente os serviços ao ligar a máquina. |

---

