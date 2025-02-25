import os
import cv2
import time
import paho.mqtt.client as paho
from paho import mqtt
from dotenv import load_dotenv
import matplotlib.pyplot as plt
import numpy as np
from supabase import create_client, Client  

# Carregar variáveis do arquivo .env
load_dotenv()

mqtt_username = os.getenv("MQTT_USERNAME")
mqtt_password = os.getenv("MQTT_PASSWORD")
mqtt_cluster_url = os.getenv("MQTT_CLUSTER_URL")
supabase_url = os.getvenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")


#banco de dados
supabase: Client = create_client(supabase_url, supabase_key)

# Carregar a rede neural pré-treinada MobileNet SSD para detecção de pessoas fiz essa mudanca para ter uma precisao maior 
net = cv2.dnn.readNetFromCaffe("backend\src\modelos\deploy.prototxt", "backend\src\modelos\mobilenet_iter_73000.caffemodel")


#topicos
def obter_topicos():
    try:
        #colocar um if para trazer do usario especifico
        response = supabase.table('topicos').select('topicos').execute()
        if response.data:
            topicos = [t['topico'] for t in response.data]
            return topicos
        else: 
            return ["seguranca/acesso"]
        except Exception as e:
            print(f"Error ao buscar topicos no Supabase: {e}")
            return["seguranca/acesso"]


# Função chamada quando a conexão com o broker MQTT é estabelecida
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        client.publish("teste_de_conexao", payload="Conexão bem-sucedida", qos=1)
        print("Mensagem enviada para o servidor: 'Conexão bem-sucedida'")

        topicos = obter_topicos()
        for topico in topicos:
            client.subscribe(topico, qos=1)
            print(f"Inscrito no topico {topico}")

# Função chamada quando uma mensagem é recebida do servidor MQTT
def on_message(client, userdata, msg):
    message = msg.payload.decode("utf-8")
    print(f"Mensagem recebida: {message}")
    
    # Se a mensagem for 'usuário não autorizado', inicia a detecção de pessoa
    if message.lower() == "usuário não autorizado":
        print("Acesso negado!  Iniciando detecção de pessoa...")
        detectar_pessoa_dnn()

# Função para detectar pessoas usando MobileNet SSD
def detectar_pessoa_dnn():
    cap = cv2.VideoCapture(0)  # Captura de vídeo do DroidCam

    if not cap.isOpened():
        print("Erro ao conectar à câmera.")
        return

    while True:
        ret, frame = cap.read() 
        if not ret:
            print("Erro ao capturar o vídeo.")
            break

        # Converte a imagem para o formato que a rede exige
        blob = cv2.dnn.blobFromImage(frame, 0.007843, (300, 300), (127.5, 127.5, 127.5), swapRB=True)

        # Processa a imagem com a rede
        net.setInput(blob)
        detections = net.forward()

        # Itera pelas detecções
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.5:  # Se a confiança for maior que 50% isso podemos ajustar futuramente mas por hora é isso mesmo
                idx = int(detections[0, 0, i, 1])
                if idx == 15:  # 15 corresponde a pessoa no modelo
                    # Obtém as coordenadas do retângulo de detecção
                    box = detections[0, 0, i, 3:7] * np.array([frame.shape[1], frame.shape[0], frame.shape[1], frame.shape[0]])
                    (startX, startY, endX, endY) = box.astype("int")
                    cv2.rectangle(frame, (startX, startY), (endX, endY), (255, 0, 255), 2)  # Desenha o retângulo

        # Exibe o vídeo ao vivo na janela do OpenCV
        cv2.imshow("Detecção de Pessoas", frame)

        # Pressione 'q' para sair da detecção ao vivo talvez eu faca o cancelamento ser automatico atravez do mqtt
        if cv2.waitKey(1) & 0xFF == ord('q'):
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
