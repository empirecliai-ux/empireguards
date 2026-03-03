import argparse

from guardian_core import guardian_watch
from guardian_system_integration import GuardianSystemIntegration
from guardian_ui import GuardianBattlefieldUI
from empire_ide import EmpireIDE


def run_guardian_ui():
    GuardianBattlefieldUI().run()


def run_guardian_watch():
    guardian_watch()


def run_guardian_ide():
    EmpireIDE().run()


def run_guardian_baseline():
    integration = GuardianSystemIntegration()
    baseline = integration.detect_system_baseline()
    print(f"Guardian baseline collected: {len(baseline['system_processes'])} system processes")
    print(f"Guardian services detected: {len(baseline['system_services'])}")


def run_guardian_install_service():
    GuardianSystemIntegration().install_guardian_service()


def run_guardian_update_event():
    GuardianSystemIntegration().handle_system_update_event()


def run_guardian_reset_event():
    GuardianSystemIntegration().handle_system_reset_event()


def main():
    parser = argparse.ArgumentParser(description='Run Guardian components')
    parser.add_argument(
        '--mode',
        choices=['watch', 'ui', 'ide', 'baseline', 'install-service', 'update-event', 'reset-event'],
        default='ui'
    )
    args = parser.parse_args()

    mode_handlers = {
        'watch': run_guardian_watch,
        'ui': run_guardian_ui,
        'ide': run_guardian_ide,
        'baseline': run_guardian_baseline,
        'install-service': run_guardian_install_service,
        'update-event': run_guardian_update_event,
        'reset-event': run_guardian_reset_event,
    }

    mode_handlers[args.mode]()


if __name__ == '__main__':
    main()
