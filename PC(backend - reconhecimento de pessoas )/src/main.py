# 1. Sistema Operacional e Processos
import json
import os
import time
import threading
import subprocess
import psutil
from flask import Flask, Response

# 2. Manipulação de Imagens e Vídeos
import numpy as np
import cv2
import pyvirtualcam
from pathlib import Path
import screeninfo

# 3. Controle de Datas e Horários
from datetime import datetime, timedelta

# 4. Integração com o OBS Studio (Gravação/Transmissão)
import obsws_python
from obsws_python import ReqClient
import obsws_python as obs

# 5. Comunicação HTTP
import requests

# 6. Modelo de Detecção de Objetos (YOLO)
from ultralytics import YOLO

# 7. Detecção de Rostos e Poses (MediaPipe)
import mediapipe as mp

# 8. Comunicação via MQTT (Mensageria)
import paho.mqtt.client as mqtt

# 9. Carregamento de Variáveis de Ambiente (.env)
from dotenv import load_dotenv

# 10. Integração com Banco de Dados Supabase
from supabase import create_client, Client

# 11. Google OAuth2 (Autenticação com Google)
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
from googleapiclient.errors import HttpError


# Configurações
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Configura OBS
OBS_WS_HOST = "192.168.1.6"
OBS_WS_PORT = 4455
OBS_WS_PASSWORD = os.getenv("OBS_WS_PASSWORD")
NOME_CENA = "Deteccao"
streams_configurados = []
FONTE_VIDEO = "Camera_Seguranca"  
NOME_CENA = "Detecção" 


# Banco de dados
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)
usuario_id = "aQOzP7V12TgUUqmSUWC7d020jWu2"


# Inicializa variáveis
obs = None
grava = False 
transmite = False
fps = 30  

# Caminho do token e do client_secret
TOKEN_PICKLE = os.path.join(os.getcwd(), 'src', 'token.pickle')
client_secrets_file = os.path.join(os.getcwd(), 'src', 'client_secret.json')
mp_face = mp.solutions.face_detection
SCOPES = ['https://www.googleapis.com/auth/youtube'] 

# Verificar se os arquivos existem
if os.path.exists(TOKEN_PICKLE):
    print(f"✅ Token encontrado: {TOKEN_PICKLE}")
else:
    print(f"❌ Token não encontrado em: {TOKEN_PICKLE}")
print()  # Linha em branco

if os.path.exists(client_secrets_file):
    print(f"✅ Client Secret encontrado: {client_secrets_file}")
else:
    print(f"❌ Client Secret não encontrado em: {client_secrets_file}")
print()  # Linha em branco

# Verificar se o arquivo do modelo YOLO existe antes de carregá-lo
yolo_model_path = os.path.join(BASE_DIR, "models", "yolov8n.pt")
if os.path.exists(yolo_model_path):
    yolo_model = YOLO(yolo_model_path)
    print(f"✅ Modelo YOLO encontrado: {yolo_model_path}")
else:
    print(f"❌ Modelo YOLO não encontrado em: {yolo_model_path}")
print()  # Linha em branco

# Verificar se o módulo MediaPipe foi carregado corretamente
if mp_face:
    print("✅ Módulo de detecção de rosto MediaPipe carregado com sucesso.")
else:
    print("❌ Módulo de detecção de rosto MediaPipe não carregado.")
print()  # Linha em branco

streaming_output = None

#configuração  do IP_WebCam
IP_WEBCAM_URL = "http://192.168.0.167:8080/video" 
IP_WEBCAM_STATUS = "http://192.168.0.167:8080/status.json"
IP_WEBCAM_USER = None  
IP_WEBCAM_PASS = None 

app = Flask(__name__)
latest_frame = None
frame_lock = threading.Lock()

#  Esta função verifica se o OBS Studio (versão 64 bits) está rodando.
def is_obs_running():
    for proc in psutil.process_iter(attrs=['pid', 'name']):
        if proc.info['name'] == 'obs64.exe':
            return True
    return False

# Testa camera do ip_webcam
def testar_conexao_ip_webcam():
    try:
        auth = (IP_WEBCAM_USER, IP_WEBCAM_PASS) if IP_WEBCAM_USER else None
        response = requests.get(IP_WEBCAM_STATUS, auth=auth, timeout=5)
        if response.status_code == 200:
            print("✅ Conexão com IP Webcam bem-sucedida!")
            return True
        print(f"❌ Erro na conexão: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Falha ao conectar ao IP Webcam: {str(e)}")
    return False

def debug_obs_config():
    print("\n🔍 Configuração atual do OBS:")
    try:
        # Lista cenas
        scenes = obs.get_scene_list().scenes
        print(f"Cenas disponíveis: {[s['sceneName'] for s in scenes]}")
        
        # Lista fontes na cena
        if NOME_CENA in [s['sceneName'] for s in scenes]:
            items = obs.get_scene_item_list(NOME_CENA).scene_items
            print(f"Fontes em '{NOME_CENA}': {[i['sourceName'] for i in items]}")
        
        # Lista dispositivos de entrada
        inputs = obs.get_input_list().inputs
        print(f"Dispositivos de entrada: {[i['inputName'] for i in inputs]}")
        
    except Exception as e:
        print(f"Erro no debug: {e}")

# Inicio o OBS 
def iniciar_obs():
    try:
        if is_obs_running():
            return True
            
        obs_path = r"C:\Program Files\obs-studio\bin\64bit\obs64.exe"
        subprocess.Popen([obs_path], cwd=os.path.dirname(obs_path))
        print("🔄 Iniciando OBS...")
        time.sleep(10) 
        return True
        
    except Exception as e:
        print(f"Erro ao iniciar OBS: {e}")
        return False

