import os
import cv2
import time
import paho.mqtt.client as paho
from paho import mqtt
from dotenv import load_dotenv
import matplotlib.pyplot as plt

# Carregar variáveis do arquivo .env
load_dotenv()

mqtt_username = os.getenv("MQTT_USERNAME")
mqtt_password = os.getenv("MQTT_PASSWORD")
mqtt_cluster_url = os.getenv("MQTT_CLUSTER_URL")

# Função chamada quando a conexão com o broker MQTT é estabelecida
def on_connect(client, userdata, flags, rc, properties=None):
    print("CONNACK recebido com código %s." % rc)
    if rc == 0:
        client.publish("teste_de_conexao", payload="Conexão bem-sucedida", qos=1)
        print("Mensagem enviada para o servidor: 'Conexão bem-sucedida'")
        client.subscribe("seguranca/acesso", qos=1)

# Função chamada quando uma mensagem é recebida do servidor MQTT
def on_message(client, userdata, msg):
    message = msg.payload.decode("utf-8")
    print(f"Mensagem recebida: {message}")
    
    # Se a mensagem for 'usuário não autorizado', inicia a detecção de pessoa
    if message.lower() == "usuário não autorizado":
        print("Acesso negado! Iniciando detecção de pessoa...")
        detectar_pessoa()

# Função para detectar rosto e corpo da pessoa
def detectar_pessoa():
    url = "http://192.168.1.7:4747/video"  # Certifique-se de que o IP esteja correto
    cap = cv2.VideoCapture(0)  # Captura de vídeo do DroidCam

    if not cap.isOpened():
        print("Erro ao conectar à câmera do celular. Verifique o IP e o app.")
        return

    # Carregar os classificadores para rosto e corpo inteiro
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    body_detector = cv2.HOGDescriptor()
    body_detector.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    while True:
        ret, frame = cap.read()  # Captura um novo quadro do vídeo
        if not ret:
            print("Erro ao capturar o vídeo.")
            break

        # Converte o quadro para escala de cinza para melhor detecção de faces
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detecção de rostos
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        # Detecção de corpo inteiro
        bodies, _ = body_detector.detectMultiScale(frame, winStride=(4, 4), padding=(8, 8), scale=1.05)

        # Desenha retângulos ao redor do rosto
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
            face = frame[y:y + h, x:x + w]
            cv2.imwrite("face_detectada.jpg", face)
            print("Imagem do rosto salva!")

        # Desenha retângulos ao redor do corpo
        for (x, y, w, h) in bodies:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        # Exibe o vídeo ao vivo na janela do OpenCV
        cv2.imshow("Detecção ao Vivo", frame)

        # Pressione 'q' para sair da detecção ao vivo
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Saindo da detecção...")
            break

    cap.release()  # Libera o recurso da câmera
    cv2.destroyAllWindows()  # Fecha todas as janelas abertas pelo OpenCV

# Configuração do cliente MQTT
client = paho.Client(client_id="", userdata=None, protocol=paho.MQTTv5)
client.on_connect = on_connect
client.on_message = on_message
client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
client.username_pw_set(mqtt_username, mqtt_password)

# Loop para reconectar até o sucesso
while True:
    try:
        client.connect(mqtt_cluster_url, 8883)
        client.subscribe("seguranca/acesso", qos=1)  
        break
    except Exception as e:
        print(f"Erro ao conectar: {e}. Tentando novamente em 5 segundos...")
        time.sleep(5)

# Loop MQTT
client.loop_forever()
