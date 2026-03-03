@echo off
cd /d C:\Users\empir\guardian_ide
python -m pip install pyinstaller
python -m PyInstaller --noconfirm --onefile --windowed --name GuardianIDE empire_ide.py
