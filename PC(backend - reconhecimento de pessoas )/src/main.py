import os
import cv2
import time
import threading
import subprocess
import requests
import numpy as np
from datetime import datetime
from ultralytics import YOLO
import mediapipe as mp
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from obsws_python import ReqClient
import psutil
from supabase import create_client, Client


# Configurações
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Configura OBS
OBS_WS_HOST = "192.168.0.164"
OBS_WS_PORT = 4455
OBS_WS_PASSWORD = os.getenv("OBS_WS_PASSWORD")
MQTT_PASSWORD=os.getenv("MQTT_PASSWORD")
MQTT_USERNAME=os.getenv("MQTT_USERNAME")
MQTT_CLUSTER_URL=os.getenv("MQTT_CLUSTER_URL")
FONTE_VIDEO = "Camera_Seguranca"  # Nome da fonte de vídeo
NOME_CENA = "Detecção"  # Nome da cena no OBS


IP_WEBCAM_URL = "http://192.168.0.167:8080/video"  # URL do vídeo MJPEG
IP_WEBCAM_STATUS = "http://192.168.0.167:8080/status.json"  # URL para verificar status
IP_WEBCAM_USER = None  # Se precisar de autenticação
IP_WEBCAM_PASS = None  # Se precisar de autenticação

# Banco de dados
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)


# Inicializa variáveis
obs = None
grava = False
transmite = False
fps = 30  # Definindo a variável fps global

# Modelos
yolo_model = YOLO(os.path.join(BASE_DIR, "models", "yolov8n.pt"))
mp_face = mp.solutions.face_detection


def is_obs_running():
    for proc in psutil.process_iter(attrs=['pid', 'name']):
        if proc.info['name'] == 'obs64.exe':
            return True
    return False

def testar_conexao_ip_webcam():
    """Testa a conexão com o IP Webcam"""
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

def configurar_obs_simples():
    def verificar_conexao_obs():
        try:
            return obs.get_version() is not None
        except:
            return False

    def testar_conexao_ip_webcam():
        try:
            auth = (IP_WEBCAM_USER, IP_WEBCAM_PASS) if IP_WEBCAM_USER else None
            response = requests.get(IP_WEBCAM_URL.replace('/video', '/status.json'), 
                                 auth=auth, timeout=5)
            return response.status_code == 200
        except:
            return False

    try:
        # Verificar conexão com OBS
        if not verificar_conexao_obs():
            print("❌ Não foi possível conectar ao OBS")
            return False

        # Testar conexão com IP Webcam
        if not testar_conexao_ip_webcam():
            print("❌ Não foi possível conectar ao IP Webcam")
            print("Verifique:")
            print(f"- O app está rodando no celular?")
            print(f"- O IP está correto? (Atual: {IP_WEBCAM_URL})")
            print(f"- Celular e PC estão na mesma rede?")
            return False

        # 1. Verificar/Criar cena
        cenas = obs.get_scene_list().scenes
        cena_existe = any(cena["sceneName"] == NOME_CENA for cena in cenas)
        
        if not cena_existe:
            obs.call("CreateScene", {"sceneName": NOME_CENA})
            print(f"✅ Cena '{NOME_CENA}' criada")
        else:
            print(f"ℹ️ Cena '{NOME_CENA}' já existe")

        # 2. Configuração do IP Webcam
        config_webcam = {
            "input": IP_WEBCAM_URL,
            "input_format": "mjpeg",
            "buffering_mb": 2,
            "is_local_file": False
        }

        if IP_WEBCAM_USER and IP_WEBCAM_PASS:
            config_webcam.update({
                "username": IP_WEBCAM_USER,
                "password": IP_WEBCAM_PASS
            })

        # Verificar se a fonte já existe
        inputs = obs.get_input_list().inputs
        fonte_existe = any(input["inputName"] == FONTE_VIDEO for input in inputs)

        if fonte_existe:
            # Se a fonte existe, atualizar configurações
            obs.call("SetInputSettings", {
                "inputName": FONTE_VIDEO,
                "inputSettings": config_webcam
            })
            print(f"✅ Fonte '{FONTE_VIDEO}' atualizada com IP Webcam")
        else:
            # Criar nova fonte usando a sintaxe correta
            try:
                obs.call("CreateInput", {
                    "sceneName": NOME_CENA,
                    "inputName": FONTE_VIDEO,
                    "inputKind": "ffmpeg_source",
                    "inputSettings": config_webcam
                })
                print(f"✅ Fonte IP Webcam '{FONTE_VIDEO}' criada")
            except Exception as e:
                print(f"❌ Falha ao criar fonte: {str(e)}")
                return False

        # 3. Garantir que a fonte está na cena
        items = obs.call("GetSceneItemList", {"sceneName": NOME_CENA}).scene_items
        fonte_na_cena = any(item["sourceName"] == FONTE_VIDEO for item in items)

        if not fonte_na_cena:
            try:
                obs.call("CreateSceneItem", {
                    "sceneName": NOME_CENA,
                    "sourceName": FONTE_VIDEO,
                    "sceneItemEnabled": True
                })
                print(f"✅ Fonte '{FONTE_VIDEO}' adicionada à cena '{NOME_CENA}'")
            except Exception as e:
                print(f"⚠️ Erro ao adicionar fonte à cena: {str(e)}")
                return False

        # 4. Configurar a cena como ativa
        try:
            obs.call("SetCurrentProgramScene", {"sceneName": NOME_CENA})
            print(f"✅ Cena '{NOME_CENA}' definida como ativa")
            return True
            
        except Exception as e:
            print(f"⚠️ Erro ao definir cena ativa: {str(e)}")
            return False

    except Exception as e:
        print(f"❌ Erro crítico: {str(e)}")
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

