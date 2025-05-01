import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
import subprocess
from dotenv import load_dotenv
import sys

class SecuritySystemConfig:
    def __init__(self, root):
        # Carrega variáveis de ambiente
        load_dotenv()
        
        self.root = root
        self.root.title("Sistema de Segurança - Configuração")
        self.root.minsize(800, 600)
        self.root.update_idletasks()
        self.root.geometry(f"{self.root.winfo_width()}x{self.root.winfo_height()}")
        
        # Configurações padrão
        self.config_file = os.path.join(os.getcwd(), "src", "security_config.json")  
        self.env_file = ".env"
        
        # Configurações padrão (valores públicos)
        self.default_config = {
            "OBS_WS_HOST": "192.168.1.6",
            "OBS_WS_PORT": "4455",
            "NOME_CENA": "Detecção",
            "FONTE_VIDEO": "Camera_Seguranca",
            "IP_WEBCAM_URL": "http://192.168.0.167:8080/video",
            "IP_WEBCAM_STATUS": "http://192.168.0.167:8080/status.json"
        }
        
        # Configurações sensíveis (carregadas do .env)
        self.env_config = {
            "OBS_WS_PASSWORD": os.getenv("OBS_WS_PASSWORD", ""),
            "IP_WEBCAM_USER": os.getenv("IP_WEBCAM_USER", ""),
            "IP_WEBCAM_PASS": os.getenv("IP_WEBCAM_PASS", ""),
            "MQTT_CLUSTER_URL": os.getenv("MQTT_CLUSTER_URL", ""),
            "MQTT_USERNAME": os.getenv("MQTT_USERNAME", ""),
            "MQTT_PASSWORD": os.getenv("MQTT_PASSWORD", ""),
            "YOUTUBE_STREAM_KEY": os.getenv("YOUTUBE_STREAM_KEY", ""),
            "SUPABASE_URL": os.getenv("SUPABASE_URL", ""),
            "SUPABASE_KEY": os.getenv("SUPABASE_KEY", ""),
            "USUARIO_ID": os.getenv("USUARIO_ID", "")
        }
        
        # Dicionário de widgets
        self.entries = {}
        self.env_entries = {}
        
        self.setup_ui()
        self.load_config()

    def setup_ui(self):
        """Configura a interface gráfica"""
        # Frame principal com scrollbar
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        canvas = tk.Canvas(main_frame)
        scrollbar = ttk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Notebook (abas)
        notebook = ttk.Notebook(scrollable_frame)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Cria as abas
        self.create_obs_tab(notebook)
        self.create_camera_tab(notebook)
        self.create_mqtt_tab(notebook)
        self.create_supabase_tab(notebook)
        self.create_system_tab(notebook)
        
        # Botões de ação
        btn_frame = ttk.Frame(scrollable_frame)
        btn_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(btn_frame, text="Salvar Configurações", command=self.save_config).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Carregar Configurações", command=self.load_config).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Restaurar Padrões", command=self.reset_defaults).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Iniciar Sistema", command=self.start_system, style='Accent.TButton').pack(side=tk.RIGHT, padx=5)
        
        # Configura estilo para botão de destaque
        self.style = ttk.Style()
        self.style.configure('Accent.TButton', foreground='white', background='#0078d7')

    def create_entry_field(self, parent, label, row, config_key, is_env=False, password=False):
        """Cria um campo de entrada uniforme"""
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky=tk.W, pady=2)
        entry = ttk.Entry(parent, show="*" if password else "")
        entry.grid(row=row, column=1, sticky=tk.EW, padx=5, pady=2)
        
        if is_env:
            self.env_entries[config_key] = entry
        else:
            self.entries[config_key] = entry
            
        return entry

    def create_obs_tab(self, notebook):
        """Cria a aba de configuração do OBS"""
        frame = ttk.Frame(notebook, padding=10)
        notebook.add(frame, text="OBS Studio")
        
        ttk.Label(frame, text="Configurações do OBS WebSocket", font=('Arial', 10, 'bold')).grid(row=0, column=0, columnspan=2, pady=5, sticky=tk.W)
        
        self.create_entry_field(frame, "Host OBS:", 1, "OBS_WS_HOST")
        self.create_entry_field(frame, "Porta OBS:", 2, "OBS_WS_PORT")
        self.create_entry_field(frame, "Senha OBS:", 3, "OBS_WS_PASSWORD", is_env=True, password=True)
        self.create_entry_field(frame, "Nome da Cena:", 4, "NOME_CENA")
        self.create_entry_field(frame, "Fonte de Vídeo:", 5, "FONTE_VIDEO")
        
        frame.grid_columnconfigure(1, weight=1)

    def create_camera_tab(self, notebook):
        """Cria a aba de configuração de câmeras"""
        frame = ttk.Frame(notebook, padding=10)
        notebook.add(frame, text="Câmeras")
        
        ttk.Label(frame, text="Configurações de Câmera IP", font=('Arial', 10, 'bold')).grid(row=0, column=0, columnspan=2, pady=5, sticky=tk.W)
        
        self.create_entry_field(frame, "URL da Câmera:", 1, "IP_WEBCAM_URL")
        self.create_entry_field(frame, "URL de Status:", 2, "IP_WEBCAM_STATUS")
        self.create_entry_field(frame, "Usuário:", 3, "IP_WEBCAM_USER", is_env=True)
        self.create_entry_field(frame, "Senha:", 4, "IP_WEBCAM_PASS", is_env=True, password=True)
        
        ttk.Button(frame, text="Testar Conexão", command=self.test_camera).grid(row=5, column=1, sticky=tk.E, pady=10)
        frame.grid_columnconfigure(1, weight=1)

    def create_mqtt_tab(self, notebook):
        """Cria a aba de configuração do MQTT"""
        frame = ttk.Frame(notebook, padding=10)
        notebook.add(frame, text="MQTT")
        
        ttk.Label(frame, text="Configurações do Servidor MQTT", font=('Arial', 10, 'bold')).grid(row=0, column=0, columnspan=2, pady=5, sticky=tk.W)
        
        self.create_entry_field(frame, "URL do Cluster:", 1, "MQTT_CLUSTER_URL", is_env=True)
        self.create_entry_field(frame, "Usuário:", 2, "MQTT_USERNAME", is_env=True)
        self.create_entry_field(frame, "Senha:", 3, "MQTT_PASSWORD", is_env=True, password=True)
        
        frame.grid_columnconfigure(1, weight=1)

    def create_supabase_tab(self, notebook):
        """Cria a aba de configuração do Supabase"""
        frame = ttk.Frame(notebook, padding=10)
        notebook.add(frame, text="Supabase")
        
        ttk.Label(frame, text="Configurações do Supabase", font=('Arial', 10, 'bold')).grid(row=0, column=0, columnspan=2, pady=5, sticky=tk.W)
        
        self.create_entry_field(frame, "URL do Supabase:", 1, "SUPABASE_URL", is_env=True)
        self.create_entry_field(frame, "Chave API:", 2, "SUPABASE_KEY", is_env=True, password=True)
        self.create_entry_field(frame, "ID do Usuário:", 3, "USUARIO_ID", is_env=True)
        
        frame.grid_columnconfigure(1, weight=1)

    def create_system_tab(self, notebook):
        """Cria a aba de informações do sistema"""
        frame = ttk.Frame(notebook, padding=10)
        notebook.add(frame, text="Sistema")
        
        ttk.Label(frame, text="Informações do Sistema", font=('Arial', 10, 'bold')).grid(row=0, column=0, columnspan=2, pady=5, sticky=tk.W)
        
        # Área de informações
        info_text = tk.Text(frame, height=10, width=60, wrap=tk.WORD)
        info_text.grid(row=1, column=0, columnspan=2, padx=5, pady=5)
        
        # Adiciona informações básicas
        info = [
            "Sistema de Segurança Inteligente",
            "Versão: 1.0.0",
            "\nConfigurações atuais:",
            f"- Host OBS: {self.default_config.get('OBS_WS_HOST', 'Não configurado')}",
            f"- Câmera IP: {self.default_config.get('IP_WEBCAM_URL', 'Não configurada')}",
            "\nInstruções:",
            "1. Configure todos os parâmetros necessários",
            "2. Salve as configurações",
            "3. Clique em 'Iniciar Sistema' para executar"
        ]
        
        info_text.insert(tk.END, "\n".join(info))
        info_text.config(state=tk.DISABLED)
        
        # Botão para visualizar .env
        ttk.Button(frame, text="Visualizar Configurações Sensíveis", command=self.show_env_config).grid(row=2, column=0, columnspan=2, pady=5)

    def load_config(self):
        """Carrega as configurações do arquivo JSON e do .env"""
        try:
            # Carrega configurações públicas do JSON
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
            else:
                config = {}
                
            # Preenche os campos públicos
            for key, entry in self.entries.items():
                entry.delete(0, tk.END)
                entry.insert(0, config.get(key, self.default_config.get(key, "")))
            
            # Preenche os campos sensíveis (do .env)
            for key, entry in self.env_entries.items():
                entry.delete(0, tk.END)
                entry.insert(0, self.env_config.get(key, ""))
            
            messagebox.showinfo("Sucesso", "Configurações carregadas com sucesso!")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao carregar configurações:\n{str(e)}")

    def save_config(self):
        """Salva todas as configurações (públicas no JSON e sensíveis no .env)"""
        try:
            # Salva configurações públicas
            config = {key: entry.get() for key, entry in self.entries.items()}
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=4)

            # Salva configurações sensíveis no .env
            env_config = {key: entry.get() for key, entry in self.env_entries.items()}
            with open(self.env_file, 'w') as f:
                for key, value in env_config.items():
                    f.write(f"{key}={value}\n")

            messagebox.showinfo("Sucesso", "Todas as configurações foram salvas!")

        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao salvar configurações:\n{str(e)}")

    def reset_defaults(self):
        """Restaura todas as configurações para os valores padrão"""
        if messagebox.askyesno("Confirmar", "Deseja restaurar TODAS as configurações para os valores padrão?"):
            # Restaura configurações públicas
            for key, entry in self.entries.items():
                entry.delete(0, tk.END)
                entry.insert(0, self.default_config.get(key, ""))
            
            # Restaura configurações sensíveis
            for key, entry in self.env_entries.items():
                entry.delete(0, tk.END)
                entry.insert(0, os.getenv(key, ""))
            
            messagebox.showinfo("Sucesso", "Configurações restauradas para os padrões")

    def test_camera(self):
        """Testa a conexão com a câmera configurada"""
        try:
            url = self.entries["IP_WEBCAM_URL"].get()
            user = self.env_entries["IP_WEBCAM_USER"].get()
            password = self.env_entries["IP_WEBCAM_PASS"].get()
            
            if not url:
                raise ValueError("URL da câmera não configurada")
            
            # Simulação de teste - implemente a verificação real aqui
            messagebox.showinfo(
                "Teste de Câmera", 
                f"Conexão será testada com:\n"
                f"URL: {url}\n"
                f"Usuário: {user if user else 'Não configurado'}\n"
                "Implemente aqui o teste real de conexão"
            )
            
        except Exception as e:
            messagebox.showerror("Erro no Teste", f"Falha ao testar câmera:\n{str(e)}")

    def show_env_config(self):
        """Exibe as configurações sensíveis (somente visualização)"""
        env_info = ["Configurações Sensíveis (armazenadas no .env):"]
        
        for key, entry in self.env_entries.items():
            value = entry.get()
            display_value = f"{value[:2]}*****" if value and len(value) > 2 else "Não configurado"
            env_info.append(f"{key}: {display_value}")
        
        messagebox.showinfo(
            "Configurações Sensíveis", 
            "\n".join(env_info) + "\n\nObservação: Estas configurações não são salvas no arquivo JSON"
        )

    def start_system(self):
        try:
            self.save_config()
            
            main_path = os.path.join(os.path.dirname(__file__), "main.py")
            if not os.path.exists(main_path):
                raise FileNotFoundError(f"Arquivo main.py não encontrado em: {main_path}")
    
            # Cria um arquivo batch temporário
            batch_content = f"""
            @echo off
            title Sistema de Seguranca - Main
            python "{main_path}"
            pause
            """
            
            batch_path = os.path.join(os.path.dirname(__file__), "start_main.bat")
            with open(batch_path, 'w') as f:
                f.write(batch_content)
            
            subprocess.Popen(['cmd', '/c', batch_path], creationflags=subprocess.CREATE_NEW_CONSOLE)
            messagebox.showinfo("Sucesso", "Sistema iniciado com sucesso!")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Falha ao iniciar:\n{str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = SecuritySystemConfig(root)
    root.mainloop()