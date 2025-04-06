import cv2
from flask import Flask, render_template_string, Response

app = Flask(__name__)

# Página simples HTML que exibe o vídeo
html = '''
<html>
<head><title>Vídeo Teste</title></head>
<body>
<h1>Stream da Câmera</h1>
<img src="/video_feed">
</body>
</html>
'''

# Gera frames da webcam
def gerar_frame():
    cap = cv2.VideoCapture(1)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        _, jpeg = cv2.imencode('.jpg', frame)
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template_string(html)

@app.route('/video_feed')
def video_feed():
    return Response(gerar_frame(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