def iniciar_transmissao_simples():
    global transmite
    try:
        # 1. Configura OBS automaticamente
        if not configurar_obs_simples():
            return False

        # 2. Inicia a transmissão
        obs.start_stream()
        transmite = True
        print("🔴 **TRANSMISSÃO INICIADA!**")
        atualizar_ao_vivo_no_db(True)  # Atualiza status no banco de dados
        return True

    except Exception as e:
        print(f"❌ Falha ao iniciar transmissão: {e}")
        return False

def iniciar_obs():
    try:
        if is_obs_running():
            return True
            
        obs_path = r"C:\Program Files\obs-studio\bin\64bit\obs64.exe"
        subprocess.Popen([obs_path], cwd=os.path.dirname(obs_path))
        time.sleep(10)  # Tempo maior para inicialização
        return True
        
    except Exception as e:
        print(f"Erro ao iniciar OBS: {e}")
        return False

def conectar_obs():
    global obs
    try:
        obs = ReqClient(host=OBS_WS_HOST, port=OBS_WS_PORT, password=OBS_WS_PASSWORD, timeout=5)
        print("✅ Conectado ao OBS via WebSocket")
        return True
    except Exception as e:
        print(f"❌ Falha na conexão OBS: {e}")
        return False

def iniciar_transmissao():
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
                atualizar_ao_vivo_no_db(True)
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

def parar_transmissao():
    global transmite
    try:
        if transmite:
            obs.stop_stream()
            transmite = False
            res = supabase.table('ngrok_links').update({"AoVivo": False}).eq("id", 1).execute()
            print("Transmissão encerrada!")
    except Exception as e:
        print(f"Erro ao parar transmissão: {e}")

def verificar_transmissao_periodicamente():
    while True:
        if transmite:
            try:
                status = obs.get_stream_status()
                if not status.output_active:
                    print("Transmissão caiu! Tentando reiniciar...")
                    iniciar_transmissao()
            except Exception as e:
                print(f"Erro ao verificar status da transmissão: {e}")
        
        time.sleep(60)  # Verifica a cada minuto

def atualizar_ao_vivo_no_db(status: bool):
    try:
        res = supabase.table('ngrok_links').update({"AoVivo": status}).eq("id", 1).execute()
        print(f"Banco de dados atualizado com status AoVivo: {status}")
    except Exception as e:
        print(f"Erro ao atualizar banco de dados: {e}")
        
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

def converter_para_mp4_compativel(caminho_entrada, caminho_saida):
    try:
        command = [
            'ffmpeg',
            '-i', caminho_entrada,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-strict', 'experimental',
            caminho_saida
        ]
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return os.path.exists(caminho_saida)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro na conversão: {e.stderr.decode()}")
        return False

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
            print(f"❌ Falha ao verificar acessibilidade: {str(e)}")
            return None

        print(f"✅ Upload concluído com sucesso! URL: {url_publica}")
        return url_publica

    except Exception as e:
        print(f"❌ Erro crítico no upload: {str(e)}")
        return None

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

def processar_deteccoes():
    global grava


    # Configuração especial para captura do IP Webcam
    cap = cv2.VideoCapture(IP_WEBCAM_URL)
    if IP_WEBCAM_USER and IP_WEBCAM_PASS:
        cap.set(cv2.CAP_PROP_USERNAME, IP_WEBCAM_USER)
        cap.set(cv2.CAP_PROP_PASSWORD, IP_WEBCAM_PASS)
    
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduzir buffer para menor latência
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        print("❌ Erro: Não foi possível conectar ao IP Webcam!")
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

    if grava:
        retomar_transmissao()  # Retoma a transmissão quando o modelo voltar

def on_mqtt_message(client, userdata, msg):
    global grava, transmite

    mensagem = msg.payload.decode().lower()
    print(f"MQTT: {mensagem}")

    if "acesso negado" in mensagem and not grava:
        # 1. Configura OBS
        if configurar_obs_simples():
            grava = True
            # 2. Inicia gravação e transmissão
            threading.Thread(target=processar_deteccoes, daemon=True).start()
            threading.Timer(3, iniciar_transmissao_simples).start()

    elif "alerta cancelado, acesso liberado" in mensagem and grava:
        grava = False
        parar_transmissao()

def main():
    # 1. Inicia OBS
    if not iniciar_obs():
        print("❌ OBS não iniciou!")
        return

    # 2. Conecta ao OBS WebSocket (deixa pronto)
    if not conectar_obs():
        print("❌ Falha na conexão OBS!")
        return

    # 3. Debug (opcional): Verifica configurações do OBS
    debug_obs_config()

    # 4. Thread para monitorar a transmissão (se cair, reinicia)
    threading.Thread(target=verificar_transmissao_periodicamente, daemon=True).start()

    # 5. Configuração do MQTT (aguarda mensagem para iniciar)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.tls_set()
    client.on_message = on_mqtt_message

    try:
        client.connect(MQTT_CLUSTER_URL, 8883)
        client.subscribe("alert")
        print("🔌 Conectado ao MQTT. Aguardando mensagens para iniciar transmissão...")
        client.loop_forever()

    except Exception as e:
        print(f"❌ Erro no MQTT: {e}")
    finally:
        if grava:
            grava = False
        if transmite:
            parar_transmissao()
        client.disconnect()
        print("✅ Programa encerrado corretamente")

if __name__ == "__main__":
    main()