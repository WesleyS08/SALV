import time
import paho.mqtt.client as paho
from paho import mqtt
from dotenv import load_dotenv
import os

# Carregar variáveis do arquivo .env
load_dotenv()

# Acessar as variáveis de ambiente
mqtt_username = os.getenv("MQTT_USERNAME")
mqtt_password = os.getenv("MQTT_PASSWORD")
mqtt_cluster_url = os.getenv("MQTT_CLUSTER_URL")

# Configurar callbacks para diferentes eventos
def on_connect(client, userdata, flags, rc, properties=None):
    print("CONNACK recebido com código %s." % rc)
    if rc == 0:  # Se a conexão foi bem-sucedida
        # Enviar uma mensagem ao servidor após a conexão bem-sucedida
        client.publish("teste_de_conexao", payload="Conexão bem-sucedida", qos=1)
        print("Mensagem enviada para o servidor: 'Conexão bem-sucedida'")

def on_publish(client, userdata, mid, properties=None):
    pass 

def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    pass 

def on_message(client, userdata, msg):
    pass 

# Criar o cliente MQTT (usando a versão mais recente do protocolo)
client = paho.Client(client_id="", userdata=None)
client.on_connect = on_connect

# Habilitar TLS para conexão segura
client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)

# Configurar nome de usuário e senha
client.username_pw_set(mqtt_username, mqtt_password)

# Conectar ao HiveMQ Cloud
client.connect(mqtt_cluster_url, 8883)

# Configurar callbacks
client.on_subscribe = on_subscribe
client.on_message = on_message
client.on_publish = on_publish

# Assinar os tópicos
client.subscribe("teste_de_conexao", qos=1)

# Iniciar o loop
client.loop_forever()