#conecta ao obs 
def conectar_obs():
    global obs
    try:
        obs = ReqClient(
            host=OBS_WS_HOST,
            port=OBS_WS_PORT,
            password=OBS_WS_PASSWORD,
            timeout=10
        )
        
        version = obs.get_version()
        print(f"✅ Conectado ao OBS v{version.obs_version}")
        print(f"• WebSocket v{version.obs_web_socket_version}")
        print(f"• Plataforma: {version.platform}")
        
        try:
            obs.get_stats()
            print("🔓 Permissões do WebSocket validadas")
            return True
        except Exception as e:
            print(f"⚠️ Aviso: Limitações de permissão - {str(e)}")
            return True
            
    except Exception as e:
        print(f"❌ Falha na conexão OBS: {str(e)}")
        return False

# Função para configurar a cena no OBS usando a webcam virtual
def configurar_cena_obs(nome_fonte="Camera_Seguranca"):
    global obs, NOME_CENA
    
    try:
        print("\nConfigurando OBS com  servidor Flask...")
        # 1. Verificar/Criar cena
        try:
            cenas = obs.get_scene_list().scenes
            if not any(c['sceneName'] == NOME_CENA for c in cenas):
                obs.send("CreateScene", {"sceneName": NOME_CENA})
                print(f"Cena '{NOME_CENA}' criada")
                time.sleep(1)
        except Exception as e:
            print(f"Erro ao verificar/criar cena: {str(e)}")
            return False

        # Obtém a resolução da tela
        screen = screeninfo.get_monitors()[0]
        screen_width = screen.width
        screen_height = screen.height

        #2. Configurações da webcam virtual
        settings = {
            "url": "http://localhost:5000/video_feed",
            "width": screen_width,
            "height": screen_height,
            "fps": 30,
        }

        # 3. Verificar se a fonte já existe
        try:
            inputs = obs.get_input_list().inputs
            fonte_existe = any(i['inputName'] == nome_fonte for i in inputs)

            if fonte_existe:
                # Apagar a fonte existente antes de criar uma nova
                obs.send("RemoveInput", {"inputName": nome_fonte})
                print(f"Fonte '{nome_fonte}' removida")
                time.sleep(0.5)

            # Criar nova fonte
            obs.send("CreateInput", {
                "sceneName": NOME_CENA,
                "inputName": nome_fonte,
                "inputKind": "browser_source",
                "inputSettings": settings
            })
            print(f"Fonte '{nome_fonte}' criada")
            
            # Adicionar à cena se não estiver presente
            items = obs.send("GetSceneItemList", {"sceneName": NOME_CENA}).scene_items
            if not any(i['sourceName'] == nome_fonte for i in items):
                obs.send("CreateSceneItem", {
                    "sceneName": NOME_CENA,
                    "sourceName": nome_fonte,
                    "sceneItemEnabled": True
                })
                print(f"Fonte adicionada à cena '{NOME_CENA}'")

        except Exception as e:
            print(f"Erro ao configurar fonte: {str(e)}")
            return False

        # 4. Definir cena ativa
        obs.send("SetCurrentProgramScene", {"sceneName": NOME_CENA})
        print("Configuração concluída com sucesso!")
        return True

    except Exception as e:
        print(f"ERRO CRÍTICO: {str(e)}")
        
        return False


def autenticar_google_api():
    creds = None

    try:
        if os.path.exists(TOKEN_PICKLE):
            with open(TOKEN_PICKLE, 'rb') as token:
                creds = pickle.load(token)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"⚠️ Erro ao tentar atualizar o token expirado: {e}")
                    creds = None  
            else:
                creds = None  

        
        if not creds:
            print("🔐 Iniciando novo fluxo de autenticação com o Google...")
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets_file, SCOPES)
            creds = flow.run_local_server(port=0)

            with open(TOKEN_PICKLE, 'wb') as token:
                pickle.dump(creds, token)

        youtube = build('youtube', 'v3', credentials=creds)
        return youtube

    except Exception as e:
        print(f"❌ Erro na autenticação com Google API: {e}")
        return None



def configurar_e_iniciar_stream_youtube(obs_client, youtube):
    global usuario_id
    max_tentativas = 3
    tentativa = 0
    

    while tentativa < max_tentativas:
        try:
            # Verificar conexão com o OBS
            if obs_client is None:
                print("OBS não está conectado! Tentando reconectar...")
                obs_client = conectar_obs() 
                if not obs_client:
                    time.sleep(2)
                    tentativa += 1
                    continue

            # Verificar status de transmissão no OBS
            status = obs_client.get_stream_status()
            if not status.output_active:
                # Configurar cena se necessário
                cenas = obs_client.get_scene_list()
                nomes_cenas = [scene['sceneName'] for scene in cenas.scenes]
                
                if NOME_CENA in nomes_cenas:
                    obs_client.set_current_program_scene(NOME_CENA)
                    print(f"Mudando para cena: {NOME_CENA}")

                # 1️⃣ Criar Stream no YouTube
                stream_url, stream_key, stream_id = criar_stream_youtube(youtube)
                print("✅ Stream criado com sucesso!")

                # 2️⃣ Criar Broadcast no YouTube
                broadcast_id, live_url = criar_broadcast_youtube(youtube)
                print("✅ Broadcast criado com sucesso!")

                # 3️⃣ Vincular o Stream à Broadcast
                vincular_stream_a_broadcast(youtube, broadcast_id, stream_id)
                print(f"✅ Stream vinculado com sucesso ao broadcast.")

                # 4️⃣ Configurar Stream no OBS - MÉTODO CORRETO para obsws_python
                obs_client.set_stream_service_settings(
                    "rtmp_custom",  
                    {
                        "server": stream_url,
                        "key": stream_key,
                        "use_auth": False
                    }
                    )
                print("✅ Configurações de stream no OBS aplicadas.")

                # 5️⃣ Iniciar transmissão no OBS
                obs_client.start_stream()
                print("🎥 Transmissão iniciada automaticamente!")

                # 6️⃣ Salvar URL da transmissão no Supabase
                try:
                    if not usuario_id:
                        print("❌ Erro: ID_Usuarios não fornecido!")
                        return None

                    supabase.table('ngrok_links').upsert({
                        'ID_Usuarios': usuario_id,
                        'url': live_url,
                        'created_at': datetime.utcnow().isoformat(),
                        'updated_at': datetime.utcnow().isoformat(),
                        'AoVivo': True
                    }).execute()

                    print("✅ URL salva no Supabase com sucesso.")

                except Exception as e:
                    print(f"⚠️ Erro ao salvar URL no Supabase: {e}")

                return True
            else:
                print("OBS já está transmitindo!")
                return True

        except Exception as e:
            print(f"Erro ao iniciar transmissão (tentativa {tentativa + 1}/{max_tentativas}): {str(e)}")
            time.sleep(2)
            tentativa += 1
            if tentativa < max_tentativas:
                try:
                    obs_client.disconnect()
                except:
                    pass
                obs_client = conectar_obs()

    print("❌ Falha ao iniciar transmissão após várias tentativas.")
    return False


