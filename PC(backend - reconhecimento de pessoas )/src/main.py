# Bibliotecas usadas no projeto:

# Sistema operacional e processos
import os
import time
import threading
import subprocess
import psutil

# Manipulação de imagens e vídeos
import cv2
import numpy as np

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

# Controle de janelas do Windows 
import win32gui


# Configurações
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Configura OBS
OBS_WS_HOST = "192.168.1.6"
OBS_WS_PORT = 4455
OBS_WS_PASSWORD = os.getenv("OBS_WS_PASSWORD")
NOME_CENA = "Deteccao"
streams_configurados = []
STREAM_KEY = os.getenv("YOUTUBE_STREAM_KEY") 

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

#  Esta função verifica se o OBS Studio (versão 64 bits) está rodando.
def is_obs_running():
    for proc in psutil.process_iter(attrs=['pid', 'name']):
        if proc.info['name'] == 'obs64.exe':
            return True
    return False

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

# Função para listar todas as janelas visíveis no sistema
def listar_janelas_visiveis():
    janelas = []

    def _callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            if title:
                janelas.append((hwnd, title))

    win32gui.EnumWindows(_callback, None)
    return janelas

# Função para encontrar uma janela pelo título
def encontrar_janela_por_titulo(titulo_parcial):
    hwnd_encontrado = None

    def callback(hwnd, extra):
        nonlocal hwnd_encontrado
        if hwnd_encontrado is None:
            titulo = win32gui.GetWindowText(hwnd)
            if titulo_parcial.lower() in titulo.lower():
                hwnd_encontrado = hwnd
                return False
        return True

    win32gui.EnumWindows(callback, None)
    return hwnd_encontrado

# Função para configurar uma cena e adicionar uma captura de janela no OBS
def configurar_cena_obs(nome_fonte, hwnd_janela):
    """
    Configura uma cena no OBS, adicionando uma captura de janela baseada no título e no HWND fornecidos.
    """
    print(f"⚙️ Tentando configurar HWND: {hwnd_janela}")

    lista = listar_janelas_visiveis()
    print("📋 Janelas disponíveis (hwnd, título):", lista)

    global obs, NOME_CENA

    try:
        print(f"\n=== CONFIGURAÇÃO DO OBS: Cena = '{NOME_CENA}', Fonte = '{nome_fonte}' ===")

        cenas = obs.get_scene_list().scenes
        if not any(c['sceneName'] == NOME_CENA for c in cenas):
            print(f"🛠️ Criando cena '{NOME_CENA}'")
            obs.create_scene(NOME_CENA)
            time.sleep(1)

        inputs = obs.get_input_list().inputs
        if any(i['inputName'] == nome_fonte for i in inputs):
            print(f"✅ Fonte '{nome_fonte}' já existe")
            items = obs.get_scene_item_list(NOME_CENA).scene_items
            if not any(it['sourceName'] == nome_fonte for it in items):
                obs.add_scene_item(NOME_CENA, nome_fonte)
            obs.set_current_program_scene(NOME_CENA)
            return True

        try:
            window_class = win32gui.GetClassName(hwnd_janela)
        except Exception:
            print(f"⚠️ Não foi possível obter a classe da janela para HWND: {hwnd_janela}")
            window_class = ""

        settings = {
            "window": "python3.11.exe:Deteccao de Seguranca - OBS",
            "window_class": window_class,
            "capture_cursor": False,
            "capture_method": "windows_graphics_capture",
        }

        print(f"➕ Criando fonte 'window_capture': '{nome_fonte}' com settings: {settings}")
        obs.create_input(
            scene_name=NOME_CENA,
            input_name=nome_fonte,
            input_kind="window_capture",
            input_settings=settings,
            scene_item_enabled=True
        )
        time.sleep(1)

        items = obs.get_scene_item_list(NOME_CENA).scene_items
        fonte_id = next(it['sceneItemId'] for it in items if it['sourceName'] == nome_fonte)
        obs.set_scene_item_enabled(scene_name=NOME_CENA, scene_item_id=fonte_id, enabled=True)
        obs.set_current_program_scene(NOME_CENA)

        print(f"✅ Fonte '{nome_fonte}' configurada com sucesso na cena '{NOME_CENA}'")
        return True

    except TypeError as te:
        print(f"⚠️ Fallback CreateInput manual: {te}")
        obs.send("CreateInput", {
            "sceneName": NOME_CENA,
            "inputName": nome_fonte,
            "inputKind": "window_capture",
            "inputSettings": settings,
            "sceneItemEnabled": True
        })
        obs.set_current_program_scene(NOME_CENA)
        return True

    except Exception as e:
        print(f"❌ Erro crítico em configurar_cena_obs: {e}")
        print("\n🔧 Configure manualmente no OBS:")
        print(f"   1. Crie a cena '{NOME_CENA}'")
        print(f"   2. Adicione fonte 'Window Capture (GDI)' chamada '{nome_fonte}'")
        print(f"   3. Selecione a janela com HWND: {hwnd_janela}")
        return False


