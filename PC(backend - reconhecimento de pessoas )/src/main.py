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
OBS_WS_HOST = "192.168.1.6"
OBS_WS_PORT = 4455
OBS_WS_PASSWORD = os.getenv("OBS_WS_PASSWORD")
NOME_CENA = "Detecção"

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

def iniciar_obs():
    try:
        if is_obs_running():
            print("OBS já está em execução.")
            return True

        obs_path = r"C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe"
        if not os.path.exists(obs_path):
            raise FileNotFoundError(f"OBS não encontrado: {obs_path}")

        subprocess.run(["taskkill", "/f", "/im", "obs64.exe"], shell=True,
                      stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        time.sleep(2)

        subprocess.Popen([obs_path, "--startvirtualcam", "--minimize-to-tray", "--lang", "pt-BR", "--disable-updater"])
        print("OBS iniciado!")
        time.sleep(10)
        return True

    except Exception as e:
        print(f"Erro ao iniciar OBS: {e}")
        time.sleep(5)
        return False

def conectar_obs():
    global obs
    try:
        obs = ReqClient(host=OBS_WS_HOST, port=OBS_WS_PORT, password=OBS_WS_PASSWORD)
        print("Conectado ao OBS via WebSocket!")
        return True
    except Exception as e:
        print(f"Erro ao conectar OBS: {e}")
        return False

def iniciar_transmissao():
    global transmite
    try:
        status = obs.get_stream_status()
        if not status.output_active:
            cenas = obs.get_scene_list().scenes
            nomes_cenas = [scene['sceneName'] for scene in cenas]

            if NOME_CENA in nomes_cenas:
                obs.set_current_program_scene(NOME_CENA)
                print(f"Mudando para cena: {NOME_CENA}")
            else:
                print(f"Atenção: Cena '{NOME_CENA}' não encontrada! Mantendo cena atual.")

            obs.start_stream()
            transmite = True
            atualizar_ao_vivo_no_db(True)  
            print("🎥 Iniciando transmissão para a live 'segurança 24 horas' no YouTube!")
        else:
            print("OBS já está transmitindo!")

    except Exception as e:
        print(f"Erro ao iniciar transmissão: {e}")

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

def pausar_transmissao():
    global transmite
    if transmite:
        parar_transmissao() 
        print("Transmissão pausada devido à parada do modelo.")
    else:
        print("A transmissão já está pausada.")

def retomar_transmissao():
    global transmite
    if not transmite:
        iniciar_transmissao()  
        print("Retomando transmissão após reinício do modelo.")
    else:
        print("A transmissão já está em andamento.")

def atualizar_ao_vivo_no_db(status: bool):
    try:
        res = supabase.table('ngrok_links').update({"AoVivo": True}).eq("id", 1).execute()
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

    if grava:
        retomar_transmissao()  # Retoma a transmissão quando o modelo voltar

def on_mqtt_message(client, userdata, msg):
    global grava

    mensagem = msg.payload.decode().lower()
    print(f"MQTT: {mensagem}")

    if "acesso negado" in mensagem and not grava:
        grava = True
        threading.Thread(target=processar_deteccoes, daemon=True).start()
        threading.Timer(3, iniciar_transmissao).start()
    elif "alerta cancelado, acesso liberado" in mensagem and grava:
        grava = False
        parar_transmissao()

def main():
    iniciar_obs()

    for _ in range(10):
        if conectar_obs():
            break
        print("Tentando conectar novamente...")
        time.sleep(2)
    else:
        print("Não foi possível conectar ao OBS!")
        return

    client = mqtt.Client()
    client.username_pw_set(os.getenv("MQTT_USERNAME"), os.getenv("MQTT_PASSWORD"))
    client.tls_set()
    client.on_message = on_mqtt_message

    try:
        client.connect(os.getenv("MQTT_CLUSTER_URL"), 8883)
        client.subscribe("alert")
        print("Conectado ao MQTT. Aguardando mensagens...")
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nEncerrando...")
    finally:
        if grava:
            grava = False
            time.sleep(1)
        if transmite:
            parar_transmissao()
        if obs:
            obs.disconnect()
        client.disconnect()

if __name__ == "__main__":
    main()