# Função para criar stream no YouTube
def criar_stream_youtube(youtube):
    try:
        print("🎛️ Criando stream no YouTube...")

        # Definir os dados para o stream
        stream_request_body = {
            "snippet": {
                "title": "Segurança Automática 24 horas", 
                "description": "Transmissao ao vivo de segurança",
            },
            "cdn": {
                "frameRate": "30fps",
                "resolution": "720p",  # ou '1080p', '480p', etc
                "ingestionType": "rtmp"
            },
            "contentDetails": {
                "isReusable": False
            }
        }

        # Criar o stream no YouTube
        request = youtube.liveStreams().insert(
            part="snippet,cdn,contentDetails",
            body=stream_request_body
        )

        response = request.execute()

        # Validar se a resposta contém os campos esperados
        if "cdn" not in response or "ingestionInfo" not in response["cdn"]:
            print("❌ Erro: resposta inválida da API ao criar stream.")
            return None, None, None

        stream_url = response["cdn"]["ingestionInfo"]["ingestionAddress"]
        stream_key = response["cdn"]["ingestionInfo"]["streamName"]
        stream_id = response["id"]

        print("✅ Stream criado com sucesso!")
        return stream_url, stream_key, stream_id

    except HttpError as e:
        error_content = e.content.decode()
        print(f"❌ Erro ao criar stream: {e.status_code} — {error_content}")

        if e.status_code == 400:
            print("👉 Verifique se os valores de 'resolution' e 'ingestionType' estão corretos.")
        elif e.status_code == 403:
            print("🚫 Permissão insuficiente. Verifique se sua conta e token têm escopo 'youtube' e 'youtube.force-ssl'.")
        else:
            print("⚠️ Erro inesperado ao criar o stream.")

        return None, None, None

    except Exception as ex:
        print(f"❌ Erro inesperado ao criar stream: {ex}")
        return None, None, None

def criar_broadcast_youtube(youtube):
    try:
        print("🎥 Criando broadcast no YouTube...")

        broadcast_request_body = {
            "snippet": {
                "title": "Minha live automática",
                "description": "Live transmitida via OBS e API",
                "scheduledStartTime": datetime.utcnow().isoformat() + "Z"
            },
            "status": {
                "privacyStatus": "public"
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True
            }
        }

        request = youtube.liveBroadcasts().insert(
            part="snippet,status,contentDetails",
            body=broadcast_request_body
        )

        response = request.execute()

        if "id" not in response:
            print("❌ Erro: resposta inválida da API ao criar broadcast.")
            return None, None

        broadcast_id = response["id"]
        live_url = f"https://www.youtube.com/watch?v={broadcast_id}"

        print("✅ Broadcast criado com sucesso!")
        return broadcast_id, live_url

    except HttpError as e:
        error_content = e.content.decode()
        print(f"❌ Erro ao criar broadcast: {e.status_code} — {error_content}")

        if e.status_code == 400:
            print("👉 Verifique os parâmetros enviados no corpo da requisição.")
        elif e.status_code == 403:
            print("🚫 Permissão insuficiente para criar broadcast. Confirme os escopos de autenticação.")
        else:
            print("⚠️ Erro inesperado ao criar broadcast.")

        return None, None

    except Exception as ex:
        print(f"❌ Erro inesperado ao criar broadcast: {ex}")
        return None, None

def vincular_stream_a_broadcast(youtube, broadcast_id, stream_id):
    try:
        print(f"🔗 Vinculando stream {stream_id} ao broadcast {broadcast_id}...")

        request = youtube.liveBroadcasts().bind(
            part="id,contentDetails",
            id=broadcast_id,
            streamId=stream_id
        )

        response = request.execute()

        if response.get("id") != broadcast_id:
            print("❌ Erro: broadcast retornado não corresponde ao esperado.")
            return False

        print("✅ Stream vinculado com sucesso ao broadcast.")
        return True

    except HttpError as e:
        error_content = e.content.decode()
        print(f"❌ Erro ao vincular stream: {e.status_code} — {error_content}")

        if e.status_code == 400:
            print("👉 Verifique se IDs de stream e broadcast são válidos.")
        elif e.status_code == 403:
            print("🚫 Permissão insuficiente para vincular stream.")
        else:
            print("⚠️ Erro inesperado ao vincular stream.")

        return False

    except Exception as ex:
        print(f"❌ Erro inesperado ao vincular stream: {ex}")
        return False



# Função para obter o channelId
def get_channel_id(access_token):
    # URL para obter as informações do canal
    url = 'https://www.googleapis.com/youtube/v3/channels'
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'part': 'snippet', 'mine': 'true'}

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        print("❌ Erro ao obter o Channel ID:", response.status_code, response.text)
        return None
    return response.json()['items'][0]['id']  # Retorna o channelId

