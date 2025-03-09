import os
import cv2
import time
import paho.mqtt.client as paho
from paho import mqtt
from dotenv import load_dotenv
import numpy as np
from supabase import create_client, Client  

# Carregar variáveis do arquivo .env
load_dotenv()

mqtt_username = os.getenv("MQTT_USERNAME")
mqtt_password = os.getenv("MQTT_PASSWORD")
mqtt_cluster_url = os.getenv("MQTT_CLUSTER_URL")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Conectar ao Supabase
supabase: Client = create_client(supabase_url, supabase_key)

# Rede neural pré-treinada MobileNet SSD para detecção de pessoas
net = cv2.dnn.readNetFromCaffe("backend/src/modelos/deploy.prototxt", "backend/src/modelos/mobilenet_iter_73000.caffemodel")

# Variáveis de controle para gravação
gravando = False
hora_inicio = None
hora_fim = None

def on_message(client, userdata, msg):
    global gravando, hora_inicio, hora_fim
    message = msg.payload.decode("utf-8").lower()
    print(f"Mensagem recebida do tópico {msg.topic}: {message}")

    if message == "acesso negado":
        print(f"Status da variável gravando antes: {gravando}")
        if not gravando:  # Só inicia se ainda não estiver gravando
            gravando = True
            hora_inicio = time.time()  # Armazena o horário do início
            print("Acesso negado! Iniciando detecção de pessoa...")
            detectar_pessoa_dnn()
        else:
            print("Detecção já está em andamento, ignorando mensagem repetida...")
        print(f"Status da variável gravando depois: {gravando}")

    elif message == "alerta cancelado, acesso liberado":
        if gravando:
            gravando = False
            hora_fim = time.time()  # Armazena o horário do fim
            duracao = hora_fim - hora_inicio
            print(f"Detecção encerrada. Duração total: {duracao:.2f} segundos")
            cv2.destroyAllWindows()  # Fecha qualquer janela aberta
        else:
            print("Nenhuma detecção em andamento para cancelar.")

def detectar_pessoa_dnn():
    global gravando
    print("Tentando abrir a câmera...")
    cap = cv2.VideoCapture(0)  # Captura de vídeo do DroidCam
    
    if not cap.isOpened():
        print("Erro ao conectar à câmera.")
        return
    
    print("Câmera conectada com sucesso!")

    while gravando:  
        ret, frame = cap.read()
        if not ret:
            print("Erro ao capturar o vídeo.")
            break

        # Definir uma área de busca restrita (parte inferior da tela)
        height, width = frame.shape[:2]
        roi_top = int(height / 3)  # 1/3 inferior da tela
        roi_bottom = height
        roi_left = 0
        roi_right = width

        frame_roi = frame[roi_top:roi_bottom, roi_left:roi_right]  # Cortar a área da imagem

        blob = cv2.dnn.blobFromImage(frame_roi, 0.007843, (300, 300), (127.5, 127.5, 127.5), swapRB=True)
        net.setInput(blob)
        detections = net.forward()

        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.6:  # Aumentando o valor de confiança
                idx = int(detections[0, 0, i, 1])
                if idx == 15:  # 15 corresponde a pessoa no modelo
                    box = detections[0, 0, i, 3:7] * np.array([frame_roi.shape[1], frame_roi.shape[0], frame_roi.shape[1], frame_roi.shape[0]])
                    (startX, startY, endX, endY) = box.astype("int")
                    startX += roi_left  # Ajustar a posição X
                    startY += roi_top   # Ajustar a posição Y
                    endX += roi_left    # Ajustar a posição X
                    endY += roi_top     # Ajustar a posição Y
                    cv2.rectangle(frame, (startX, startY), (endX, endY), (255, 0, 255), 2)  # Desenha o retângulo na imagem original

                    # Zoom no rosto da pessoa
                    face = frame[startY:endY, startX:endX]
                    if face.size != 0:  # Verifica se a região do rosto não está vazia
                        face_resized = cv2.resize(face, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
                        cv2.imshow("Zoom no Rosto", face_resized)

        cv2.imshow("filmagem do comodo", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

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
        print("Inscrito no tópico 'alert'")
        break
    except Exception as e:
        print(f"Erro ao conectar: {e}. Tentando novamente em 5 segundos...")
        time.sleep(5)

client.loop_forever()
