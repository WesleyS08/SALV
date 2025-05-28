import serial
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import qrcode
from io import BytesIO
from threading import Thread

# Configurações da porta serial
PORTA_SERIAL = 'COM5'
BAUD_RATE = 115200

# Interface gráfica
root = tk.Tk()
root.title("Leitor de Cartão RFID - ESP32")
root.geometry("500x400")
root.resizable(False, False)
root.configure(bg="#f0f0f0")

# Título
titulo = ttk.Label(root, text="Validação de Cartões RFID", font=("Segoe UI", 18, "bold"))
titulo.pack(pady=20)

# Exibição do ID
id_label = ttk.Label(root, text="Aguardando leitura...", font=("Segoe UI", 14))
id_label.pack(pady=10)

# Espaço para o QR Code
qr_label = ttk.Label(root)
qr_label.pack(pady=10)

# Função para gerar o QR Code
def gerar_qrcode(valor):
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(valor)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return ImageTk.PhotoImage(Image.open(buf))

# Thread para leitura da serial
def ler_serial():
    try:
        with serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1) as ser:
            while True:
                linha = ser.readline().decode('utf-8').strip()
                if linha:
                    id_label.config(text=linha)
                    qr_img = gerar_qrcode(linha)
                    qr_label.config(image=qr_img)
                    qr_label.image = qr_img
    except serial.SerialException as e:
        id_label.config(text=f"Erro: {e}")

# Iniciar leitura serial em thread
Thread(target=ler_serial, daemon=True).start()

# Iniciar interface
root.mainloop()