# Função para buscar transmissões ao vivo no canal
def get_live_broadcasts(channel_id, access_token):
    # URL para buscar transmissões ao vivo no canal
    url = 'https://www.googleapis.com/youtube/v3/liveBroadcasts'
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {
        'part': 'snippet,contentDetails,status',
        'channelId': channel_id,
        'eventType': 'live',  # Filtra para transmissões ao vivo
        'broadcastStatus': 'active',  # Adiciona o filtro de status ativo
        'maxResults': 1  # Pega o primeiro resultado
    }

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        print("❌ Erro ao buscar transmissões ao vivo:", response.status_code, response.text)
        return None

    # Debug: Verificar o conteúdo da resposta
    print("Resposta da API:", response.json())

    live_broadcasts = response.json().get('items', [])
    if live_broadcasts:
        live_video_id = live_broadcasts[0]['id']
        live_url = f'https://www.youtube.com/watch?v={live_video_id}'
        return live_url
    else:
        print("❌ Não há transmissões ao vivo no momento.")
        # Retorna um link de fallback
        return "https://youtube.com/live/Qiiv3ySXIgk?feature=share"


# Função para verificar as configurações de stream atuais
def debug_stream_settings():
    try:
        settings = obs.call("GetStreamServiceSettings")
        print("\n🔍 Configurações de Stream Atuais:")
        print(f"Tipo: {settings.get('streamServiceType', 'N/A')}")
        print(f"Servidor: {settings.get('server', 'N/A')}")
        print(f"Chave: {'*****' if settings.get('key') else 'N/A'}")
        print(f"Serviço: {settings.get('service', 'N/A')}")
    except Exception as e:
        print(f"Erro ao verificar configurações: {e}")

from datetime import datetime

