Guardian quick start

1) Open terminal in: C:\Users\empir\guardian_ide
2) Install dependency:
   pip install -r requirements.txt
3) Run UI mode:
   python run_guardian.py --mode ui
4) Run watch mode:
   python run_guardian.py --mode watch

Additional Guardian modes
- IDE: python run_guardian.py --mode ide
- Baseline scan: python run_guardian.py --mode baseline
- Install service templates: python run_guardian.py --mode install-service
- Handle update event: python run_guardian.py --mode update-event
- Handle reset event: python run_guardian.py --mode reset-event
