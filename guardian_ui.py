import tkinter as tk
from tkinter import Canvas
import threading
import time
import math
import random
from guardian_core import GuardianCore


class GuardianBattlefieldUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title('GUARDIAN - Empire Security')
        self.root.geometry('1200x800')
        self.root.configure(bg='#0a0a0a')

        self.guardian = GuardianCore()
        self.battle_active = False

        self.setup_ui()
        self.start_monitoring()

    def setup_ui(self):
        self.battlefield = Canvas(
            self.root,
            width=800,
            height=600,
            bg='#001122',
            highlightthickness=0
        )
        self.battlefield.pack(side=tk.LEFT, padx=10, pady=10)

        control_frame = tk.Frame(self.root, bg='#0a0a0a', width=380)
        control_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=10, pady=10)

        status_frame = tk.LabelFrame(control_frame, text='Guardian Status', fg='#00ff00', bg='#0a0a0a')
        status_frame.pack(fill=tk.X, pady=5)

        self.status_label = tk.Label(
            status_frame,
            text='GUARDIAN ONLINE - Codex Artanis',
            fg='#00ff00',
            bg='#0a0a0a'
        )
        self.status_label.pack(pady=5)

        chat_frame = tk.LabelFrame(control_frame, text='Guardian Comms', fg='#00ffff', bg='#0a0a0a')
        chat_frame.pack(fill=tk.BOTH, expand=True, pady=5)

        self.chat_display = tk.Text(
            chat_frame,
            height=15,
            width=45,
            bg='#001122',
            fg='#00ffff',
            font=('Courier', 9)
        )
        self.chat_display.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        button_frame = tk.Frame(control_frame, bg='#0a0a0a')
        button_frame.pack(fill=tk.X, pady=5)

        tk.Button(button_frame, text='Investigate', bg='#003366', fg='#ffffff', command=self.investigate_selected).pack(side=tk.LEFT, padx=2)
        tk.Button(button_frame, text='Purge', bg='#660033', fg='#ffffff', command=self.purge_selected).pack(side=tk.LEFT, padx=2)
        tk.Button(button_frame, text='Jail', bg='#663300', fg='#ffffff', command=self.jail_selected).pack(side=tk.LEFT, padx=2)

        self.guardian_say('Guardian online. Codex Artanis reporting for duty.')
        self.guardian_say('Scanning perimeter... all systems nominal.')

    def guardian_say(self, message):
        timestamp = time.strftime('%H:%M:%S')
        self.chat_display.insert(tk.END, f'[{timestamp}] GUARDIAN: {message}\n')
        self.chat_display.see(tk.END)

    def user_say(self, message):
        timestamp = time.strftime('%H:%M:%S')
        self.chat_display.insert(tk.END, f'[{timestamp}] YOU: {message}\n')
        self.chat_display.see(tk.END)

    def draw_ip_node(self, x, y, ip_info):
        risk_level = ip_info.get('risk', 'unknown')
        colors = {
            'safe': '#00ff00',
            'suspicious': '#ffff00',
            'hostile': '#ff0000',
            'unknown': '#888888'
        }

        color = colors.get(risk_level, '#888888')
        node_id = self.battlefield.create_oval(x - 15, y - 15, x + 15, y + 15, fill=color, outline='#ffffff', width=2)

        self.battlefield.create_text(x, y - 25, text=ip_info['ip'][:12], fill='#ffffff', font=('Courier', 8))
        self.battlefield.create_text(x, y + 25, text=f'Risk: {risk_level.upper()}', fill=color, font=('Courier', 7))
        return node_id

    def draw_guardian_shield(self, center_x, center_y):
        for i in range(3):
            radius = 50 + (i * 20)
            self.battlefield.create_oval(
                center_x - radius,
                center_y - radius,
                center_x + radius,
                center_y + radius,
                outline='#00ffff',
                width=2,
                stipple='gray25'
            )

        self.battlefield.create_text(center_x, center_y, text='G', font=('Arial', 24), fill='#00ffff')

    def simulate_battle(self):
        self.battle_active = True
        self.guardian_say('ALERT! Intrusion detected. Engaging defensive protocols.')

        self.battlefield.delete('all')

        center_x, center_y = 400, 300
        self.draw_guardian_shield(center_x, center_y)

        hostile_ips = [
            {'ip': '192.168.1.66', 'risk': 'hostile', 'action': 'port_scan'},
            {'ip': '10.0.0.13', 'risk': 'hostile', 'action': 'brute_force'},
            {'ip': '172.16.0.99', 'risk': 'suspicious', 'action': 'recon'}
        ]

        for i, ip_info in enumerate(hostile_ips):
            angle = (i * 120) + random.randint(-30, 30)
            distance = 200 + random.randint(-50, 50)
            x = center_x + (distance * math.cos(math.radians(angle)))
            y = center_y + (distance * math.sin(math.radians(angle)))

            self.draw_ip_node(x, y, ip_info)
            self.battlefield.create_line(x, y, center_x, center_y, fill='#ff0000', width=2, dash=(5, 5))

        self.guardian_say('Intruders detected. Containment in progress.')
        self.root.after(2000, self.guardian_battle_update)

    def guardian_battle_update(self):
        self.guardian_say('Countermeasures active...')
        self.root.after(1500, self.guardian_victory)

    def guardian_victory(self):
        self.guardian_say('Threat neutralized. Remaining targets isolated.')
        self.user_say('Nice work Guardian.')
        self.guardian_say('All clear. Generating report.')
        self.root.after(3000, self.morning_report)

    def morning_report(self):
        self.guardian_say('--- MORNING REPORT ---')
        self.guardian_say('Threat analysis complete.')
        self.guardian_say('Critical ports reviewed and protections enforced.')
        self.guardian_say('System secure.')
        self.battle_active = False

    def investigate_selected(self):
        self.guardian_say('Initiating deep scan on selected target...')

    def purge_selected(self):
        self.guardian_say('Purging target and cleaning residual artifacts...')

    def jail_selected(self):
        self.guardian_say('Target isolated in sandbox for analysis...')

    def start_monitoring(self):
        def monitor():
            while True:
                if not self.battle_active and random.randint(1, 100) == 1:
                    self.root.after(0, self.simulate_battle)
                time.sleep(1)

        monitor_thread = threading.Thread(target=monitor, daemon=True)
        monitor_thread.start()

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    print('GUARDIAN INITIALIZING...')
    print('Codex Artanis online...')
    print('Empire security protocols active...')

    guardian_ui = GuardianBattlefieldUI()
    guardian_ui.run()