def parar_transmissao(obs_client):
    global usuario_id
    try:
        # 1. Verificar status da transmissão
        status = obs_client.get_stream_status()
        
        if status.output_active:
            # 2. Parar a transmissão
            obs_client.stop_stream()
            print("🛑 Transmissão parada com sucesso no OBS")
            
            # 3. Atualizar o último registro no banco de dados
            try:
                # Encontrar o último registro do usuário
                last_record = supabase.table('ngrok_links')\
                    .select('ID')\
                    .eq('ID_Usuarios', usuario_id)\
                    .order('created_at', desc=True)\
                    .limit(1)\
                    .execute()

                if last_record.data:
                    last_record_id = last_record.data[0]['ID']

                    # Atualizar o registro mais recente
                    supabase.table('ngrok_links').update({
                        'AoVivo': False,
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('ID', last_record_id).execute()

                    print(f"✅ Registro {last_record_id} atualizado com AoVivo: False")
                else:
                    print("ℹ️ Nenhum registro encontrado para o usuário.")

            except Exception as db_error:
                print(f"⚠️ Erro ao atualizar banco de dados: {db_error}")
            
            return True
        else:
            print("ℹ️ Nenhuma transmissão ativa para parar")
            return False
            
    except Exception as e:
        print(f"❌ Falha crítica ao parar transmissão: {str(e)}")
        return False


def atualizar_ao_vivo_no_db(status: bool):
    global usuario_id
    try:
        # Buscar o registro mais recente desse usuário
        res_busca = supabase.table('ngrok_links')\
            .select('*')\
            .eq("ID_Usuarios", usuario_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        if res_busca.data:
            # Se registro existir, atualiza o registro encontrado
            id_registro = res_busca.data[0]['ID']
            supabase.table('ngrok_links')\
                .update({"AoVivo": status, "updated_at": datetime.utcnow().isoformat()})\
                .eq("ID", id_registro)\
                .execute()
            print(f"✅ Registro {id_registro} atualizado com status AoVivo: {status}")
        else:
            # Se não existir, cria novo
            res_insert = supabase.table('ngrok_links').insert({
                "ID_Usuarios": usuario_id,
                "AoVivo": status,
                "url": "",  # opcional: coloque a URL atual se quiser
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
            print(f"✅ Novo registro criado para {usuario_id} com status AoVivo: {status}")

    except Exception as e:
        print(f"❌ Erro ao atualizar banco de dados: {e}")




# Verifica se o vídeo é válido (não vazio e com frames)
def verificar_video_valido(caminho_video):
    try:
        cap = cv2.VideoCapture(caminho_video)
        if not cap.isOpened():
            return False
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()
        return frame_count > 0
    except Exception:
        return False

# Converte o vídeo para um formato compatível com MP4
def converter_para_mp4_compativel(caminho_entrada, caminho_saida):
    try:
        command = [
            'ffmpeg', '-i', caminho_entrada, '-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental', caminho_saida
        ]
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return os.path.exists(caminho_saida)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro na conversão: {e.stderr.decode()}")
        return False

def enviar_video_supabase(caminho_local):
    global usuario_id
    try:
        # Verificar se o usuário_id foi fornecido
        if not usuario_id:
            print("❌ Erro: ID_Usuarios não fornecido!")
            return None

        if not os.path.exists(caminho_local) or os.path.getsize(caminho_local) == 0:
            print("❌ Erro: Arquivo de vídeo inválido ou vazio!")
            return None

        if not verificar_video_valido(caminho_local):
            print("⚠️ Vídeo incompatível - convertendo para formato MP4 padrão...")
            temp_path = caminho_local + ".converted.mp4"
            if converter_para_mp4_compativel(caminho_local, temp_path):
                caminho_local = temp_path
            else:
                return None

        nome_arquivo = os.path.basename(caminho_local)
        tamanho_mb = os.path.getsize(caminho_local) / (1024 * 1024)
        print(f"📤 Enviando {nome_arquivo} (Tamanho: {tamanho_mb:.2f} MB)")

        upload_options = {
            "content-type": "video/x-matroska",  # ou "video/mp4" se já convertido
            "cache-control": "3600",
            "x-upsert": "true"
        }
        chunk_size = 1024 * 1024 * 5  # 5 MB por chunk
        file_size = os.path.getsize(caminho_local)

        # 📁 Define o caminho com subpasta do usuário
        path = f"gravacoes/{usuario_id}/{nome_arquivo}"

        with open(caminho_local, "rb") as f:
            if file_size > chunk_size:
                response = supabase.storage.from_("filmagens").upload(
                    path=path,
                    file=f,
                    file_options=upload_options,
                    chunk_size=chunk_size
                )
            else:
                response = supabase.storage.from_("filmagens").upload(
                    path=path,
                    file=f,
                    file_options=upload_options
                )

        if not response or hasattr(response, 'error'):
            print("❌ Erro no upload:", getattr(response, 'error', 'Resposta inválida'))
            return None

        # Gera URL pública e força cache-buster
        url_publica = supabase.storage.from_("filmagens").get_public_url(path)
        url_publica += f"?t={int(time.time())}"

        try:
            head_response = requests.head(url_publica, timeout=10)
            if head_response.status_code != 200:
                print(f"❌ Arquivo não acessível (HTTP {head_response.status_code})")
                return None
        except requests.RequestException as e:
            print(f"❌ Falha ao verificar acessibilidade: {e}")
            return None

        return url_publica

    except Exception as e:
        print(f"❌ Erro ao enviar vídeo para o Supabase: {e}")
        return None


# Função para processar as detecções de segurança
def processar_deteccoes():
    global grava, transmite, latest_frame

    # Inicializa captura de vídeo
    cap = None
    for i in range(6):  # Tenta até 6 dispositivos de câmera diferentes
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        if cap.isOpened():
            print(f"✅ Câmera local {i} aberta com sucesso!")
            break
        else:
            print(f"❌ Câmera local {i} não disponível!")
            cap.release()

    # Fallback para IP Webcam se nenhuma câmera local funcionar
    if cap is None or not cap.isOpened():
        print("❌ Nenhuma câmera local disponível! Tentando conexão com IP Webcam...")
        cap = cv2.VideoCapture(IP_WEBCAM_URL)
        if not cap.isOpened():
            print("❌ Não foi possível conectar a nenhuma câmera!")
            return

    # Configura gravação local
    hora_inicio = datetime.now()
    nome_arquivo = f"gravacao_{hora_inicio.strftime('%Y%m%d_%H%M%S')}.mkv"
    caminho_video = os.path.join(BASE_DIR, "gravacoes", nome_arquivo)
    os.makedirs(os.path.dirname(caminho_video), exist_ok=True)
    
    codec = cv2.VideoWriter_fourcc(*'XVID')
    gravador = cv2.VideoWriter(caminho_video, codec, fps, (1280, 720))

    # Cores e configurações de exibição
    COR_PESSOA = (61, 0, 134)
    COR_TEXTO = (61, 0, 134)

    # Inicializa detecção de faces
    with mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
        frame_counter = 0
        detections = []
        face_img = None

        while grava:
            start_time = time.time()
            ret, frame = cap.read()
            if not ret:
                print("❌ Falha ao capturar frame!")
                break

            # Preprocessamento do frame
            frame = cv2.resize(frame, (1280, 720))
            display = frame.copy()

            # Detecta pessoas a cada 4 frames (para performance)
            if frame_counter % 2 == 0:
                results = yolo_model(frame, imgsz=640, conf=0.6)[0]
                detections = []

                for det in results.boxes:
                    cls = int(det.cls.item())
                    if cls == 0:  # Classe 'pessoa' no YOLO
                        x1, y1, x2, y2 = map(int, det.xyxy[0])
                        detections.append((x1, y1, x2, y2))
                        cv2.rectangle(display, (x1, y1), (x2, y2), COR_PESSOA, 2)
                        cv2.putText(display, "PESSOA", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)

                        # Detecção de rostos na área da pessoa
                        corpo = frame[y1:y2, x1:x2]
                        if corpo.size > 0:
                            rgb = cv2.cvtColor(corpo, cv2.COLOR_BGR2RGB)
                            faces = face_detection.process(rgb)

                            if faces.detections:
                                for f in faces.detections:
                                    bbox = f.location_data.relative_bounding_box
                                    ih, iw = corpo.shape[:2]
                                    fx, fy, fw, fh = int(bbox.xmin * iw), int(bbox.ymin * ih), int(bbox.width * iw), int(bbox.height * ih)
                                    abs_x, abs_y = x1 + fx, y1 + fy

                                    try:
                                        face_crop = frame[max(0, abs_y-30):min(720, abs_y+fh+30),
                                                        max(0, abs_x-30):min(1280, abs_x+fw+30)]
                                        face_img = cv2.resize(face_crop, (200, 200))
                                        display[20:220, 1060:1260] = face_img
                                        cv2.rectangle(display, (1059, 19), (1261, 221), COR_PESSOA, 2)
                                        cv2.putText(display, "Rosto", (1070, 30),
                                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)
                                    except Exception as e:
                                        print(f"Erro no processamento do rosto: {e}")

            # Redesenha detecções do frame anterior
            for (x1, y1, x2, y2) in detections:
                cv2.rectangle(display, (x1, y1), (x2, y2), COR_PESSOA, 2)
                cv2.putText(display, "PESSOA", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)

            # Mostra rosto detectado se existir
            if face_img is not None:
                display[20:220, 1060:1260] = face_img
                cv2.rectangle(display, (1059, 19), (1261, 221), COR_PESSOA, 2)
                cv2.putText(display, "Rosto", (1070, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)

            frame_counter += 1

            gravador.write(display)

            fps_calc = 1.0 / (time.time() - start_time)

            # Overlay de status
            status_text = "Gravando..."
            if transmite:
                status_text = "Transmitindo: Seguranca 24 horas"

            overlay = display.copy()
            cv2.rectangle(overlay, (0, 0), (1280, 40), (0, 0, 0), -1)
            alpha = 0.4
            cv2.addWeighted(overlay, alpha, display, 1 - alpha, 0, display)
            cv2.putText(display, status_text, (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

            cv2.putText(display, f"FPS: {fps_calc:.1f}", (10, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            #cv2.imshow('Deteccao de Seguranca - OBS', display)
            #if cv2.waitKey(1) == 27:
            #    grava = False

            time.sleep(max(0, 0.033 - (time.time() - start_time)))

            # Atualiza o frame mais recente para o servidor Flask
            with frame_lock:
                _, buffer = cv2.imencode('.jpg', display)
                latest_frame = buffer.tobytes()


    # Libera recursos
    cap.release()
    gravador.release()
    #cv2.destroyAllWindows()

    # Se o arquivo de vídeo existir, envia para o Supabase e salva informações
    if os.path.exists(caminho_video):
        url_video = enviar_video_supabase(caminho_video)  
        hora_fim = datetime.now()
        duracao = (hora_fim - hora_inicio).total_seconds()
        # Passar 'usuario_id' na chamada para 'salvar_informacoes_filmagem'
        salvar_informacoes_filmagem(hora_inicio, hora_fim, duracao, url_video, caminho_video)

        print(f"✅ Gravação finalizada e enviada: {nome_arquivo}")


@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            with frame_lock:
                if latest_frame:
                    yield (b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + latest_frame + b'\r\n')
            time.sleep(1/fps)
    
    return Response(generate(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# Adicione esta função para iniciar o servidor Flask
def iniciar_servidor_flask():
    app.run(host='0.0.0.0', port=5000, threaded=True)

# Salva as informações da filmagem no banco de dados
def salvar_informacoes_filmagem(inicio, fim, duracao, url_video, caminho_video_local):
    global usuario_id
    if url_video is None:
        print("❌ Erro: URL do vídeo é None, não será salvo no banco de dados")
        return

    try:
        if not usuario_id:
            print("❌ Erro: ID_Usuarios não fornecido!")
            return

        tamanho_mb = round(os.path.getsize(caminho_video_local) / (1024 * 1024), 2)

        data = {
            'ID_Usuarios': usuario_id,
            'inicio': inicio.isoformat(),
            'fim': fim.isoformat(),
            'duracao': duracao,
            'url_video': url_video,
            'data': inicio.date().isoformat(),
            'hora_inicio': inicio.time().strftime('%H:%M:%S'),
            'hora_fim': fim.time().strftime('%H:%M:%S'),
            'evento': "acesso negado",
            'dispositivo': "ESP32_CAM_01",
            'enviado_com_sucesso': True,
            'tamanho_arquivo_mb': tamanho_mb
        }

        # Inserindo no banco de dados e tratando a resposta
        res = supabase.table('Tb_Filmagens').insert([data]).execute()

        if res.data:
            print("✅ Filmagem registrada no Supabase.")
        else:
            print("❌ Erro ao salvar filmagem:", res.error)

    except Exception as e:
        print("❌ Erro ao salvar filmagem:", str(e))


def listar_webcams_disponiveis():
    """Lista dispositivos com foco na webcam virtual"""
    index = 0
    dispositivos = []
    
    # Primeiro verifica a webcam virtual (prioridade)
    virtual_cams = ["OBS Virtual Camera", "Python Virtual Camera", "Virtual Camera"]
    for name in virtual_cams:
        dispositivos.append((-1, name))  # -1 indica que é virtual
    
    # Depois verifica câmeras físicas
    while True:
        cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
        if not cap.read()[0]:
            break
        cap.release()
        dispositivos.append((index, f"Câmera {index} (Física)"))
        index += 1
    
    print("Dispositivos encontrados:")
    for idx, nome in dispositivos:
        print(f"  {idx}: {nome}")
    
    return dispositivos


# Função de autenticação para o YouTube
def authenticate_youtube():
    creds = None

    # Verificar se já existe um token salvo
    if os.path.exists(TOKEN_PICKLE):
        with open(TOKEN_PICKLE, 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            # Tentar atualizar o token
            try:
                creds.refresh(Request())
                print("🔄 Token atualizado com sucesso!")
            except Exception as e:
                print(f"❌ Erro ao atualizar token: {e}")
                creds = None
        else:
            # Caso não tenha token ou esteja expirado e não consiga atualizar
            print("🔑 Iniciando o fluxo de autenticação do YouTube...")
            try:
                # Verificar se o arquivo client_secret.json existe
                if not os.path.exists(client_secrets_file):
                    print(f"❌ Erro: Arquivo de cliente 'client_secret.json' não encontrado em: {client_secrets_file}")
                    return None

                # Inicializar o fluxo de autenticação
                flow = InstalledAppFlow.from_client_secrets_file(client_secrets_file, SCOPES)
                print("🌐 Abrindo navegador para autenticação...")
                creds = flow.run_local_server(port=0)

                # Salvar o token para futuras execuções
                with open(TOKEN_PICKLE, 'wb') as token:
                    pickle.dump(creds, token)
                print("✅ Token salvo com sucesso!")
            except Exception as e:
                print(f"❌ Erro ao autenticar: {str(e)}")
                return None

    # Criar a instância da API do YouTube
    try:
        youtube = build('youtube', 'v3', credentials=creds)
        print("🎉 Autenticação concluída com sucesso!")
        return youtube
    except Exception as e:
        print(f"❌ Erro ao criar a instância da API do YouTube: {str(e)}")
        return None


def on_mqtt_message(client, userdata, msg):
    global grava, obs, transmite, usuario_id
    mensagem = msg.payload.decode().lower()
    print(f"📡 MQTT Message Received: {mensagem}")

    try:
        if "acesso negado" in mensagem and not grava:
            print("🚨 Alerta de acesso negado detectado - Iniciando procedimentos...")
            
            # 1. Primeiro verifica/cria registro no banco    
            atualizar_ao_vivo_no_db(True)
                

            # 2. Marca estado de gravação
            grava = True
            
            # 3. Inicia thread de detecção
            try:
                detection_thread = threading.Thread(target=processar_deteccoes, daemon=True)
                detection_thread.start()
                print("🔍 Thread de detecção iniciada com sucesso")
            except Exception as thread_error:
                print(f"❌ Falha ao iniciar thread: {thread_error}")
                grava = False
                atualizar_ao_vivo_no_db(False)
                return

            # 4. Configura OBS (com retry)
            max_obs_attempts = 3
            obs_configured = False
            for attempt in range(max_obs_attempts):
                try:
                    if configurar_cena_obs("Camera_Seguranca"):
                        print(f"🎬 Cena OBS configurada (tentativa {attempt + 1}/{max_obs_attempts})")
                        obs_configured = True
                        break
                    time.sleep(1)
                except Exception as obs_error:
                    print(f"⚠️ Erro OBS tentativa {attempt + 1}: {obs_error}")

            if not obs_configured:
                print("❌ Falha crítica ao configurar OBS")
                grava = False
                atualizar_ao_vivo_no_db(False)
                return

            # 5. Verifica stream do YouTube
            if not os.getenv("YOUTUBE_STREAM_KEY"):
                print("⚠️ AVISO: Streaming desativado (chave YouTube não configurada)")
                return

            # 6. Autenticação YouTube
            try:
                youtube = authenticate_youtube()
                if not youtube:
                    raise RuntimeError("Autenticação falhou")
                
                if not configurar_e_iniciar_stream_youtube(obs, youtube):
                    print("⚠️ Tentando fallback de configuração...")
                    debug_obs_config()
                    if not configurar_e_iniciar_stream_youtube(obs, youtube):
                        raise RuntimeError("Falha após fallback")
                
                print("✅ Transmissão YouTube iniciada com sucesso")
            except Exception as youtube_error:
                print(f"❌ Falha no YouTube: {youtube_error}")
                grava = False
                atualizar_ao_vivo_no_db(False)

        elif "alerta cancelado, acesso liberado" in mensagem and grava:
            print("🟢 Alerta cancelado - Encerrando procedimentos...")
            grava = False
            
            if not parar_transmissao(obs):
                print("⚠️ Aviso: Problema ao parar transmissão,可能需要 limpeza manual")
            
            print("📴 Sistemas desativados")

    except Exception as e:
        print(f"‼️ ERRO GLOBAL: {str(e)}")
        grava = False
        try:
            atualizar_ao_vivo_no_db(False)
        except:
            pass


def load_config():
    global OBS_WS_HOST, OBS_WS_PORT, OBS_WS_PASSWORD, NOME_CENA, FONTE_VIDEO
    global IP_WEBCAM_URL, IP_WEBCAM_STATUS, IP_WEBCAM_USER, IP_WEBCAM_PASS
    global MQTT_CLUSTER_URL, MQTT_USERNAME, MQTT_PASSWORD
    global YOUTUBE_STREAM_KEY, SUPABASE_URL, SUPABASE_KEY, usuario_id
    
    # Caminho para o arquivo de configuração
    config_file = Path(__file__).parent / "security_config.json"
    
    # Valores padrão
    default_config = {
        "OBS_WS_HOST": "192.168.1.6",
        "OBS_WS_PORT": 4455,
        "OBS_WS_PASSWORD": os.getenv("OBS_WS_PASSWORD", ""),
        "NOME_CENA": "Detecção",
        "FONTE_VIDEO": "Camera_Seguranca",
        "IP_WEBCAM_URL": "http://192.168.0.167:8080/video",
        "IP_WEBCAM_STATUS": "http://192.168.0.167:8080/status.json",
        "IP_WEBCAM_USER": "",
        "IP_WEBCAM_PASS": "",
        "MQTT_CLUSTER_URL": os.getenv("MQTT_CLUSTER_URL", ""),
        "MQTT_USERNAME": os.getenv("MQTT_USERNAME", ""),
        "MQTT_PASSWORD": os.getenv("MQTT_PASSWORD", ""),
        "YOUTUBE_STREAM_KEY": os.getenv("YOUTUBE_STREAM_KEY", ""),
        "SUPABASE_URL": os.getenv("SUPABASE_URL", ""),
        "SUPABASE_KEY": os.getenv("SUPABASE_KEY", ""),

    }
    
    try:
        # Verifica se o arquivo de configuração existe
        if not config_file.exists():
            print("⚠️ Arquivo de configuração não encontrado. Criando com valores padrão...")
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=4)
            config = default_config
        else:
            # Carrega o arquivo existente
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            # Verifica se todas as chaves necessárias existem
            for key in default_config.keys():
                if key not in config:
                    print(f"⚠️ Chave '{key}' faltando no arquivo de configuração. Usando valor padrão.")
                    config[key] = default_config[key]
            
            # Atualiza o arquivo com quaisquer chaves faltantes
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=4)
        
        # Atualiza variáveis globais
        OBS_WS_HOST = config["OBS_WS_HOST"]
        OBS_WS_PORT = int(config["OBS_WS_PORT"])
        OBS_WS_PASSWORD = config["OBS_WS_PASSWORD"]
        NOME_CENA = config["NOME_CENA"]
        FONTE_VIDEO = config["FONTE_VIDEO"]
        IP_WEBCAM_URL = config["IP_WEBCAM_URL"]
        IP_WEBCAM_STATUS = config["IP_WEBCAM_STATUS"]
        IP_WEBCAM_USER = config["IP_WEBCAM_USER"]
        IP_WEBCAM_PASS = config["IP_WEBCAM_PASS"]
        MQTT_CLUSTER_URL = config["MQTT_CLUSTER_URL"]
        MQTT_USERNAME = config["MQTT_USERNAME"]
        MQTT_PASSWORD = config["MQTT_PASSWORD"]
        YOUTUBE_STREAM_KEY = config["YOUTUBE_STREAM_KEY"]
        SUPABASE_URL = config["SUPABASE_URL"]
        SUPABASE_KEY = config["SUPABASE_KEY"]
        
    
        
        print("✅ Configurações carregadas com sucesso:")
        print(f"• OBS: {OBS_WS_HOST}:{OBS_WS_PORT}")
        print(f"• Câmera: {IP_WEBCAM_URL if IP_WEBCAM_URL else 'Câmera local'}")
        print(f"• Usuário: {'Configurado' if usuario_id else 'Não configurado'}")
        
        return True
        
    except json.JSONDecodeError:
        print("❌ Erro ao ler arquivo de configuração (formato inválido). Usando valores padrão.")
        # Carrega valores padrão
        for key, value in default_config.items():
            globals()[key] = value
        usuario_id = None
        return False
        
    except Exception as e:
        print(f"❌ Erro inesperado ao carregar configurações: {str(e)}. Usando valores padrão.")
        # Carrega valores padrão
        for key, value in default_config.items():
            globals()[key] = value
        usuario_id = None
        return False
    
def main():
    # Configuração inicial
    print("\n" + "="*50)
    print("Sistema de Segurança - Inicializando...")
    print("="*50 + "\n")
    
    # 1. Verificar e carregar configurações
    try:
        load_config()  # Função que você já tem para carregar do JSON
        print("✅ Configurações carregadas com sucesso")
    except Exception as e:
        print(f"⚠️ Erro ao carregar configurações: {e}")
        print("⚠️ Usando configurações padrão")

    # 2. Iniciar OBS Studio
    print("\n[1/5] Verificando OBS Studio...")
    if not iniciar_obs():
        print("❌ Falha ao iniciar OBS Studio")
        return
    
    # 3. Conectar ao OBS via WebSocket
    print("\n[2/5] Conectando ao OBS WebSocket...")
    obs_conectado = False
    for tentativa in range(1, 6):  # 5 tentativas
        if conectar_obs():
            obs_conectado = True
            break
        print(f"⚠️ Tentativa {tentativa}/5 falhou. Tentando novamente em 3 segundos...")
        time.sleep(3)
    
    if not obs_conectado:
        print("❌ Falha na conexão com OBS após várias tentativas")
        return

    # 4. Configurar MQTT
    print("\n[3/5] Configurando MQTT Client...")
    try:
        client = mqtt.Client()
        client.username_pw_set(os.getenv("MQTT_USERNAME"), os.getenv("MQTT_PASSWORD"))
        client.tls_set()
        client.on_message = on_mqtt_message
        
        # Adicionar tratamento para conexão perdida
        def on_disconnect(client, userdata, rc):
            if rc != 0:
                print("❌ Conexão MQTT perdida inesperadamente! Tentando reconectar...")
                while True:
                    try:
                        client.reconnect()
                        print("✅ Reconectado ao MQTT")
                        break
                    except Exception as e:
                        print(f"⚠️ Falha na reconexão: {e}. Tentando novamente em 5 segundos...")
                        time.sleep(5)
        
        client.on_disconnect = on_disconnect
        
        # Conectar e subscrever
        client.connect(os.getenv("MQTT_CLUSTER_URL"), 8883)
        client.subscribe("alert")
        print("✅ MQTT configurado e conectado")
    except Exception as e:
        print(f"❌ Erro na configuração MQTT: {e}")
        return

    # 5. Iniciar servidor Flask em thread separada
    print("\n[4/5] Iniciando servidor Flask...")
    flask_thread = threading.Thread(target=iniciar_servidor_flask, daemon=True)
    flask_thread.start()
    print("✅ Servidor Flask iniciado em http://localhost:5000")

    print("="*50 + "\n")
    print("\n[5/5] Iniciando conta do google...")
    print("Verificando login com o gooogle")
    autenticar_google_api()
    print("="*50 + "\n")
    
    # 6. Configuração inicial do banco de dados
    try:
        atualizar_ao_vivo_no_db(False)
        print("✅ Status 'Ao Vivo' atualizado no banco de dados")
    except Exception as e:
        print(f"⚠️ Erro ao atualizar status no banco de dados: {e}")

    # 7. Informações do sistema
    print("\n" + "="*50)
    print("Sistema pronto e aguardando alertas")
    print(f"• Usuário configurado: {'Sim' if usuario_id else 'Não'}")
    print(f"• Câmera principal: {IP_WEBCAM_URL if IP_WEBCAM_URL else 'Câmera local'}")
    print(f"• Cena OBS: {NOME_CENA}")
    print("="*50 + "\n")

    # 8. Loop principal com tratamento de exceções
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("\n👋 Recebido comando para encerrar...")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
    finally:
        # Rotina de encerramento
        print("\nEncerrando recursos...")
        
        # Parar transmissão se estiver ativa
        if transmite:
            try:
                parar_transmissao()
                print("✅ Transmissão encerrada")
            except Exception as e:
                print(f"⚠️ Erro ao parar transmissão: {e}")
        
        # Desconectar OBS
        if obs:
            try:
                obs.disconnect()
                print("✅ Desconectado do OBS")
            except Exception as e:
                print(f"⚠️ Erro ao desconectar do OBS: {e}")
        
        # Desconectar MQTT
        try:
            client.disconnect()
            print("✅ Desconectado do MQTT")
        except Exception as e:
            print(f"⚠️ Erro ao desconectar do MQTT: {e}")
        
        print("\n✅ Sistema encerrado com sucesso\n")

if __name__ == "__main__":
    main()