def configurar_e_iniciar_stream_youtube():
    global obs, transmite
    
    print("🔄 Configurando transmissão YouTube...")
    try:
        # Configurações atualizadas para OBS 31+ e obs-websocket 5.5.6
        settings = {
            "service": "YouTube - RTMP",
            "server": "rtmp://a.rtmp.youtube.com/live2",
            "key": os.getenv("YOUTUBE_STREAM_KEY"),
            "output": {
                "keyint_sec": 2,
                "rate_control": "CBR",
                "video_bitrate": 4500,
                "audio_bitrate": 160,
                "preset": "veryfast"
            }
        }

        # Aplica configurações
        obs.set_stream_service_settings("rtmp_common", settings)
        
        # Verificação correta dos atributos
        current_settings = obs.get_stream_service_settings()
        
        # Acesso direto aos atributos da dataclass
        if not current_settings.key:  # Modificado aqui
            raise ValueError("Chave de stream não configurada!")
        
        # Inicia transmissão
        obs.start_stream()
        transmite = True
        print("🔴 Transmissão YouTube iniciada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro na configuração: {str(e)}")
        transmite = False


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


# Para a transmissão no OBS
def parar_transmissao():
    try:
        obs.stop_stream()
        print("✅ Transmissão parada no OBS.")
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
    global grava

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        print("Erro: Câmera não disponível!")
        return

    print("Iniciando gravação...")
    hora_inicio = datetime.now()
    nome_arquivo = f"gravacao_{hora_inicio.strftime('%Y%m%d_%H%M%S')}.mkv"
    caminho_video = os.path.join(BASE_DIR, "gravacoes", nome_arquivo)
    os.makedirs(os.path.dirname(caminho_video), exist_ok=True)

    codec = cv2.VideoWriter_fourcc(*'XVID')
    gravador = cv2.VideoWriter(caminho_video, codec, fps, (1280, 720))

    COR_PESSOA = (61, 0, 134)
    COR_TEXTO = (61, 0, 134)

    frame_counter = 0
    detections = []
    face_img = None

    with mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
        while grava:
            start_time = time.time()
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (1280, 720))
            display = frame.copy()

            if frame_counter % 2 == 0:
                results = yolo_model(frame, imgsz=640, conf=0.6)[0]
                detections = []

                for det in results.boxes:
                    cls = int(det.cls.item())
                    if cls == 0:
                        x1, y1, x2, y2 = map(int, det.xyxy[0])
                        detections.append((x1, y1, x2, y2))
                        cv2.rectangle(display, (x1, y1), (x2, y2), COR_PESSOA, 2)
                        cv2.putText(display, "PESSOA", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)

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
                                        print(f"Erro no rosto: {e}")
            else:
                for (x1, y1, x2, y2) in detections:
                    cv2.rectangle(display, (x1, y1), (x2, y2), COR_PESSOA, 2)
                    cv2.putText(display, "PESSOA", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)

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

            cv2.imshow('Deteccao de Seguranca - OBS', display)
            if cv2.waitKey(1) == 27:
                grava = False

            time.sleep(max(0, 0.033 - (time.time() - start_time)))

    cap.release()
    gravador.release()
    cv2.destroyAllWindows()

    # Envia o vídeo para o Supabase após a gravação
    if os.path.exists(caminho_video):
        url_video = enviar_video_supabase(caminho_video)
        hora_fim = datetime.now()
        duracao = (hora_fim - hora_inicio).total_seconds()
        salvar_informacoes_filmagem(hora_inicio, hora_fim, duracao, url_video, caminho_video)

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

# Função para listar as janelas visíveis no sistema
def encontrar_janela_por_titulo(titulo_parcial):

    hwnd_encontrado = None

    def callback(hwnd, extra):
        nonlocal hwnd_encontrado  
        if hwnd_encontrado is None:  
            titulo = win32gui.GetWindowText(hwnd)
            if titulo_parcial.lower() in titulo.lower():
                hwnd_encontrado = hwnd
                return False  
        return True  

    win32gui.EnumWindows(callback, None)
    return hwnd_encontrado

# Função de callback para mensagens MQTT
def on_mqtt_message(client, userdata, msg):
    global grava, obs, transmite
    mensagem = msg.payload.decode().lower()
    print(f"MQTT: {mensagem}")

    if "acesso negado" in mensagem and not grava:
        atualizar_ao_vivo_no_db(True)
        grava = True

        threading.Thread(target=processar_deteccoes, daemon=True).start()

        time.sleep(5)

        lista_janelas = listar_janelas_visiveis()
        print("Janelas visíveis:")
        for hwnd, title in lista_janelas:
            print(f"HWND: {hwnd}, Title: {title}")

        hwnd_obs = encontrar_janela_por_titulo('OBS')

        if hwnd_obs:
            print(f"Janela do OBS encontrada com HWND: {hwnd_obs}")
            
            configurar_cena_obs("Fonte_Camera", hwnd_obs)
            
            chave_stream = os.getenv("YOUTUBE_STREAM_KEY") 
            if chave_stream:
                print("Chamando configurar_stream_youtube...")
                configurar_e_iniciar_stream_youtube()
            else:
                print("❌ Chave de stream não encontrada!")
        else:
            print("Erro: HWND da janela não encontrado!")
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