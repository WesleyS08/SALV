# 🛡️ Sistema de Segurança Inteligente com OBS, YOLOv8 e Supabase

Sistema completo de monitoramento de segurança com detecção de pessoas/rostos, transmissão ao vivo, gravação automatizada e integração com múltiplos serviços.

## 🌟 Funcionalidades Principais

- **🎥 Captura de Vídeo Flexível**
  - Suporte para câmeras locais e IP
  - Fallback automático entre fontes de vídeo
  - Teste de conexão integrado

- **🤖 Detecção Inteligente**
  - Detecção de pessoas com YOLOv8
  - Identificação de rostos com MediaPipe
  - Exibição em tempo real com anotações

- **📡 Transmissão e Gravação**
  - Integração completa com OBS Studio via WebSocket
  - Transmissão automática para YouTube
  - Gravação local em formato MKV
  - Upload automático para Supabase Storage

- **☁️ Integração em Nuvem**
  - Armazenamento de vídeos no Supabase
  - Registro de eventos no banco de dados
  - Notificações push via Expo

- **🔌 Comunicação**
  - Controle via MQTT (ESP32-CAM)
  - API REST com Flask para streaming
  - Interface gráfica de configuração (Tkinter)
--- 
## 📦 Estrutura do Projeto

```sistema-seguranca/
├── src/
│ ├── main.py # Ponto de entrada principal
│ ├── config_gui.py # Interface de configuração
│ ├── security_config.json # Configurações públicas
│ ├── .env # Variáveis sensíveis
│ ├── models/
│ │ └── yolov8n.pt # Modelo YOLO
│ └── gravacoes/ # Pasta para gravações locais
├── requirements.txt # Dependências
└── README.md
 ```
--- 
## ⚙️ Pré-requisitos

- Python 3.8+
- OBS Studio (com WebSocket habilitado)
- Conta no Supabase
- Acesso a um broker MQTT
--- 
## 🚀 Como Executar

1. **Instalação**
```bash
pip install -r requirements.txt
 ```


2. **Configuração**

```bash
Preencha o .env com suas credenciais

Configure o OBS WebSocket (host: 192.168.1.6, porta: 4455)
 ```

Ou 

```bash
# Opção 2: Interface gráfica (recomendado)
python config_gui.py
 ```

--- 
## 🎛️ Controle via MQTT


| **Mensagem recebida**               | **Ação**                                                                                  |
|:------------------------------------:|:-----------------------------------------------------------------------------------------------:|
| **"acesso negado"**         | Inicia a gravação                |
| **"alerta cancelado, acesso liberado"**                | Encerra a gravação                                            |
---

## ⚠️ Solução de Problemas Comuns

### ❌ Problema: OBS não conecta

**Soluções possíveis:**
1. Certifique-se de que o **OBS Studio** está aberto.
2. Verifique se o **WebSocket está ativado**:
   - Vá em `Ferramentas` > `WebSocket Server Settings` no OBS.
3. Confirme se o **host**, a **porta** e a **senha** estão corretos nas configurações de conexão.

---

### ❌ Problema: OBS não inicia a live

**Soluções possíveis:**
1. Certifique-se de que o **OBS Studio** está devidamente configurado.
2. Verifique se a **transmissão está correta**:
   - Vá em `Arquivo` > `Configurações` > `Transmissão` e selecione `Serviço = Personalizado`.
3. Confirme se o **servidor**, a **chave de transmissão**, o **nome de usuário** e a **senha** estão corretos.
   - ⚠️ Essas informações podem ser encontradas na plataforma de transmissão utilizada (no nosso caso, o YouTube fornece esses dados).

---

### ❌ Problema: Câmera IP não responde

**Soluções possíveis:**
1. Teste a URL da câmera no **VLC Media Player**.
2. Verifique as **credenciais e a URL** definidas no executável `config_gui.py`.

---

### ❌ Problema: Upload falha no Supabase

**Soluções possíveis:**
1. Verifique se as **chaves de acesso** estão corretas no executável `config_gui.py`.
2. Confira as **permissões do bucket** no Supabase (leitura, escrita e acesso público, se necessário).
 ---
## 🔧 Personalização

### 🧠 Modelo YOLO
Substitua o arquivo `yolov8n.pt` por outro modelo YOLOv8 de sua escolha dentro da pasta `models/`.

---

### 🎥 Layout no OBS
Edite os valores de `NOME_CENA` e `FONTE_VIDEO` no arquivo `config_gui.py` para corresponder às suas configurações do OBS.

---

### 📐 Resolução da Câmera
Você pode ajustar a resolução da captura de vídeo no arquivo `main.py`. Exemplo:

```python
cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)  # ← Altere aqui a largura desejada
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)  # ← Altere aqui a altura desejada
```
