# Bibliotecas usadas no projeto:

# Sistema operacional e processos
import os
import time
import threading
import subprocess
import psutil
from flask import Flask, Response

# Manipulação de imagens e vídeos
import numpy as np
import cv2
import pyvirtualcam


# Controle de datas e horários
from datetime import datetime

# Integração com o OBS Studio (gravação/transmissão)
import obsws_python
from obsws_python import ReqClient
import obsws_python as obs

# Comunicação HTTP
import requests

# Modelo de detecção de objetos (YOLO)
from ultralytics import YOLO

# Detecção de rostos e poses (MediaPipe)
import mediapipe as mp

# Comunicação via MQTT (mensageria)
import paho.mqtt.client as mqtt

# Carregamento de variáveis de ambiente (.env)
from dotenv import load_dotenv

# Integração com banco de dados Supabase
from supabase import create_client, Client




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

# Inicializa variáveis
obs = None
grava = False 
transmite = False
fps = 30  

# Modelos
yolo_model = YOLO(os.path.join(BASE_DIR, "models", "yolov8n.pt"))
mp_face = mp.solutions.face_detection
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

        # 2. Configurações da webcam virtual
        settings = {
            "url": "http://localhost:5000/video_feed",
            "width": 1440,
            "height": 720,
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

# Função para configurar e iniciar a transmissão no YouTube
def configurar_e_iniciar_stream_youtube():
    global transmite
    max_tentativas = 3
    tentativa = 0
    
    while tentativa < max_tentativas:
        try:
            if obs is None:
                print("OBS não está conectado! Tentando reconectar...")
                if not conectar_obs():
                    time.sleep(2)
                    tentativa += 1
                    continue

            status = obs.get_stream_status()
            if not status.output_active:
                cenas = obs.get_scene_list().scenes
                nomes_cenas = [scene['sceneName'] for scene in cenas]

                if NOME_CENA in nomes_cenas:
                    obs.set_current_program_scene(NOME_CENA)
                    print(f"Mudando para cena: {NOME_CENA}")

                obs.start_stream()
                transmite = True
                print("🎥 Transmissão iniciada automaticamente!")
                url_live = "https://www.youtube.com/watch?v=Jcw0ijN64ww"
                if url_live:
                    print(f"🔗 URL da transmissão: {url_live}")
                    try:
                        supabase.table('ngrok_links').upsert({
                            'id': 1,
                            'url': url_live,
                            'AoVivo': True
                        }).execute()
                    except Exception as e:
                        print(f"⚠️ Erro ao salvar URL no Supabase: {e}")
                else:
                    print("⚠️ Não foi possível obter URL da transmissão")
                return True
            else:
                print("OBS já está transmitindo!")
                return True

        except Exception as e:
            print(f"Erro ao iniciar transmissão (tentativa {tentativa + 1}/{max_tentativas}): {e}")
            time.sleep(2)
            tentativa += 1
    
    print("Falha ao iniciar transmissão após várias tentativas")
    return False
    
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

# Função para parar a transmissão (atualizada)
def parar_transmissao():
    global transmite
    try:
        if transmite:
            obs.stop_stream()
            transmite = False
            print("✅ Transmissão parada no OBS.")
            atualizar_ao_vivo_no_db(False)
    except Exception as e:
        print(f"❌ Erro ao parar transmissão: {e}")


# Atualiza o status "Ao Vivo" no banco de dados
def atualizar_ao_vivo_no_db(status: bool):
    try:
        res = supabase.table('ngrok_links').update({"AoVivo": True}).eq("id", 1).execute()
        print(f"Banco de dados atualizado com status AoVivo: {status}")
    except Exception as e:
        print(f"Erro ao atualizar banco de dados: {e}")

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

# Envia o vídeo para o Supabase
def enviar_video_supabase(caminho_local):
    try:
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
            "content-type": "video/x-matroska",  # Tipo MIME para MKV
            "cache-control": "3600",
            "x-upsert": "true"
        }
        chunk_size = 1024 * 1024 * 5  # 5 MB por chunk
        file_size = os.path.getsize(caminho_local)

        with open(caminho_local, "rb") as f:
            if file_size > chunk_size:
                response = supabase.storage.from_("filmagens").upload(
                    path=f"gravacoes/{nome_arquivo}",
                    file=f,
                    file_options=upload_options,
                    chunk_size=chunk_size
                )
            else:
                response = supabase.storage.from_("filmagens").upload(
                    path=f"gravacoes/{nome_arquivo}",
                    file=f,
                    file_options=upload_options
                )

        if not response or hasattr(response, 'error'):
            print("❌ Erro no upload:", getattr(response, 'error', 'Resposta inválida'))
            return None

        url_publica = supabase.storage.from_("filmagens").get_public_url(f"gravacoes/{nome_arquivo}")
        url_publica += f"?t={int(time.time())}"  # Evita cache

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

            # Detecta pessoas a cada 2 frames (para performance)
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
            if cv2.waitKey(1) == 27:
                grava = False

            time.sleep(max(0, 0.033 - (time.time() - start_time)))

            # Atualiza o frame mais recente para o servidor Flask
            with frame_lock:
                _, buffer = cv2.imencode('.jpg', display)
                latest_frame = buffer.tobytes()


    # Libera recursos
    cap.release()
    gravador.release()
    cv2.destroyAllWindows()

    # Envia o vídeo para o Supabase
    if os.path.exists(caminho_video):
        url_video = enviar_video_supabase(caminho_video)
        hora_fim = datetime.now()
        duracao = (hora_fim - hora_inicio).total_seconds()
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
    if url_video is None:
        print("Erro: URL do vídeo é None, não será salvo no banco de dados")
        return

    try:
        tamanho_mb = round(os.path.getsize(caminho_video_local) / (1024 * 1024), 2)
        data = {
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

        res = supabase.table('filmagens').insert([data]).execute()

        if hasattr(res, 'error') and res.error:
            print("Erro ao salvar filmagem:", res.error)
        else:
            print("Filmagem registrada no Supabase.")

    except Exception as e:
        print("Erro ao salvar filmagem:", str(e))


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

def on_mqtt_message(client, userdata, msg):
    global grava, obs, transmite
    mensagem = msg.payload.decode().lower()
    print(f"MQTT: {mensagem}")

    if "acesso negado" in mensagem and not grava:
        try:
            atualizar_ao_vivo_no_db(True)
            grava = True

            # Inicia processamento
            threading.Thread(target=processar_deteccoes, daemon=True).start()
            
            # Espera a webcam virtual estar pronta
            time.sleep(2)
            
            # Configura OBS
            if not configurar_cena_obs("Camera_Seguranca"):
                configurar_cena_obs("Camera_Seguranca")
            
            # Verifica novamente se a chave existe antes de tentar stream
            if os.getenv("YOUTUBE_STREAM_KEY"):
                # Adiciona delay para garantir que tudo está pronto
                time.sleep(2)
                if not configurar_e_iniciar_stream_youtube():
                    print("⚠️ Falha ao configurar stream, verificando configurações do OBS...")
                    debug_obs_config()
            else:
                print("⚠️ Chave do YouTube não configurada, streaming não iniciado")

        except Exception as e:
            print(f"❌ Erro no processamento: {e}")
            grava = False
            atualizar_ao_vivo_no_db(False)
    elif "alerta cancelado, acesso liberado" in mensagem and grava:
        grava = False
        parar_transmissao()

def main():
    from obsws_python import __version__ as obs_version
    print(f"Versão obsws-python: {obs_version}")
    if not iniciar_obs():
        print("❌ Não foi possível iniciar o OBS")
        return

    obs_conectado = False
    for _ in range(10):
        if conectar_obs():
            obs_conectado = True
            break
        print("Tentando conectar novamente...")
        time.sleep(2)
    
    if not obs_conectado:
        print("❌ Conexão com OBS falhou após 10tentativas")
        return

    client = mqtt.Client()
    client.username_pw_set(os.getenv("MQTT_USERNAME"), os.getenv("MQTT_PASSWORD"))
    client.tls_set()
    client.on_message = on_mqtt_message
    flask_thread = threading.Thread(target=iniciar_servidor_flask, daemon=True)
    flask_thread.start()
    
    try:
        client.connect(os.getenv("MQTT_CLUSTER_URL"), 8883)
        client.subscribe("alert")
        print("✅ Conectado ao MQTT. Aguardando alertas...")
        
        atualizar_ao_vivo_no_db(False)
        
        client.loop_forever()
        
    except Exception as e: 
        print(f"❌ Erro na conexão MQTT: {e}")
    finally:
        print("\nEncerrando recursos...")
        if obs:
            try:
                obs.disconnect()
                print("✅ Desconectado do OBS.")
            except Exception as e:
                print(f"⚠️ Erro ao desconectar do OBS: {e}")
        client.disconnect()
        print("✅ Desconectado do MQTT.")
        print("✅ Recursos liberados. Aplicação encerrada.")

if __name__ == "__main__":
    main()