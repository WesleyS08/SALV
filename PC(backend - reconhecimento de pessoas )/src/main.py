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
from datetime import datetime
from ultralytics import YOLO
import mediapipe as mp

load_dotenv()

mqtt_username = os.getenv("MQTT_USERNAME")
mqtt_password = os.getenv("MQTT_PASSWORD")
mqtt_cluster_url = os.getenv("MQTT_CLUSTER_URL")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase = create_client(supabase_url, supabase_key)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)

yolo_model = YOLO(os.path.join(BASE_DIR, "models", "yolov8n.pt"))
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

gravando = False
hora_inicio = None
hora_fim = None
video_writer = None
caminho_video_local = None
frame_atual = None

def gerar_video():
    global gravando, hora_inicio, hora_fim, video_writer, caminho_video_local, frame_atual
    cap = None
    while cap is None:
        cap = cv2.VideoCapture(1)
        if not cap.isOpened():
            print("ERRO: Câmera não disponível, tentando novamente...")
            time.sleep(5) 
            
    # Configuração da câmera
    cap = cv2.VideoCapture(1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if not cap.isOpened():
        print("ERRO: Câmera não disponível!")
        return

    print("Iniciando gravação...")
    hora_inicio = datetime.now()
    nome_arquivo = f"gravacao_{hora_inicio.strftime('%Y%m%d_%H%M%S')}.mp4"
    caminho_video_local = os.path.join(BASE_DIR, "gravacoes", nome_arquivo)
    os.makedirs(os.path.dirname(caminho_video_local), exist_ok=True)

    fps = 30.0
    codec = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(caminho_video_local, codec, fps, (1280, 720))

    COR_PESSOA = (61, 0, 134)
    COR_TEXTO = (61, 0, 134)

    with mp_face_detection.FaceDetection(
        model_selection=0,
        min_detection_confidence=0.5
    ) as face_detection:
        
        while gravando:
            start_time = time.time()
            
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (1280, 720))
            display_frame = frame.copy()
            
            results = yolo_model(frame, imgsz=640, conf=0.6)[0]
            pessoas_detectadas = 0

            for det in results.boxes:
                cls = int(det.cls.item())
                if cls == 0:  
                    pessoas_detectadas += 1
                    x1, y1, x2, y2 = map(int, det.xyxy[0])
                    
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), COR_PESSOA, 2)
                    cv2.putText(display_frame, "PESSOA", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)

                    body_roi = frame[y1:y2, x1:x2]
                    if body_roi.size > 0:
                        rgb_roi = cv2.cvtColor(body_roi, cv2.COLOR_BGR2RGB)
                        face_results = face_detection.process(rgb_roi)

                        if face_results.detections:
                            for detection in face_results.detections:
                                bbox = detection.location_data.relative_bounding_box
                                ih, iw = body_roi.shape[:2]
                                fx, fy = int(bbox.xmin * iw), int(bbox.ymin * ih)
                                fw, fh = int(bbox.width * iw), int(bbox.height * ih)
                                
                                abs_fx, abs_fy = x1 + fx, y1 + fy
                                
                                face_close_up = frame[
                                    max(0, abs_fy-30):min(720, abs_fy+fh+30), 
                                    max(0, abs_fx-30):min(1280, abs_fx+fw+30)
                                ]
                                
                                try:
                                    face_close_up = cv2.resize(face_close_up, (200, 200))
                                    display_frame[20:220, 1060:1260] = face_close_up
                                    cv2.rectangle(display_frame, (1059, 19), (1261, 221), COR_PESSOA, 2)
                                    cv2.putText(display_frame, "Rosto", (1070, 30), 
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, COR_TEXTO, 1)
                                except Exception as e:
                                    print(f"Erro no close-up: {e}")

            frame_atual = display_frame.copy()
            video_writer.write(display_frame)
            
            current_fps = 1.0 / (time.time() - start_time)
            cv2.putText(display_frame, f"FPS: {current_fps:.1f}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            print(f"Pessoas: {pessoas_detectadas} | FPS: {current_fps:.1f}")
            time.sleep(max(0, 0.033 - (time.time() - start_time)))  

    cap.release()
    video_writer.release()
    print("Gravação encerrada.")

    hora_fim = datetime.now()
    duracao = (hora_fim - hora_inicio).total_seconds()
    url_video = enviar_video_supabase(caminho_video_local)
    salvar_informacoes_filmagem(hora_inicio, hora_fim, duracao, url_video, caminho_video_local)


def verificar_video_valido(caminho):
    try:
        cap = cv2.VideoCapture(caminho)
        if not cap.isOpened():
            return False
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        return width > 0 and height > 0 and fps > 0
    except:
        return False

def converter_para_mp4_compativel(caminho_entrada, caminho_saida):
    try:
        command = [
            'ffmpeg',
            '-i', caminho_entrada,
            '-c:v', 'libx264',
            '-profile:v', 'high',
            '-pix_fmt', 'yuv420p',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            caminho_saida
        ]
        subprocess.run(command, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Falha na conversão do vídeo: {str(e)}")
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
            "content-type": "video/mp4",
            "cache-control": "3600",
            "x-upsert": "true"
        }


        chunk_size = 1024 * 1024 * 5  
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
        url_publica += f"?t={int(time.time())}"

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

def on_message(client, userdata, msg):
    global gravando
    message = msg.payload.decode("utf-8").lower()
    print(f"[MQTT] Mensagem recebida: {message}")

    if message == "acesso negado" and not gravando:
        gravando = True
        threading.Thread(target=gerar_video, daemon=True).start()
    elif message == "alerta cancelado, acesso liberado" and gravando:
        gravando = False

def gerar_frame():
    global frame_atual
    while True:
        if frame_atual is not None:
            _, jpeg = cv2.imencode('.jpg', frame_atual, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
        time.sleep(0.033)  

@app.route('/')
def video_feed():
    return Response(gerar_frame(), mimetype='multipart/x-mixed-replace; boundary=frame')

def salvar_link_ngrok(url):
    try:
        supabase.table('ngrok_links').upsert(
            {"id": 1, "url": url}, on_conflict=["id"]
        ).execute()
        print("Link do ngrok salvo no Supabase.")
    except Exception as e:
        print("Erro ao salvar o link:", e)

def start_ngrok():
    print("Iniciando ngrok...")
    try:
        subprocess.Popen(['ngrok', 'http', '5000'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        
        time.sleep(5)  
        
        response = requests.get('http://localhost:4040/api/tunnels', timeout=10)
        if response.status_code == 200:
            public_url = response.json()['tunnels'][0]['public_url']
            print("ngrok URL:", public_url)
            salvar_link_ngrok(public_url)
        else:
            print("Erro ao obter URL do ngrok:", response.text)
    except Exception as e:
        print("Erro ao iniciar ngrok:", str(e))

def conectar_mqtt():
    client = paho.Client(protocol=paho.MQTTv5)
    client.on_message = on_message
    client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
    client.username_pw_set(mqtt_username, mqtt_password)
    
    while True:
        try:
            client.connect(mqtt_cluster_url, 8883)
            client.subscribe("alert", qos=0)
            print("Conectado ao MQTT.")
            return client
        except Exception as e:
            print(f"Tentando reconectar: {str(e)}")
            time.sleep(5)

if __name__ == '__main__':
    os.makedirs(os.path.join(BASE_DIR, "gravacoes"), exist_ok=True)
    
    threading.Thread(target=app.run, 
                    kwargs={"host": "0.0.0.0", "port": 5000, "threaded": True},
                    daemon=True).start()
    
    threading.Thread(target=start_ngrok, daemon=True).start()
    
    mqtt_client = conectar_mqtt()
    mqtt_client.loop_forever()