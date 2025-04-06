# 🛡️ Sistema de Detecção e Gravação com YOLOv8, MediaPipe, Flask, MQTT e Supabase

Este projeto é um sistema completo de detecção de pessoas e rostos em vídeo, com funcionalidades como:

- Detecção de pessoas com **YOLOv8**
- Detecção de rostos com **MediaPipe**
- Transmissão ao vivo via **Flask**
- Controle via mensagens MQTT (ESP32-CAM)
- Upload e registro automático de gravações no **Supabase**
- Integração com **ngrok** para expor a câmera via internet

---

## 🚀 Funcionalidades

- 🧠 **Detecção de Pessoas e Rostos:** Utiliza YOLOv8 para detectar pessoas e MediaPipe para detectar rostos dentro das caixas de detecção de corpo.
- 🎥 **Gravação de vídeo:** Inicia gravação automática ao receber um alerta `acesso negado` via MQTT.
- ☁️ **Upload para Supabase Storage:** Ao final da gravação, o vídeo é enviado para o Supabase e suas informações são salvas em uma tabela.
- 🌐 **Transmissão em tempo real:** O vídeo ao vivo é acessível por Flask no endereço ou usando o ngrok `http://localhost:5000`.
- 🔒 **Controle via MQTT:** A gravação é iniciada ou encerrada com base em comandos recebidos do tópico MQTT `"alert"`.

---

## ⚙️ Como Funciona

### 1. Carregamento dos Modelos
```python
yolo_model = YOLO("yolov8n.pt")  # Modelo YOLOv8
face_detector = mp_face_detection.FaceDetection(...)
```

### 2. Início automático da câmera

 câmera é iniciada assim que a gravação começa *(acesso negado)* e finalizada quando o alerta é cancelado *(acesso liberado)*.

### 3. Detecção e Gravação

Durante a gravação:

- Cada frame é analisado.

- Se houver uma pessoa, é desenhado um retângulo.

- Se houver um rosto, ele é exibido em close-up no canto superior direito.

- O vídeo é salvo localmente e depois enviado ao Supabase.

### 4. Upload + Registro

```python
# Envia o vídeo
enviar_video_supabase()

# Registra no banco de dados Supabase
salvar_informacoes_filmagem()
```
---
## 🧪 Como Executar

 1. Instale os requisitos:
```python
pip install -r requirements.txt
```
 2. Crie o arquivo .env com suas chaves:

```env
MQTT_USERNAME=seu_usuario
MQTT_PASSWORD=sua_senha
MQTT_CLUSTER_URL=broker.exemplo.com
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=sua_chave
```
 3. Execute o script:

```bash
python main.py
```
---
## 📡 Tópicos MQTT

| **Mensagem recebida**               | **Ação**                                                                                  |
|:------------------------------------:|:-----------------------------------------------------------------------------------------------:|
| **"acesso negado"**         | Inicia a gravação                |
| **"alerta cancelado, acesso liberado"**                | Encerra a gravação                                            |
---
## 📁 Estrutura do Projeto

```bash
.src
├── main.py
├── gravacoes/
│   └── gravacao_2024....avi
├── models/
│   └── yolov8n.pt
├── .env
└── README.md
```
---
## 📌 Observações

O ngrok está configurado para rodar. Comente a linha abaixo caso seu ambiente nao esteja configurado para tal:

```python
threading.Thread(target=start_ngrok).start()
```
- O cv2.VideoCapture(1) indica que sua câmera está no índice 1. Se não funcionar, troque por 0.

- Para evitar o erro could not broadcast input array, certifique-se que o rosto detectado tenha dimensão válida antes de usar cv2.resize.
---

## 🧠 Tecnologias Utilizadas

- YOLOv8 (Ultralytics)

- MediaPipe

- OpenCV

- Flask

- Supabase

- MQTT (paho-mqtt)

- dotenv

- Ngrok

