import os
import cv2
import time
import numpy as np
import paho.mqtt.client as paho
import subprocess
import threading
import requests
from paho import mqtt
from dotenv import load_dotenv
from supabase import create_client, Client
from flask import Flask, Response

# Carregar variáveis do arquivo .env
load_dotenv()

mqtt_username = os.getenv("MQTT_USERNAME")
mqtt_password = os.getenv("MQTT_PASSWORD")
mqtt_cluster_url = os.getenv("MQTT_CLUSTER_URL")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Conectar ao Supabase
supabase: Client = create_client(supabase_url, supabase_key)
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 

# Rede neural pré-treinada MobileNet SSD para detecção de pessoas
net = cv2.dnn.readNetFromCaffe(
    os.path.join(BASE_DIR, "modelos", "deploy.prototxt"),
    os.path.join(BASE_DIR, "modelos", "mobilenet_iter_73000.caffemodel")
)

face_detector = cv2.dnn.readNetFromCaffe(
    os.path.join(BASE_DIR, "modelos", "deployfaces.prototxt"),
    os.path.join(BASE_DIR, "modelos", "res10_300x300_ssd_iter_140000.caffemodel")
)

# Variáveis de controle para gravação
gravando = False
hora_inicio = None
hora_fim = None
frame_atual = None

# Criar aplicativo Flask
app = Flask(__name__)

def gerar_video():
    global gravando, frame_atual
    cap = cv2.VideoCapture(0) 
    
    if not cap.isOpened():
        print("Erro ao conectar à câmera.")
        return
    
    print("Câmera conectada com sucesso!")

    while gravando:  
        ret, frame = cap.read()
        if not ret:
            print("Erro ao capturar o vídeo.")
            break

        height, width = frame.shape[:2]

        blob = cv2.dnn.blobFromImage(frame, 0.007843, (300, 300), (127.5, 127.5, 127.5), swapRB=True)
        net.setInput(blob)
        detections = net.forward()

        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.6: 
                idx = int(detections[0, 0, i, 1])
                if idx == 15:  
                    box = detections[0, 0, i, 3:7] * np.array([width, height, width, height])
                    (startX, startY, endX, endY) = box.astype("int")

                    cv2.rectangle(frame, (startX, startY), (endX, endY), (174, 198, 4), 2)

                    # Recortar a região do corpo para detectar o rosto
                    body_roi = frame[startY:endY, startX:endX]
                    if body_roi.size != 0:
            
                        blob_face = cv2.dnn.blobFromImage(body_roi, 1.0, (300, 300), (104.0, 177.0, 123.0))
                        face_detector.setInput(blob_face)
                        face_detections = face_detector.forward()

                        for j in range(face_detections.shape[2]):
                            face_confidence = face_detections[0, 0, j, 2]
                            if face_confidence > 0.4: 
                                face_box = face_detections[0, 0, j, 3:7] * np.array([body_roi.shape[1], body_roi.shape[0], body_roi.shape[1], body_roi.shape[0]])
                                (face_startX, face_startY, face_endX, face_endY) = face_box.astype("int")

                                face_startX += startX
                                face_startY += startY
                                face_endX += startX
                                face_endY += startY

                                cv2.rectangle(frame, (face_startX, face_startY), (face_endX, face_endY), (213, 52, 141), 2)

                                # Recortar o rosto e aplicar o zoom
                                face_roi = frame[face_startY:face_endY, face_startX:face_endX]
                                if face_roi.size != 0:
                                    face_resized = cv2.resize(face_roi, (150, 150), interpolation=cv2.INTER_LINEAR)
                                    frame[10:160, width-160:width-10] = face_resized  # Desenha no canto superior direito ou podemos colocar uma tela separada mas acho zoado 

        frame_atual = frame

    cap.release()

def gerar_frame():
    global frame_atual
    while True:
        if frame_atual is not None:
            _, jpeg = cv2.imencode('.jpg', frame_atual)
            if jpeg is not None:
                yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')

@app.route('/')
def video_feed():
    return Response(gerar_frame(), mimetype='multipart/x-mixed-replace; boundary=frame')

def on_message(client, userdata, msg):
    global gravando, hora_inicio, hora_fim
    message = msg.payload.decode("utf-8").lower()
    print(f"Mensagem recebida do tópico {msg.topic}: {message}")

    if message == "acesso negado":
        if not gravando: 
            gravando = True
            hora_inicio = time.time()  
            print("Acesso negado! Iniciando detecção de pessoa...")
            gerar_video()
        else:
            print("Detecção já está em andamento, ignorando mensagem repetida...")

    elif message == "alerta cancelado, acesso liberado":
        if gravando:
            gravando = False
            hora_fim = time.time() 
            duracao = hora_fim - hora_inicio
            print(f"Detecção encerrada. Duração total: {duracao:.2f} segundos")

def salvar_link_ngrok(url):
    try:
        response = supabase.table('ngrok_links').upsert({"url": url}, on_conflict=["url"]).execute()
        
        if response.data:  # Verifica se a resposta contém dados
            print("Link ngrok salvo/atualizado no Supabase com sucesso")
        else:
            print("Erro ao salvar link no Supabase: Sem dados na resposta", response)
    except Exception as e:
        print(f"Erro ao conectar ao Supabase: {e}")


def start_ngrok():
    print ("Iniciando o Ngrok...")
    ngrok_process = subprocess.Popen(['C:\\ngrok\\ngrok', 'http', '5000'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    time.sleep(4)

    try:
        url = requests.get('http://localhost:4040/api/tunnels').json()
        public_url = url['tunnels'][0]['public_url']
        print(f"Seu servidor Flask está acessível em: {public_url}")
    
        salvar_link_ngrok(public_url)  # Corrigido
    except Exception as e:
        print("Erro ao obter URL do ngrok", e)

def salvar_informacoes_filmagem(inicio, fim, duracao, url_video):
    try:
        response = supabase.table('filmagens').insert([{
            'inicio': inicio,
            'fim': fim,
            'duracao': duracao,
            'url_video': url_video
        }]).execute()  # Corrigido
        if response.status_code == 200:
            print("Informações de filmagem salvas com sucesso no supabase")
        else:
            print("Erro ao salvar filmagem no supabase", response)
    except Exception as e:
        print(f"Erro ao conectar ao Supabase: {e}") 

client = paho.Client(client_id="", userdata=None, protocol=paho.MQTTv5, callback_api_version=paho.CallbackAPIVersion.VERSION2)
client.on_message = on_message
client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
client.username_pw_set(mqtt_username, mqtt_password)

print("Tentando conectar ao servidor MQTT...")
while True:
    try:
        client.connect(mqtt_cluster_url, 8883)
        print("Conectado ao servidor MQTT com sucesso!")
        client.subscribe("alert", qos=0)
        break
    except Exception as e:
        print(f"Erro ao conectar: {e}. Tentando novamente em 5 segundos...")
        time.sleep(5)

# Rodar o Flask em uma thread separada
flask_thread = threading.Thread(target=app.run, kwargs={"host": "0.0.0.0", "port": 5000, "threaded": True})
flask_thread.start()

# Iniciar o ngrok
ngrok_thread = threading.Thread(target=start_ngrok)  # Corrigido
ngrok_thread.start()

client.loop_forever()
