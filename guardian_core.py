import secrets
import time
import hashlib
import psutil
import logging
from typing import Dict, Any, Tuple

pair_states: Dict[Any, Dict[str, Any]] = {}


class AuthFailure(Exception):
    pass


class GuardianCore:
    def __init__(self):
        self.logger = self.setup_logging()
        self.system_processes = self.load_system_baseline()

    def setup_logging(self):
        logging.basicConfig(
            filename='guardian_watch.log',
            level=logging.INFO,
            format='%(asctime)s - GUARDIAN - %(levelname)s - %(message)s'
        )
        return logging.getLogger('Guardian')

    def load_system_baseline(self):
        return {
            'windows': {
                'system_processes': [
                    'System', 'Registry', 'smss.exe', 'csrss.exe', 'wininit.exe',
                    'services.exe', 'lsass.exe', 'svchost.exe', 'winlogon.exe',
                    'explorer.exe', 'dwm.exe', 'RuntimeBroker.exe'
                ],
                'update_processes': [
                    'TiWorker.exe', 'wuauclt.exe', 'UsoClient.exe', 'WindowsUpdateBox.exe'
                ],
                'legitimate_paths': [
                    'C:\\Windows\\System32\\', 'C:\\Windows\\SysWOW64\\',
                    'C:\\Program Files\\', 'C:\\Program Files (x86)\\'
                ]
            },
            'mac': {
                'system_processes': [
                    'kernel_task', 'launchd', 'UserEventAgent', 'cfprefsd',
                    'Dock', 'Finder', 'WindowServer', 'loginwindow'
                ],
                'update_processes': ['softwareupdated', 'installd', 'pkgutil']
            },
            'linux': {
                'system_processes': [
                    'init', 'kthreadd', 'systemd', 'NetworkManager',
                    'dbus', 'pulseaudio', 'gnome-shell'
                ],
                'update_processes': ['apt', 'yum', 'dnf', 'pacman', 'zypper']
            }
        }

    def secure_random_4digit(self, seed=b''):
        h = hashlib.sha256(seed + secrets.token_bytes(16)).digest()
        num = int.from_bytes(h, 'big') % 10000
        return f"{num:04d}"

    def is_legitimate_system_event(self, process_name, process_path, parent_process):
        if process_name in self.system_processes['windows']['update_processes']:
            self.logger.info("LEGITIMATE: Windows Update process %s", process_name)
            return True

        pp = (process_path or '').lower()
        if 'recovery' in pp or 'reset' in pp:
            self.logger.info("LEGITIMATE: System recovery operation %s", process_name)
            return True

        if process_name in ['diskpart.exe', 'format.com', 'chkdsk.exe', 'sfc.exe', 'dism.exe']:
            self.logger.info("LEGITIMATE: System maintenance %s", process_name)
            return True

        return False

    def should_verify_process(self, proc_info: Dict[str, Any]) -> bool:
        name = (proc_info.get('name') or '').strip()
        exe = (proc_info.get('exe') or '').strip()

        if not name or not exe:
            return False

        if name in self.system_processes['windows']['system_processes']:
            return False

        return True

    def handle_system_reset_event(self):
        self.logger.info("SYSTEM RESET DETECTED - Clearing old verification codes")

        ip_keys = [k for k in list(pair_states.keys()) if '.' in str(k)]
        for ip_key in ip_keys:
            del pair_states[ip_key]

        for proc_key in list(pair_states.keys()):
            if proc_key not in ip_keys:
                pair_states[proc_key]['needs_reverify'] = True

        self.logger.info("Guardian adapted to system reset")

    def initiate_or_challenge(self, remote_id, is_bootstrap=False, context=None):
        ts = int(time.time())

        if context and self.is_legitimate_system_event(
            context.get('process_name', context.get('name', '')),
            context.get('process_path', context.get('exe', '')),
            context.get('parent_process', '')
        ):
            self.logger.info("FAST-TRACK: Legitimate system operation %s", remote_id)
            return self.create_system_trust_code(remote_id)

        if remote_id not in pair_states:
            if not is_bootstrap:
                raise ValueError("Bootstrap required for new connection")

            my_code = self.secure_random_4digit()
            nonce = secrets.token_bytes(8)

            challenge = f"GUARDIAN_HELLO {my_code} TS {ts} NONCE {nonce.hex()}"
            response = self.send_and_receive(challenge, remote_id)

            if not response or not response.startswith("GUARDIAN_HI"):
                raise AuthFailure(f"Invalid response from {remote_id}")

            their_code, their_next = self.parse_guardian_response(response)
            pair_states[remote_id] = {
                'current': their_code,
                'next': their_next,
                'last_ts': ts,
                'nonce_seed': nonce,
                'trust_level': 'new'
            }

            self.logger.info("TRUST ESTABLISHED: %s", remote_id)
            return True

        state = pair_states[remote_id]
        current = state['current']
        nonce = secrets.token_bytes(8)

        challenge = f"GUARDIAN_HEY {current} TS {ts} NONCE {nonce.hex()}"
        response = self.send_and_receive(challenge, remote_id)

        if not response or not response.startswith("GUARDIAN_YEP"):
            self.logger.warning("TRUST BROKEN: Failed verification %s", remote_id)
            raise AuthFailure("Code mismatch - possible imposter")

        state['current'] = state['next']
        state['next'] = self.secure_random_4digit(nonce)
        state['last_ts'] = ts
        state['nonce_seed'] = nonce

        self.logger.info("TRUST RENEWED: %s", remote_id)
        return True

    def create_system_trust_code(self, system_id):
        trust_code = self.secure_random_4digit(f"SYSTEM_{system_id}".encode())
        pair_states[system_id] = {
            'current': trust_code,
            'next': self.secure_random_4digit(),
            'last_ts': int(time.time()),
            'trust_level': 'system',
            'auto_renew': True
        }
        return trust_code

    def send_and_receive(self, message, remote_id):
        self.logger.info("COMM: Sent %s... to %s", message[:24], remote_id)
        # Placeholder protocol response
        return f"GUARDIAN_HI 1111 NEXT {self.secure_random_4digit()}"

    def parse_guardian_response(self, response) -> Tuple[str, str]:
        parts = response.split()
        if len(parts) >= 4:
            their_code = parts[1]
            their_next = parts[3]
            return their_code, their_next
        raise ValueError("Invalid Guardian response format")


def guardian_watch():
    guardian = GuardianCore()
    guardian.logger.info("GUARDIAN AWAKENS - online")

    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'ppid']):
                try:
                    proc_info = proc.info
                    if proc_info.get('name') and proc_info.get('exe'):
                        if guardian.should_verify_process(proc_info):
                            rid = proc_info['pid']
                            if rid not in pair_states:
                                guardian.initiate_or_challenge(rid, is_bootstrap=True, context=proc_info)
                            else:
                                guardian.initiate_or_challenge(rid, is_bootstrap=False, context=proc_info)
                except (psutil.NoSuchProcess, psutil.AccessDenied, ValueError, AuthFailure):
                    continue

            time.sleep(5)

        except KeyboardInterrupt:
            guardian.logger.info("GUARDIAN RESTS")
            break
        except Exception as e:
            guardian.logger.error("GUARDIAN ERROR: %s", e)
            time.sleep(10)


if __name__ == '__main__':
    guardian_watch()
