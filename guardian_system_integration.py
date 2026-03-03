import platform
import subprocess
import sqlite3
import time
from pathlib import Path
import psutil

from guardian_core import GuardianCore


class GuardianSystemIntegration:
    def __init__(self):
        self.os_type = platform.system().lower()
        self.guardian_core = GuardianCore()
        self.db_path = self.get_guardian_db_path()
        self.init_guardian_database()

    def get_guardian_db_path(self):
        if self.os_type == 'windows':
            return Path.home() / 'AppData' / 'Local' / 'Guardian' / 'trust_vault.db'
        if self.os_type == 'darwin':
            return Path.home() / 'Library' / 'Application Support' / 'Guardian' / 'trust_vault.db'
        return Path.home() / '.guardian' / 'trust_vault.db'

    def init_guardian_database(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trust_codes (
                entity_id TEXT PRIMARY KEY,
                entity_type TEXT,
                current_code TEXT,
                next_code TEXT,
                last_verified INTEGER,
                trust_level TEXT,
                verification_count INTEGER DEFAULT 0,
                created_at INTEGER
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                timestamp INTEGER,
                details TEXT,
                handled BOOLEAN DEFAULT FALSE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS threat_intel (
                ip_address TEXT PRIMARY KEY,
                risk_level TEXT,
                last_seen INTEGER,
                attack_patterns TEXT,
                geolocation TEXT,
                notes TEXT
            )
        ''')

        conn.commit()
        conn.close()

    def detect_system_baseline(self):
        baseline = {
            'os_version': platform.platform(),
            'system_processes': [],
            'installed_software': [],
            'network_interfaces': [],
            'system_services': []
        }

        for proc in psutil.process_iter(['pid', 'name', 'exe', 'create_time']):
            try:
                proc_info = proc.info
                if proc_info.get('exe') and self.is_system_process(proc_info.get('name', '')):
                    baseline['system_processes'].append({
                        'name': proc_info.get('name', ''),
                        'path': proc_info.get('exe', ''),
                        'pid': proc_info.get('pid', 0)
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        for interface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if addr.family == 2:
                    baseline['network_interfaces'].append({
                        'interface': interface,
                        'ip': addr.address
                    })

        if self.os_type == 'windows':
            baseline['system_services'] = self.get_windows_services()
        elif self.os_type == 'darwin':
            baseline['system_services'] = self.get_macos_services()
        else:
            baseline['system_services'] = self.get_linux_services()

        return baseline

    def is_system_process(self, process_name):
        system_processes = {
            'windows': [
                'System', 'Registry', 'smss.exe', 'csrss.exe', 'wininit.exe',
                'services.exe', 'lsass.exe', 'svchost.exe', 'winlogon.exe',
                'explorer.exe', 'dwm.exe', 'RuntimeBroker.exe', 'SearchIndexer.exe'
            ],
            'darwin': [
                'kernel_task', 'launchd', 'UserEventAgent', 'cfprefsd',
                'Dock', 'Finder', 'WindowServer', 'loginwindow', 'SystemUIServer'
            ],
            'linux': [
                'init', 'kthreadd', 'systemd', 'NetworkManager',
                'dbus', 'pulseaudio', 'gnome-shell', 'Xorg'
            ]
        }

        return process_name in system_processes.get(self.os_type, [])

    def get_windows_services(self):
        try:
            result = subprocess.run(['sc', 'query'], capture_output=True, text=True, check=False)
            services = []
            for line in result.stdout.split('\n'):
                if 'SERVICE_NAME:' in line:
                    services.append(line.split(':', 1)[1].strip())
            return services
        except Exception:
            return []

    def get_macos_services(self):
        try:
            result = subprocess.run(['launchctl', 'list'], capture_output=True, text=True, check=False)
            services = []
            for line in result.stdout.split('\n')[1:]:
                if line.strip():
                    parts = line.split()
                    if len(parts) >= 3:
                        services.append(parts[2])
            return services
        except Exception:
            return []

    def get_linux_services(self):
        try:
            result = subprocess.run(
                ['systemctl', 'list-units', '--type=service'],
                capture_output=True,
                text=True,
                check=False
            )
            services = []
            for line in result.stdout.split('\n'):
                if '.service' in line and 'loaded' in line:
                    services.append(line.split()[0])
            return services
        except Exception:
            return []

    def handle_system_update_event(self):
        print('GUARDIAN: System update detected - adapting security protocols...')

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO system_events (event_type, timestamp, details) VALUES (?, ?, ?)',
            ('update', int(time.time()), 'System update detected')
        )
        conn.commit()
        conn.close()

        self.clear_stale_ip_codes()
        self.reverify_system_processes()

        print('GUARDIAN: Security protocols updated for new system state')

    def handle_system_reset_event(self):
        print('GUARDIAN: System reset detected - rebuilding trust network...')

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trust_codes WHERE entity_type = 'ip'")
        cursor.execute(
            'INSERT INTO system_events (event_type, timestamp, details) VALUES (?, ?, ?)',
            ('reset', int(time.time()), 'System reset - IP codes cleared')
        )
        conn.commit()
        conn.close()

        self.mark_system_processes_for_reverification()

        print('GUARDIAN: Trust network rebuilt for fresh system state')

    def clear_stale_ip_codes(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        stale_threshold = int(time.time()) - (24 * 60 * 60)
        cursor.execute(
            'DELETE FROM trust_codes WHERE entity_type = ? AND last_verified < ?',
            ('ip', stale_threshold)
        )

        conn.commit()
        conn.close()

    def reverify_system_processes(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE trust_codes SET trust_level = 'needs_reverify' "
            "WHERE entity_type = 'process' AND trust_level = 'system'"
        )
        conn.commit()
        conn.close()

    def mark_system_processes_for_reverification(self):
        self.reverify_system_processes()

    def install_guardian_service(self):
        if self.os_type == 'windows':
            self.install_windows_service()
        elif self.os_type == 'darwin':
            self.install_macos_service()
        else:
            self.install_linux_service()

    def install_windows_service(self):
        service_script = '''
import win32serviceutil
import win32service
import win32event
import servicemanager
from guardian_core import guardian_watch


class GuardianService(win32serviceutil.ServiceFramework):
    _svc_name_ = "GuardianEmpire"
    _svc_display_name_ = "Guardian Empire Security"
    _svc_description_ = "Empire security verification service"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        guardian_watch()


if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(GuardianService)
'''

        with open('guardian_service.py', 'w', encoding='utf-8') as f:
            f.write(service_script)

        print('GUARDIAN: Windows service script created')
        print('Run: python guardian_service.py install')
        print('Then: python guardian_service.py start')

    def install_macos_service(self):
        plist_path = '/Library/LaunchDaemons/com.empire.guardian.plist'
        print('GUARDIAN: macOS service template ready')
        print(f'Save to: {plist_path}')
        print(f'Run: sudo launchctl load {plist_path}')

    def install_linux_service(self):
        service_path = '/etc/systemd/system/guardian-empire.service'
        print('GUARDIAN: Linux systemd service template ready')
        print(f'Save to: {service_path}')
        print('Run: sudo systemctl enable guardian-empire')
        print('Then: sudo systemctl start guardian-empire')


if __name__ == '__main__':
    print('GUARDIAN SYSTEM INTEGRATION')
    print('Codex Artanis - Cross-Platform Protection')

    guardian_sys = GuardianSystemIntegration()
    baseline = guardian_sys.detect_system_baseline()
    print(f"System baseline: {len(baseline['system_processes'])} processes detected")
    guardian_sys.install_guardian_service()
    print('Guardian ready for deployment across all platforms!')
