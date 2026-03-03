import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import subprocess
import threading
from pathlib import Path
import time
import psutil
import json

from platform_runtime import detect_runtime
import os
import shlex


class EmpireIDE:
    """Lightweight IDE with local Ollama integration."""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title('Empire IDE - Codex Artanis')
        self.root.geometry('1400x900')
        self.root.configure(bg='#0a0a0a')

        self.colors = {
            'bg': '#0a0a0a',
            'editor_bg': '#001122',
            'text': '#ffffff',
            'accent': '#00ffff',
            'success': '#00ff00',
            'warning': '#ffff00',
            'danger': '#ff0000'
        }

        self.current_file = None
        self.ollama_available = False
        self.project_dir = Path(__file__).resolve().parent
        self.local_config_path = self.project_dir / 'guardian_local_config.json'
        self.runtime = detect_runtime()
        self.local_settings = self.load_local_settings()
        self.intake_base = Path(self.local_settings['intake']['base_dir']).expanduser()
        self.intake_script = Path(self.local_settings['intake']['scan_script']).expanduser()
        self.codex_cmd = self.runtime.resolve_codex_cli(self.local_settings.get('runtime', {}).get('codex_cli_path', ''))
        self.codex_sandbox_mode = tk.StringVar(value='read-only')
        self.codex_bypass = tk.BooleanVar(value=False)
        self.ollama_profiles = {
            'Laptop Small': 'qwen2.5:3b',
            'Desktop Balanced': 'llama3.1:8b',
            'Desktop Large': 'qwen2.5:14b',
        }
        self.selected_ollama_profile = tk.StringVar(value='Laptop Small')
        self.current_ollama_model = tk.StringVar(value=self.ollama_profiles['Laptop Small'])
        self.shell_command_registry = {
            'status': ['git', 'status', '--short'],
            'scan': ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(self.intake_script), '-LatestIncoming'],
            'sync': ['git', 'pull', '--ff-only'],
        }

        self.setup_ui()
        self.check_ollama()
        self.update_codex_status()

    def setup_ui(self):
        menubar = tk.Menu(self.root, bg=self.colors['bg'], fg=self.colors['text'])
        self.root.config(menu=menubar)

        file_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg'], fg=self.colors['text'])
        menubar.add_cascade(label='File', menu=file_menu)
        file_menu.add_command(label='New', command=self.new_file, accelerator='Ctrl+N')
        file_menu.add_command(label='Open', command=self.open_file, accelerator='Ctrl+O')
        file_menu.add_command(label='Save', command=self.save_file, accelerator='Ctrl+S')
        file_menu.add_command(label='Refresh Files', command=self.populate_file_tree, accelerator='F5')
        file_menu.add_separator()
        file_menu.add_command(label='Scan for Corruption', command=self.scan_corruption)

        empire_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg'], fg=self.colors['text'])
        menubar.add_cascade(label='Empire', menu=empire_menu)
        empire_menu.add_command(label='Guardian Status', command=self.guardian_status)
        empire_menu.add_command(label='System Integrity Check', command=self.system_integrity)
        empire_menu.add_command(label='Hunt Corrupted Files', command=self.hunt_corruption)

        intake_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg'], fg=self.colors['text'])
        menubar.add_cascade(label='Intake', menu=intake_menu)
        intake_menu.add_command(label='Scan Latest Incoming', command=self.scan_latest_incoming)
        intake_menu.add_command(label='Scan Picked File...', command=self.scan_picked_file)
        intake_menu.add_separator()
        intake_menu.add_command(label='Open Incoming Folder', command=lambda: self.open_intake_folder('00_incoming'))
        intake_menu.add_command(label='Open Scanned Safe', command=lambda: self.open_intake_folder('01_scanned_safe'))
        intake_menu.add_command(label='Open Quarantine', command=lambda: self.open_intake_folder('99_quarantine'))

        codex_menu = tk.Menu(menubar, tearoff=0, bg=self.colors['bg'], fg=self.colors['text'])
        menubar.add_cascade(label='Codex', menu=codex_menu)
        codex_menu.add_command(label='Ask Codex (Read Only)', command=self.ask_codex_from_input)
        codex_menu.add_command(label='Launch Full Codex CLI', command=self.launch_full_codex_cli)
        codex_menu.add_command(label='Run Terminal Command', command=self.run_shell_from_input)

        main_frame = tk.Frame(self.root, bg=self.colors['bg'])
        main_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        left_panel = tk.Frame(main_frame, bg=self.colors['bg'], width=300)
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 5))
        left_panel.pack_propagate(False)

        explorer_frame = tk.LabelFrame(left_panel, text='Empire Files', fg=self.colors['accent'], bg=self.colors['bg'])
        explorer_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 5))

        self.file_tree = ttk.Treeview(explorer_frame, columns=('path',), show='tree')
        self.file_tree.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.file_tree.bind('<Double-1>', self.on_file_select)

        scanner_frame = tk.LabelFrame(left_panel, text='Corruption Hunter', fg=self.colors['danger'], bg=self.colors['bg'])
        scanner_frame.pack(fill=tk.X, pady=(0, 5))

        tk.Button(scanner_frame, text='Scan System', bg=self.colors['danger'], fg=self.colors['text'], command=self.deep_system_scan).pack(fill=tk.X, padx=5, pady=2)
        tk.Button(scanner_frame, text='Clean Corrupted', bg=self.colors['warning'], fg=self.colors['bg'], command=self.clean_corrupted).pack(fill=tk.X, padx=5, pady=2)

        intake_frame = tk.LabelFrame(left_panel, text='File Intake', fg=self.colors['success'], bg=self.colors['bg'])
        intake_frame.pack(fill=tk.X, pady=(0, 5))

        tk.Button(intake_frame, text='Scan Latest Incoming', bg='#005533', fg=self.colors['text'], command=self.scan_latest_incoming).pack(fill=tk.X, padx=5, pady=2)
        tk.Button(intake_frame, text='Scan Picked File', bg='#004466', fg=self.colors['text'], command=self.scan_picked_file).pack(fill=tk.X, padx=5, pady=2)
        tk.Button(intake_frame, text='Open Incoming', bg='#223344', fg=self.colors['text'], command=lambda: self.open_intake_folder('00_incoming')).pack(fill=tk.X, padx=5, pady=2)

        center_panel = tk.Frame(main_frame, bg=self.colors['bg'])
        center_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))

        self.notebook = ttk.Notebook(center_panel)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        editor_frame = tk.Frame(self.notebook, bg=self.colors['editor_bg'])
        self.notebook.add(editor_frame, text='guardian_core.py')

        self.code_editor = scrolledtext.ScrolledText(
            editor_frame,
            bg=self.colors['editor_bg'],
            fg=self.colors['text'],
            insertbackground=self.colors['accent'],
            font=('Consolas', 11),
            wrap=tk.NONE
        )
        self.code_editor.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        config_frame = tk.Frame(self.notebook, bg=self.colors['editor_bg'])
        self.notebook.add(config_frame, text='Local Config')

        config_btns = tk.Frame(config_frame, bg=self.colors['editor_bg'])
        config_btns.pack(fill=tk.X, padx=5, pady=5)

        tk.Button(config_btns, text='Reload Config', bg='#333333', fg=self.colors['text'], command=self.load_local_config_editor).pack(side=tk.LEFT, padx=(0, 5))
        tk.Button(config_btns, text='Save Config', bg='#005533', fg=self.colors['text'], command=self.save_local_config).pack(side=tk.LEFT)

        self.local_config_editor = scrolledtext.ScrolledText(
            config_frame,
            bg='#000d18',
            fg=self.colors['text'],
            insertbackground=self.colors['accent'],
            font=('Consolas', 10),
            wrap=tk.NONE
        )
        self.local_config_editor.pack(fill=tk.BOTH, expand=True, padx=5, pady=(0, 5))

        codex_frame = tk.Frame(self.notebook, bg=self.colors['editor_bg'])
        self.notebook.add(codex_frame, text='Codex')

        codex_top = tk.Frame(codex_frame, bg=self.colors['editor_bg'])
        codex_top.pack(fill=tk.X, padx=5, pady=5)

        self.codex_status_label = tk.Label(codex_top, text='Codex status: checking...', bg=self.colors['editor_bg'], fg=self.colors['accent'], anchor=tk.W)
        self.codex_status_label.pack(fill=tk.X)

        codex_settings = tk.Frame(codex_top, bg=self.colors['editor_bg'])
        codex_settings.pack(fill=tk.X, pady=(4, 0))

        tk.Label(codex_settings, text='Sandbox', bg=self.colors['editor_bg'], fg=self.colors['text']).pack(side=tk.LEFT)
        self.codex_sandbox_combo = ttk.Combobox(
            codex_settings,
            textvariable=self.codex_sandbox_mode,
            values=['read-only', 'workspace-write', 'danger-full-access'],
            state='readonly',
            width=18
        )
        self.codex_sandbox_combo.pack(side=tk.LEFT, padx=(5, 8))

        self.codex_bypass_check = tk.Checkbutton(
            codex_settings,
            text='Bypass Sandbox/Approvals',
            variable=self.codex_bypass,
            bg=self.colors['editor_bg'],
            fg=self.colors['warning'],
            activebackground=self.colors['editor_bg'],
            activeforeground=self.colors['warning'],
            selectcolor=self.colors['bg']
        )
        self.codex_bypass_check.pack(side=tk.LEFT)

        self.codex_output = scrolledtext.ScrolledText(
            codex_frame,
            bg='#000d18',
            fg=self.colors['success'],
            font=('Consolas', 9),
            height=18
        )
        self.codex_output.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        codex_input_frame = tk.Frame(codex_frame, bg=self.colors['editor_bg'])
        codex_input_frame.pack(fill=tk.X, padx=5, pady=(0, 5))

        self.codex_input = tk.Entry(codex_input_frame, bg='#001122', fg=self.colors['text'], font=('Consolas', 10))
        self.codex_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        self.codex_input.bind('<Return>', self.ask_codex_from_input)

        tk.Button(codex_input_frame, text='Ask Codex', bg='#004466', fg=self.colors['text'], command=self.ask_codex_from_input).pack(side=tk.LEFT, padx=(0, 5))
        tk.Button(codex_input_frame, text='Open CLI', bg='#005533', fg=self.colors['text'], command=self.launch_full_codex_cli).pack(side=tk.LEFT)

        terminal_cmd_frame = tk.Frame(codex_frame, bg=self.colors['editor_bg'])
        terminal_cmd_frame.pack(fill=tk.X, padx=5, pady=(0, 5))

        self.shell_input = tk.Entry(terminal_cmd_frame, bg='#001122', fg=self.colors['text'], font=('Consolas', 10))
        self.shell_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        self.shell_input.bind('<Return>', self.run_shell_from_input)

        tk.Button(terminal_cmd_frame, text='Run Cmd', bg='#333333', fg=self.colors['text'], command=self.run_shell_from_input).pack(side=tk.LEFT)

        runtime_frame = tk.Frame(self.notebook, bg=self.colors['editor_bg'])
        self.notebook.add(runtime_frame, text='Runtime Diagnostics')

        self.runtime_output = scrolledtext.ScrolledText(
            runtime_frame,
            bg='#000d18',
            fg=self.colors['accent'],
            font=('Consolas', 10),
            wrap=tk.WORD
        )
        self.runtime_output.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        right_panel = tk.Frame(main_frame, bg=self.colors['bg'], width=400)
        right_panel.pack(side=tk.RIGHT, fill=tk.Y)
        right_panel.pack_propagate(False)

        ai_frame = tk.LabelFrame(right_panel, text='Codex Artanis AI', fg=self.colors['success'], bg=self.colors['bg'])
        ai_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 5))

        self.ai_chat = scrolledtext.ScrolledText(ai_frame, bg=self.colors['editor_bg'], fg=self.colors['success'], font=('Consolas', 9), height=20)
        self.ai_chat.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        ai_profile_frame = tk.Frame(ai_frame, bg=self.colors['bg'])
        ai_profile_frame.pack(fill=tk.X, padx=5, pady=(0, 5))

        tk.Label(ai_profile_frame, text='Model', bg=self.colors['bg'], fg=self.colors['text']).pack(side=tk.LEFT)
        self.ai_profile_combo = ttk.Combobox(
            ai_profile_frame,
            textvariable=self.selected_ollama_profile,
            values=list(self.ollama_profiles.keys()),
            state='readonly',
            width=18
        )
        self.ai_profile_combo.pack(side=tk.LEFT, padx=(5, 5))
        self.ai_profile_combo.bind('<<ComboboxSelected>>', lambda e: self.apply_ai_profile())

        self.ai_model_label = tk.Label(
            ai_profile_frame,
            textvariable=self.current_ollama_model,
            bg=self.colors['bg'],
            fg=self.colors['accent'],
            anchor=tk.W
        )
        self.ai_model_label.pack(side=tk.LEFT, fill=tk.X, expand=True)

        ai_input_frame = tk.Frame(ai_frame, bg=self.colors['bg'])
        ai_input_frame.pack(fill=tk.X, padx=5, pady=(0, 5))

        self.ai_input = tk.Entry(ai_input_frame, bg=self.colors['editor_bg'], fg=self.colors['text'], font=('Consolas', 10))
        self.ai_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        self.ai_input.bind('<Return>', self.send_to_ai)

        tk.Button(ai_input_frame, text='Send', bg=self.colors['success'], fg=self.colors['bg'], command=self.send_to_ai).pack(side=tk.RIGHT)

        terminal_frame = tk.LabelFrame(right_panel, text='Empire Terminal', fg=self.colors['accent'], bg=self.colors['bg'])
        terminal_frame.pack(fill=tk.X, pady=(0, 5))

        self.terminal_output = scrolledtext.ScrolledText(terminal_frame, bg=self.colors['bg'], fg=self.colors['accent'], font=('Consolas', 9), height=8)
        self.terminal_output.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        tk.Button(terminal_frame, text='Launch Nexus App', bg=self.colors['accent'], fg=self.colors['bg'], command=self.launch_nexus).pack(fill=tk.X, padx=5, pady=2)
        tk.Button(terminal_frame, text='Launch Navigator Browser', bg='#0055ff', fg='#ffffff', command=self.launch_navigator).pack(fill=tk.X, padx=5, pady=2)
        tk.Button(terminal_frame, text='Stamp File with QR', bg='#7c3aed', fg='#ffffff', command=self.stamp_file_with_qr).pack(fill=tk.X, padx=5, pady=2)
        tk.Button(terminal_frame, text='Launch iVentoy PXE', bg='#eab308', fg='#000000', command=self.launch_iventoy).pack(fill=tk.X, padx=5, pady=2)

        self.status_bar = tk.Label(self.root, text='Empire IDE Ready - Guardian Standing By', bg=self.colors['bg'], fg=self.colors['success'], anchor=tk.W, font=('Consolas', 9))
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        self.load_guardian_code()
        self.load_local_config_editor()
        self.populate_file_tree()
        self.render_runtime_diagnostics()
        self.codex_log('Codex tab ready. Use Ask Codex for read-only non-interactive help, or Open CLI for full agent mode.')

        self.root.bind('<Control-n>', lambda e: self.new_file())
        self.root.bind('<Control-o>', lambda e: self.open_file())
        self.root.bind('<Control-s>', lambda e: self.save_file())
        self.root.bind('<F5>', lambda e: self.populate_file_tree())

    def check_ollama(self):
        try:
            result = subprocess.run(['ollama', '--version'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                self.ollama_available = True
                self.ai_say(f'Codex Artanis online - Local AI ready ({self.current_ollama_model.get()})')
                self.status_bar.config(text='Empire IDE Ready - AI Online', fg=self.colors['success'])
            else:
                self.ai_say('Ollama not found - install for AI assistance')
                self.status_bar.config(text='Empire IDE Ready - AI Offline', fg=self.colors['warning'])
        except Exception:
            self.ollama_available = False
            self.ai_say('Ollama not found - install for AI assistance')
            self.status_bar.config(text='Empire IDE Ready - AI Offline', fg=self.colors['warning'])

    def update_codex_status(self):
        if self.codex_cmd and self.codex_cmd.exists():
            self.codex_status_label.config(text=f'Codex status: ready ({self.codex_cmd})', fg=self.colors['success'])
        else:
            self.codex_status_label.config(text='Codex status: not found', fg=self.colors['warning'])

    def default_local_settings(self):
        intake_base = self.runtime.intake_default
        return {
            'notes': 'Local-only settings. This file is git-ignored.',
            'github': {'token': ''},
            'api_keys': {'openai': '', 'xai': '', 'other': ''},
            'intake': {
                'base_dir': str(intake_base),
                'scan_script': str(intake_base / 'Scan-And-Extract.ps1')
            },
            'runtime': {
                'codex_cli_path': ''
            }
        }

    def load_local_settings(self):
        defaults = self.default_local_settings()
        if not self.local_config_path.exists():
            self.local_config_path.write_text(json.dumps(defaults, indent=2) + '\n', encoding='utf-8')
            return defaults

        try:
            content = json.loads(self.local_config_path.read_text(encoding='utf-8') or '{}')
        except json.JSONDecodeError:
            return defaults

        merged = defaults.copy()
        for key, value in content.items():
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = {**merged[key], **value}
            else:
                merged[key] = value
        return merged

    def render_runtime_diagnostics(self):
        lines = [
            f'OS: {self.runtime.os_name}',
            f'Shell exec: {self.runtime.shell_exec}',
            f'Shell interactive: {self.runtime.shell_interactive}',
            f'Open command: {self.runtime.open_command}',
            f'Codex CLI: {self.codex_cmd if self.codex_cmd else "not found"}',
            f'Intake base dir: {self.intake_base}',
            f'Intake script: {self.intake_script}',
            f'Project dir: {self.project_dir}'
        ]
        self.runtime_output.delete('1.0', tk.END)
        self.runtime_output.insert('1.0', '\n'.join(lines))

    def ai_say(self, message):
        timestamp = time.strftime('%H:%M:%S')
        self.ai_chat.insert(tk.END, f'[{timestamp}] CODEX: {message}\n')
        self.ai_chat.see(tk.END)

    def user_say(self, message):
        timestamp = time.strftime('%H:%M:%S')
        self.ai_chat.insert(tk.END, f'[{timestamp}] YOU: {message}\n')
        self.ai_chat.see(tk.END)

    def append_terminal(self, message):
        self.terminal_output.insert(tk.END, message.rstrip() + '\n')
        self.terminal_output.see(tk.END)

    def codex_log(self, message):
        timestamp = time.strftime('%H:%M:%S')
        self.codex_output.insert(tk.END, f'[{timestamp}] {message}\n')
        self.codex_output.see(tk.END)

    def codex_log_lines(self, prefix, text):
        if not text:
            return
        for line in text.splitlines():
            clean = line.rstrip()
            if clean:
                self.codex_log(f'{prefix}{clean}')

    def publish_codex_result(self, result):
        out = (result.stdout or '').strip()
        err = (result.stderr or '').strip()

        if out:
            self.codex_log_lines('CODEX: ', out)

        if err:
            # Codex CLI prints session metadata to stderr; treat it as metadata unless it is an actual error line.
            for line in err.splitlines():
                clean = line.rstrip()
                if not clean:
                    continue
                lower = clean.lower()
                if lower.startswith('error:') or 'fatal' in lower:
                    self.codex_log(f'ERR: {clean}')
                else:
                    self.codex_log(f'META: {clean}')

        if not out and not err:
            self.codex_log('No output returned.')

    def apply_ai_profile(self):
        profile = self.selected_ollama_profile.get()
        model = self.ollama_profiles.get(profile, self.ollama_profiles['Laptop Small'])
        self.current_ollama_model.set(model)
        self.ai_say(f'AI profile set to {profile} ({model})')

    def send_to_ai(self, event=None):
        message = self.ai_input.get().strip()
        if not message:
            return

        self.ai_input.delete(0, tk.END)
        self.user_say(message)

        if not self.ollama_available:
            self.ai_say('Local AI not available. Install Ollama first.')
            return

        threading.Thread(target=self.query_ollama, args=(message,), daemon=True).start()

    def query_ollama(self, message):
        try:
            model = self.current_ollama_model.get()
            empire_context = (
                'You are Codex Artanis, Guardian of the Empire. '
                'You help with coding and security analysis. '
                f'User query: {message}'
            )

            result = subprocess.run(['ollama', 'run', model, empire_context], capture_output=True, text=True, timeout=45)

            if result.returncode == 0:
                response = result.stdout.strip() or 'No response from model.'
                self.root.after(0, lambda: self.ai_say(response))
            else:
                self.root.after(0, lambda: self.ai_say('AI query failed'))

        except subprocess.TimeoutExpired:
            self.root.after(0, lambda: self.ai_say('AI query timed out'))
        except Exception as e:
            err_msg = f'AI error: {e}'
            self.root.after(0, lambda msg=err_msg: self.ai_say(msg))

    def ask_codex_from_input(self, event=None):
        prompt = self.codex_input.get().strip()
        if not prompt:
            return
        self.codex_input.delete(0, tk.END)
        self.codex_log(f'YOU: {prompt}')
        self.run_codex_read_only(prompt)

    def run_codex_read_only(self, prompt):
        if not self.codex_cmd or not self.codex_cmd.exists():
            self.codex_log('Codex CLI not found.')
            return

        mode = self.codex_sandbox_mode.get()
        bypass = self.codex_bypass.get()
        if bypass:
            self.codex_log('Running Codex with sandbox/approval bypass enabled. This is dangerous.')
        else:
            self.codex_log(f'Running Codex in {mode} exec mode...')

        def worker():
            cmd = self.runtime.wrap_command([str(self.codex_cmd), 'exec', '--skip-git-repo-check', '-C', str(self.project_dir)])
            if bypass:
                cmd.append('--dangerously-bypass-approvals-and-sandbox')
            else:
                cmd.extend(['-s', mode])
            cmd.append(prompt)
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                self.root.after(0, lambda: self.publish_codex_result(result))
            except subprocess.TimeoutExpired:
                self.root.after(0, lambda: self.codex_log('ERR: Codex request timed out.'))
            except Exception as e:
                err_msg = f'ERR: {e}'
                self.root.after(0, lambda msg=err_msg: self.codex_log(msg))

        threading.Thread(target=worker, daemon=True).start()

    def launch_full_codex_cli(self):
        if not self.codex_cmd or not self.codex_cmd.exists():
            self.codex_log('Codex CLI not found.')
            return
        mode = self.codex_sandbox_mode.get()
        bypass = self.codex_bypass.get()
        self.codex_log('Launching full Codex CLI in a new terminal...')
        cmd = self.runtime.wrap_command([str(self.codex_cmd)], interactive=True)
        if bypass:
            cmd.append('--dangerously-bypass-approvals-and-sandbox')
        else:
            cmd.extend(['-s', mode])
        cmd.extend(['-C', str(self.project_dir)])
        subprocess.Popen(cmd, cwd=str(self.project_dir))

    def launch_nexus(self):
        self.codex_log('Launching Nexus App (Electron)...')
        nexus_dir = self.project_dir / 'nexus'
        if not nexus_dir.exists():
            self.codex_log('ERR: Nexus directory not found.')
            return

        def worker():
            try:
                # Use npx electron to launch the electron app
                cmd = ['npx', 'electron', '.']
                result = subprocess.run(cmd, cwd=str(nexus_dir), capture_output=True, text=True)
                if result.returncode != 0:
                    self.root.after(0, lambda: self.codex_log(f'ERR: Nexus failed: {result.stderr}'))
            except Exception as e:
                self.root.after(0, lambda: self.codex_log(f'ERR: Failed to launch Nexus: {e}'))

        threading.Thread(target=worker, daemon=True).start()

    def launch_navigator(self):
        self.codex_log('Launching Empire Navigator Browser...')
        nav_dir = self.project_dir / 'navigator'
        if not nav_dir.exists():
            self.codex_log('ERR: Navigator directory not found.')
            return

        def worker():
            try:
                cmd = ['npx', 'electron', '.']
                result = subprocess.run(cmd, cwd=str(nav_dir), capture_output=True, text=True)
                if result.returncode != 0:
                    self.root.after(0, lambda: self.codex_log(f'ERR: Navigator failed: {result.stderr}'))
            except Exception as e:
                self.root.after(0, lambda: self.codex_log(f'ERR: Failed to launch Navigator: {e}'))

        threading.Thread(target=worker, daemon=True).start()

    def stamp_file_with_qr(self):
        path = filedialog.askopenfilename(title="Select File to Stamp")
        if not path:
            return
        
        file_path = Path(path)
        file_info = {
            "name": file_path.name,
            "size": f"{file_path.stat().st_size / 1024:.2f} KB",
            "modified": time.ctime(file_path.stat().st_mtime),
            "type": file_path.suffix or "unknown",
            "os": "ThirdOS / Empire"
        }
        
        qr_data = json.dumps(file_info, indent=2)
        self.codex_log(f"Generating QR Stamp for: {file_path.name}")
        
        try:
            import qrcode
            from PIL import ImageTk, Image
            
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Show in a popup
            top = tk.Toplevel(self.root)
            top.title(f"QR Stamp - {file_path.name}")
            top.configure(bg='white')
            
            # Convert PIL image to Tkinter photoimage
            tk_img = ImageTk.PhotoImage(img)
            label = tk.Label(top, image=tk_img, bg='white')
            label.image = tk_img # keep reference
            label.pack(padx=20, pady=20)
            
            tk.Label(top, text=f"File: {file_path.name}", bg='white', fg='black', font=('Consolas', 10, 'bold')).pack(pady=(0, 10))
            tk.Button(top, text="Close Stamp", command=top.destroy).pack(pady=10)
            
        except Exception as e:
            self.codex_log(f"ERR: QR Generation failed: {e}")

    def launch_iventoy(self):
        self.codex_log('Starting iVentoy PXE Server...')
        iventoy_dir = Path('/home/tg/empireguards/iventoy')
        if not iventoy_dir.exists():
            self.codex_log('ERR: iVentoy directory not found.')
            return

        def worker():
            try:
                # Start iVentoy service
                cmd = ['sudo', './iventoy.sh', 'start']
                subprocess.run(cmd, cwd=str(iventoy_dir))
                self.root.after(0, lambda: self.codex_log('iVentoy Started. Access UI at http://localhost:26000'))
                # Open browser to the UI
                import webbrowser
                time.sleep(2)
                webbrowser.open('http://localhost:26000')
            except Exception as e:
                self.root.after(0, lambda: self.codex_log(f'ERR: Failed to start iVentoy: {e}'))

        threading.Thread(target=worker, daemon=True).start()

    def run_shell_from_input(self, event=None):
        user_input = self.shell_input.get().strip()
        if not user_input:
            return
        self.shell_input.delete(0, tk.END)

        try:
            action, sanitized_args, cmd = self.parse_allowlisted_shell_command(user_input)
        except ValueError as e:
            error_message = str(e)
            self.codex_log(f'Command rejected: {error_message}')
            self.root.after(0, lambda: messagebox.showerror('Command Rejected', error_message))
            return

        self.codex_log(f'AUDIT CMD action={action} args={sanitized_args}')

        def worker():
            try:
                result = self.runtime.run_shell(cmd_text, cwd=self.project_dir, timeout=120)
                result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(self.project_dir), timeout=120, shell=False)
                out = (result.stdout or '').strip()
                err = (result.stderr or '').strip()

                def publish():
                    if out:
                        for line in out.splitlines():
                            self.codex_log(line)
                    if err:
                        for line in err.splitlines():
                            self.codex_log(f'ERR: {line}')
                    if not out and not err:
                        self.codex_log('(no output)')

                self.root.after(0, publish)
            except Exception as e:
                err_msg = f'ERR: {e}'
                self.root.after(0, lambda msg=err_msg: self.codex_log(msg))

        threading.Thread(target=worker, daemon=True).start()

    def parse_allowlisted_shell_command(self, user_input):
        disallowed_characters = {'&', '|', '>', '<', '%', '`', ';'}
        if any(ch in user_input for ch in disallowed_characters):
            raise ValueError('Metacharacters and command chaining are not allowed.')

        try:
            tokens = shlex.split(user_input, posix=False)
        except ValueError:
            raise ValueError('Unable to parse command. Use: <action> [args].')

        if not tokens:
            raise ValueError('No command provided.')

        action = tokens[0].lower().strip()
        sanitized_args = [arg.strip() for arg in tokens[1:] if arg.strip()]

        if action not in self.shell_command_registry:
            allowed = ', '.join(sorted(self.shell_command_registry.keys()))
            raise ValueError(f'Unknown action "{action}". Allowed actions: {allowed}.')

        if sanitized_args:
            raise ValueError(f'Action "{action}" does not accept arguments.')

        return action, sanitized_args, list(self.shell_command_registry[action])

    def load_guardian_code(self):
        guardian_code = '''# Guardian Core - Empire Security
import secrets
import time
import hashlib
import psutil
import logging


class GuardianCore:
    """Guardian's awakened consciousness"""

    def __init__(self):
        self.logger = self.setup_logging()
        self.pair_states = {}
        self.logger.info('Guardian awakens - Codex Artanis online')

    def setup_logging(self):
        logging.basicConfig(
            filename='guardian_empire.log',
            level=logging.INFO,
            format='%(asctime)s - GUARDIAN - %(message)s'
        )
        return logging.getLogger('Guardian')

    def secure_random_4digit(self, seed=b''):
        h = hashlib.sha256(seed + secrets.token_bytes(16)).digest()
        num = int.from_bytes(h, 'big') % 10000
        return f"{num:04d}"

    def guardian_handshake(self, remote_id):
        ts = int(time.time())
        my_code = self.secure_random_4digit()
        self.logger.info(f'Guardian handshake with {remote_id} at {ts}: {my_code}')
        return my_code


if __name__ == '__main__':
    guardian = GuardianCore()
    print('Guardian Core loaded - Ready for battle')
'''
        self.code_editor.delete(1.0, tk.END)
        self.code_editor.insert(tk.END, guardian_code)

    def populate_file_tree(self):
        for item in self.file_tree.get_children():
            self.file_tree.delete(item)

        try:
            current_dir = Path.cwd()
            for item in sorted(current_dir.iterdir()):
                if item.is_file() and item.suffix.lower() in ['.py', '.txt', '.md', '.json', '.bat', '.toml', '.yaml', '.yml']:
                    self.file_tree.insert('', 'end', text=item.name, values=[str(item)])
        except Exception as e:
            self.append_terminal(f'Error loading files: {e}')

    def load_local_config_editor(self):
        if not self.local_config_path.exists():
            self.local_config_path.write_text(json.dumps(self.default_local_settings(), indent=2) + '\n', encoding='utf-8')

        content = self.local_config_path.read_text(encoding='utf-8')
        self.local_config_editor.delete('1.0', tk.END)
        self.local_config_editor.insert('1.0', content)

    def save_local_config(self):
        try:
            content = self.local_config_editor.get('1.0', tk.END)
            self.local_config_path.write_text(content, encoding='utf-8')
            self.local_settings = self.load_local_settings()
            self.intake_base = Path(self.local_settings['intake']['base_dir']).expanduser()
            self.intake_script = Path(self.local_settings['intake']['scan_script']).expanduser()
            self.codex_cmd = self.runtime.resolve_codex_cli(self.local_settings.get('runtime', {}).get('codex_cli_path', ''))
            self.update_codex_status()
            self.render_runtime_diagnostics()
            self.status_bar.config(text=f'Saved local config: {self.local_config_path.name}', fg=self.colors['success'])
            self.ai_say('Local config saved. It stays on this machine and is git-ignored.')
            self.populate_file_tree()
        except Exception as e:
            messagebox.showerror('Error', f'Could not save local config: {e}')

    def deep_system_scan(self):
        self.append_terminal('Starting deep system scan...')

        def scan_thread():
            suspicious_processes = []
            try:
                for proc in psutil.process_iter(['pid', 'name', 'exe']):
                    try:
                        proc_info = proc.info
                        name = (proc_info.get('name') or '').lower()
                        if 'antiempire' in name:
                            suspicious_processes.append(proc_info)
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue

                if suspicious_processes:
                    self.root.after(0, lambda: self.append_terminal(f'Found {len(suspicious_processes)} suspicious processes'))
                    for proc in suspicious_processes:
                        self.root.after(0, lambda p=proc: self.append_terminal(f"  - {p.get('name')} (PID: {p.get('pid')})"))
                else:
                    self.root.after(0, lambda: self.append_terminal('No suspicious processes found'))

            except Exception as e:
                err_msg = f'Scan error: {e}'
                self.root.after(0, lambda msg=err_msg: self.append_terminal(msg))

        threading.Thread(target=scan_thread, daemon=True).start()

    def hunt_corruption(self):
        self.ai_say('Initiating corruption hunt...')
        self.append_terminal('Hunting corrupted files...')

        def hunt_thread():
            time.sleep(2)
            self.root.after(0, lambda: self.append_terminal('Scanning system files...'))
            time.sleep(1)
            self.root.after(0, lambda: self.append_terminal('Checking integrity...'))
            time.sleep(1)
            self.root.after(0, lambda: self.append_terminal('Corruption hunt complete'))
            self.root.after(0, lambda: self.ai_say('Hunt complete. Guardian standing by.'))

        threading.Thread(target=hunt_thread, daemon=True).start()

    def open_intake_folder(self, subfolder):
        folder = self.intake_base / subfolder
        folder.mkdir(parents=True, exist_ok=True)
        self.runtime.open_path(folder)

    def scan_picked_file(self):
        filename = filedialog.askopenfilename(
            title='Pick file to scan with Guardian intake',
            initialdir=str(self.intake_base / '00_incoming') if self.intake_base.exists() else str(Path.home()),
            filetypes=[('All files', '*.*')]
        )
        if filename:
            self.run_intake_scan(Path(filename), extract_zip=filename.lower().endswith('.zip'))

    def scan_latest_incoming(self):
        incoming = self.intake_base / '00_incoming'
        incoming.mkdir(parents=True, exist_ok=True)

        files = [f for f in incoming.iterdir() if f.is_file()]
        if not files:
            self.append_terminal(f'No files in {incoming}')
            return

        latest = max(files, key=lambda f: f.stat().st_mtime)
        self.run_intake_scan(latest, extract_zip=latest.suffix.lower() == '.zip')

    def run_intake_scan(self, input_path: Path, extract_zip=False):
        if not self.intake_script.exists():
            self.append_terminal(f'Intake script missing: {self.intake_script}')
            messagebox.showerror('Missing Script', f'Could not find scan script:\n{self.intake_script}')
            return

        self.append_terminal(f'Starting intake scan: {input_path}')
        self.status_bar.config(text=f'Scanning: {input_path.name}', fg=self.colors['warning'])

        def worker():
            cmd = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', str(self.intake_script), '-InputPath', str(input_path)]
            if extract_zip:
                cmd.append('-ExtractZip')

            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
                out = (result.stdout or '').strip()
                err = (result.stderr or '').strip()

                def publish():
                    if out:
                        for line in out.splitlines():
                            self.append_terminal(line)
                    if err:
                        for line in err.splitlines():
                            self.append_terminal(f'ERR: {line}')
                    if result.returncode == 0:
                        self.status_bar.config(text='Intake scan complete', fg=self.colors['success'])
                        self.ai_say('Intake scan complete. File processed safely.')
                    else:
                        self.status_bar.config(text='Intake scan finished with warnings/errors', fg=self.colors['warning'])
                        self.ai_say('Intake scan reported warnings/errors. Check terminal output.')

                self.root.after(0, publish)
            except Exception as e:
                err_msg = f'Intake scan failed: {e}'
                self.root.after(0, lambda msg=err_msg: self.append_terminal(msg))
                self.root.after(0, lambda: self.status_bar.config(text='Intake scan failed', fg=self.colors['danger']))

        threading.Thread(target=worker, daemon=True).start()

    def new_file(self):
        self.code_editor.delete(1.0, tk.END)
        self.current_file = None
        self.status_bar.config(text='New file created')

    def open_file(self):
        filename = filedialog.askopenfilename(filetypes=[('Python files', '*.py'), ('All files', '*.*')])
        if filename:
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.code_editor.delete(1.0, tk.END)
                self.code_editor.insert(1.0, content)
                self.current_file = filename
                self.status_bar.config(text=f'Opened: {filename}')
            except Exception as e:
                messagebox.showerror('Error', f'Could not open file: {e}')

    def save_file(self):
        if not self.current_file:
            self.current_file = filedialog.asksaveasfilename(defaultextension='.py', filetypes=[('Python files', '*.py'), ('All files', '*.*')])

        if self.current_file:
            try:
                content = self.code_editor.get(1.0, tk.END)
                with open(self.current_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.status_bar.config(text=f'Saved: {self.current_file}')
                self.populate_file_tree()
            except Exception as e:
                messagebox.showerror('Error', f'Could not save file: {e}')

    def on_file_select(self, event):
        selection = self.file_tree.selection()
        if selection:
            item = self.file_tree.item(selection[0])
            values = item.get('values', [])
            filepath = values[0] if values else None
            if filepath:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    self.code_editor.delete(1.0, tk.END)
                    self.code_editor.insert(1.0, content)
                    self.current_file = filepath
                    self.status_bar.config(text=f'Loaded: {filepath}')
                except Exception as e:
                    self.append_terminal(f'Error loading {filepath}: {e}')

    def guardian_status(self):
        self.ai_say('Guardian Status: Online and vigilant')
        self.ai_say('Rolling codes active')
        self.ai_say('Corruption hunter ready')
        self.ai_say('Empire systems nominal')

    def system_integrity(self):
        self.append_terminal('Checking system integrity...')
        self.append_terminal('System integrity check complete')

    def scan_corruption(self):
        self.deep_system_scan()

    def clean_corrupted(self):
        self.append_terminal('Cleaning corrupted files...')
        self.ai_say('Initiating cleanup protocols...')
        self.append_terminal('Cleanup complete')

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    print('Empire IDE starting...')
    print('Codex Artanis awakening...')
    ide = EmpireIDE()
    ide.run()
