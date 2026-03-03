import platform
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PlatformRuntime:
    os_name: str
    shell_exec: list[str]
    shell_interactive: list[str]
    open_command: str
    codex_candidates: list[Path]
    git_candidates: list[Path]
    intake_default: Path
    repo_default: Path


    def wrap_command(self, args: list[str], interactive: bool = False) -> list[str]:
        if self.os_name == "Windows":
            prefix = self.shell_interactive if interactive else self.shell_exec
            return [*prefix, *args]
        return args

    def resolve_cli(self, executable_names: list[str], candidates: list[Path], configured_path: str = "") -> Path | None:
        configured = Path(configured_path).expanduser() if configured_path else None
        if configured and configured.exists():
            return configured

        for name in executable_names:
            found = shutil.which(name)
            if found:
                return Path(found)

        for candidate in candidates:
            expanded = candidate.expanduser()
            if expanded.exists():
                return expanded

        return configured if configured else None

    def resolve_codex_cli(self, configured_path: str = "") -> Path | None:
        names = ["codex.cmd", "codex"] if self.os_name == "Windows" else ["codex"]
        return self.resolve_cli(names, self.codex_candidates, configured_path)

    def resolve_git_cli(self, configured_path: str = "") -> Path | None:
        names = ["git.exe", "git"] if self.os_name == "Windows" else ["git"]
        return self.resolve_cli(names, self.git_candidates, configured_path)

    def run_shell(self, command: str, cwd: Path, timeout: int = 120):
        return subprocess.run([*self.shell_exec, command], capture_output=True, text=True, cwd=str(cwd), timeout=timeout)

    def open_path(self, path: Path):
        subprocess.Popen([self.open_command, str(path)])


def detect_runtime() -> PlatformRuntime:
    os_name = platform.system()

    if os_name == "Windows":
        return PlatformRuntime(
            os_name=os_name,
            shell_exec=["cmd", "/c"],
            shell_interactive=["cmd", "/k"],
            open_command="explorer",
            codex_candidates=[
                Path.home() / "AppData" / "Roaming" / "npm" / "codex.cmd",
                Path("C:/Program Files/nodejs/codex.cmd"),
            ],
            git_candidates=[
                Path("C:/Program Files/Git/cmd/git.exe"),
                Path("C:/Program Files/Git/bin/git.exe"),
            ],
            intake_default=Path.home() / "Work_Intake",
            repo_default=Path.home() / "guardian_ide",
        )

    if os_name == "Darwin":
        return PlatformRuntime(
            os_name=os_name,
            shell_exec=["bash", "-lc"],
            shell_interactive=["bash", "-lc"],
            open_command="open",
            codex_candidates=[Path("/opt/homebrew/bin/codex"), Path("/usr/local/bin/codex")],
            git_candidates=[Path("/opt/homebrew/bin/git"), Path("/usr/bin/git")],
            intake_default=Path.home() / "Work_Intake",
            repo_default=Path.home() / "guardian_ide",
        )

    return PlatformRuntime(
        os_name=os_name,
        shell_exec=["bash", "-lc"],
        shell_interactive=["bash", "-lc"],
        open_command="xdg-open",
        codex_candidates=[Path("/usr/local/bin/codex"), Path("/usr/bin/codex")],
        git_candidates=[Path("/usr/bin/git"), Path("/bin/git")],
        intake_default=Path.home() / "work_intake",
        repo_default=Path.home() / "guardian_ide",
    )
