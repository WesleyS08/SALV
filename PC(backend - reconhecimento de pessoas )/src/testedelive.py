from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os
import json

# Escopos necessários
SCOPES = ["https://www.googleapis.com/auth/youtube"]
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

# Caminhos para o arquivo de credenciais e o token
CLIENT_SECRET_FILE = r'C:\Users\ws780\Documents\GitHub\SALV\PC(backend - reconhecimento de pessoas )\src\client_secret.json'  # Caminho completo para o arquivo client_secret.json
TOKEN_FILE = r'C:\Users\ws780\Documents\GitHub\SALV\PC(backend - reconhecimento de pessoas )\src\token.json'  # Caminho completo para armazenar o token de acesso

# Função para autenticar e obter as credenciais
def obter_credenciais():
    creds = None
    # Se o token.json já existir, carrega as credenciais
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    # Se não houver credenciais válidas, faça o login novamente
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=8080, open_browser=True)  # Primeira vez, abre o navegador

        # Salva as credenciais para a próxima execução
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    
    return creds

# Função para criar a transmissão no YouTube
def criar_transmissao_youtube():
    try:
        creds = obter_credenciais()  # Obtém as credenciais

        # Criação da transmissão no YouTube
        youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, credentials=creds)
        
        request = youtube.liveStreams().insert(
            part="snippet,cdn,contentDetails,status",
            body={
                "snippet": {
                    "title": "Detecção de Segurança em Tempo Real",
                    "description": "Transmissão automática de detecção com YOLO"
                },
                "cdn": {
                    "resolution": "1080p",           # Adicione isto
                    "ingestionType": "rtmp",
                    "frameRate": "30fps"
                },
                "contentDetails": {
                    "isReusable": False
                }
            }
        )

        response = request.execute()
        print("Resposta da API:", json.dumps(response, indent=2))  # Log detalhado
        
        # Extração da URL RTMP
        ingestion_info = response["cdn"]["ingestionInfo"]
        rtmp_url = f"{ingestion_info['ingestionAddress']}/{ingestion_info['streamName']}"
        print(f"URL RTMP Gerada: {rtmp_url}")
        
        return rtmp_url
    
    except Exception as e:
        print(f"❌ Erro na criação da transmissão: {str(e)}")
        return None

# Chamada para criar a transmissão
if __name__ == '__main__':
    rtmp_url = criar_transmissao_youtube()
    if rtmp_url:
        print(f"Transmissão criada com sucesso. URL RTMP: {rtmp_url}")
    else:
        print("Falha ao criar transmissão.")
