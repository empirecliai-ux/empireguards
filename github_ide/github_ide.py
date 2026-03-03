import json
import subprocess
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext

from platform_runtime import detect_runtime


class GitHubIDE:
    """Small Git-focused desktop tool for basic repo work."""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("GitHub IDE")
        self.root.geometry("1200x780")
        self.root.configure(bg="#111111")

        self.colors = {
            "bg": "#111111",
            "panel": "#162028",
            "text": "#f0f0f0",
            "accent": "#7bdff2",
            "success": "#8bd450",
            "warning": "#ffca3a",
            "danger": "#ff595e",
        }

        self.project_dir = Path(__file__).resolve().parent
        self.local_config_path = self.project_dir / 'github_local_config.json'
        self.runtime = detect_runtime()
        self.local_settings = self.load_local_settings()
        self.git_path = self.runtime.resolve_git_cli(self.local_settings.get('runtime', {}).get('git_cli_path', ''))
        self.repo_path = tk.StringVar(value=self.local_settings['repo']['default_path'])
        self.branch_name = tk.StringVar()
        self.commit_message = tk.StringVar()
        self.create_branch = tk.BooleanVar(value=False)

        self.setup_ui()
        self.refresh_repo_view()
        self.refresh_status()


    def default_local_settings(self):
        return {
            'notes': 'Local-only settings for GitHub IDE.',
            'repo': {
                'default_path': str(self.runtime.repo_default)
            },
            'runtime': {
                'git_cli_path': ''
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

    def runtime_diagnostics_text(self):
        return (
            f"OS: {self.runtime.os_name}\n"
            f"Open command: {self.runtime.open_command}\n"
            f"Shell exec: {self.runtime.shell_exec}\n"
            f"Git CLI: {self.git_path if self.git_path else 'not found'}\n"
            f"Repo default: {self.repo_path.get()}"
        )

    def setup_ui(self):
        menubar = tk.Menu(self.root, bg=self.colors["bg"], fg=self.colors["text"])
        self.root.config(menu=menubar)

        repo_menu = tk.Menu(menubar, tearoff=0, bg=self.colors["bg"], fg=self.colors["text"])
        menubar.add_cascade(label="Repo", menu=repo_menu)
        repo_menu.add_command(label="Choose Folder", command=self.choose_repo)
        repo_menu.add_command(label="Refresh", command=self.refresh_repo_view, accelerator="F5")
        repo_menu.add_separator()
        repo_menu.add_command(label="Open Folder", command=self.open_repo_folder)

        git_menu = tk.Menu(menubar, tearoff=0, bg=self.colors["bg"], fg=self.colors["text"])
        menubar.add_cascade(label="Git", menu=git_menu)
        git_menu.add_command(label="Status", command=self.refresh_status)
        git_menu.add_command(label="Fetch", command=self.fetch_all)
        git_menu.add_command(label="Pull", command=self.pull_current)
        git_menu.add_command(label="Push", command=self.push_current)
        git_menu.add_command(label="Branches", command=self.list_branches)

        main = tk.Frame(self.root, bg=self.colors["bg"])
        main.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        left = tk.Frame(main, bg=self.colors["bg"], width=300)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 6))
        left.pack_propagate(False)

        repo_frame = tk.LabelFrame(left, text="Repository", fg=self.colors["accent"], bg=self.colors["bg"])
        repo_frame.pack(fill=tk.X, pady=(0, 6))

        path_row = tk.Frame(repo_frame, bg=self.colors["bg"])
        path_row.pack(fill=tk.X, padx=6, pady=6)

        self.repo_entry = tk.Entry(path_row, textvariable=self.repo_path, bg=self.colors["panel"], fg=self.colors["text"])
        self.repo_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        tk.Button(path_row, text="Browse", bg="#244b5a", fg=self.colors["text"], command=self.choose_repo).pack(side=tk.RIGHT)

        self.repo_status = tk.Label(repo_frame, text="Checking repo...", bg=self.colors["bg"], fg=self.colors["warning"], anchor=tk.W)
        self.repo_status.pack(fill=tk.X, padx=6, pady=(0, 6))

        files_frame = tk.LabelFrame(left, text="Top-Level Files", fg=self.colors["accent"], bg=self.colors["bg"])
        files_frame.pack(fill=tk.BOTH, expand=True)

        self.file_list = tk.Listbox(files_frame, bg=self.colors["panel"], fg=self.colors["text"], activestyle="none")
        self.file_list.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

        center = tk.Frame(main, bg=self.colors["bg"])
        center.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 6))

        controls = tk.LabelFrame(center, text="Quick Actions", fg=self.colors["success"], bg=self.colors["bg"])
        controls.pack(fill=tk.X, pady=(0, 6))

        row1 = tk.Frame(controls, bg=self.colors["bg"])
        row1.pack(fill=tk.X, padx=6, pady=6)
        tk.Button(row1, text="Status", bg="#244b5a", fg=self.colors["text"], command=self.refresh_status).pack(side=tk.LEFT, padx=(0, 4))
        tk.Button(row1, text="Fetch", bg="#244b5a", fg=self.colors["text"], command=self.fetch_all).pack(side=tk.LEFT, padx=(0, 4))
        tk.Button(row1, text="Pull", bg="#2d5a27", fg=self.colors["text"], command=self.pull_current).pack(side=tk.LEFT, padx=(0, 4))
        tk.Button(row1, text="Push", bg="#2d5a27", fg=self.colors["text"], command=self.push_current).pack(side=tk.LEFT, padx=(0, 4))
        tk.Button(row1, text="Branches", bg="#5a4a24", fg=self.colors["text"], command=self.list_branches).pack(side=tk.LEFT)

        commit_frame = tk.LabelFrame(center, text="Commit", fg=self.colors["success"], bg=self.colors["bg"])
        commit_frame.pack(fill=tk.X, pady=(0, 6))

        commit_row = tk.Frame(commit_frame, bg=self.colors["bg"])
        commit_row.pack(fill=tk.X, padx=6, pady=6)
        tk.Entry(commit_row, textvariable=self.commit_message, bg=self.colors["panel"], fg=self.colors["text"]).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        tk.Button(commit_row, text="Commit All", bg="#2d5a27", fg=self.colors["text"], command=self.commit_all).pack(side=tk.RIGHT)

        branch_frame = tk.LabelFrame(center, text="Branch", fg=self.colors["warning"], bg=self.colors["bg"])
        branch_frame.pack(fill=tk.X, pady=(0, 6))

        branch_row = tk.Frame(branch_frame, bg=self.colors["bg"])
        branch_row.pack(fill=tk.X, padx=6, pady=6)
        tk.Entry(branch_row, textvariable=self.branch_name, bg=self.colors["panel"], fg=self.colors["text"]).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        tk.Button(branch_row, text="Checkout", bg="#5a4a24", fg=self.colors["text"], command=self.checkout_branch).pack(side=tk.RIGHT)

        tk.Checkbutton(
            branch_frame,
            text="Create branch if it does not exist",
            variable=self.create_branch,
            bg=self.colors["bg"],
            fg=self.colors["text"],
            activebackground=self.colors["bg"],
            activeforeground=self.colors["text"],
            selectcolor=self.colors["panel"],
        ).pack(anchor=tk.W, padx=6, pady=(0, 6))

        output_frame = tk.LabelFrame(center, text="Git Output", fg=self.colors["accent"], bg=self.colors["bg"])
        output_frame.pack(fill=tk.BOTH, expand=True)

        self.output = scrolledtext.ScrolledText(output_frame, bg=self.colors["panel"], fg=self.colors["text"], font=("Consolas", 10))
        self.output.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

        right = tk.Frame(main, bg=self.colors["bg"], width=280)
        right.pack(side=tk.RIGHT, fill=tk.Y)
        right.pack_propagate(False)

        diag_frame = tk.LabelFrame(right, text="Runtime Diagnostics", fg=self.colors["accent"], bg=self.colors["bg"])
        diag_frame.pack(fill=tk.X, pady=(0, 6))
        self.runtime_diag = tk.Label(diag_frame, text=self.runtime_diagnostics_text(), justify=tk.LEFT, bg=self.colors["bg"], fg=self.colors["text"], anchor=tk.NW)
        self.runtime_diag.pack(fill=tk.X, padx=8, pady=8)

        info_frame = tk.LabelFrame(right, text="Notes", fg=self.colors["accent"], bg=self.colors["bg"])
        info_frame.pack(fill=tk.BOTH, expand=True)

        notes = (
            "Use this for simple repo work only.\n\n"
            "Included:\n"
            "- status\n"
            "- fetch\n"
            "- pull\n"
            "- push\n"
            "- commit all\n"
            "- branch checkout/create\n\n"
            "It uses local git, not the GitHub API.\n"
            "Authentication still happens through Git, GitHub Desktop, or gh."
        )
        tk.Label(info_frame, text=notes, justify=tk.LEFT, bg=self.colors["bg"], fg=self.colors["text"], anchor=tk.NW).pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        self.status_bar = tk.Label(
            self.root,
            text="GitHub IDE ready",
            bg=self.colors["bg"],
            fg=self.colors["success"],
            anchor=tk.W,
        )
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        self.root.bind("<F5>", lambda _event: self.refresh_repo_view())
        self.refresh_runtime_diagnostics()

    def refresh_runtime_diagnostics(self):
        if hasattr(self, "runtime_diag"):
            self.runtime_diag.config(text=self.runtime_diagnostics_text())

    def choose_repo(self):
        selected = filedialog.askdirectory(initialdir=self.repo_path.get() or str(Path.home()))
        if selected:
            self.repo_path.set(selected)
            self.refresh_repo_view()
            self.refresh_status()
            self.refresh_runtime_diagnostics()

    def append_output(self, text):
        self.output.insert(tk.END, text)
        self.output.see(tk.END)

    def set_status(self, text, color=None):
        self.status_bar.config(text=text, fg=color or self.colors["success"])

    def repo_dir(self):
        return Path(self.repo_path.get()).expanduser()

    def validate_repo(self):
        repo = self.repo_dir()
        if not self.git_path or not self.git_path.exists():
            messagebox.showerror("Git Missing", f"Git executable not found at:\n{self.git_path}")
            return False
        if not repo.exists():
            messagebox.showerror("Folder Missing", f"Folder not found:\n{repo}")
            return False
        if not (repo / ".git").exists():
            messagebox.showerror("Not a Repo", f"Selected folder is not a git repository:\n{repo}")
            return False
        return True

    def refresh_repo_view(self):
        repo = self.repo_dir()
        self.file_list.delete(0, tk.END)
        if not repo.exists():
            self.repo_status.config(text="Folder does not exist", fg=self.colors["danger"])
            return
        if (repo / ".git").exists():
            self.repo_status.config(text="Git repository detected", fg=self.colors["success"])
        else:
            self.repo_status.config(text="Folder is not a git repo", fg=self.colors["warning"])
        try:
            for item in sorted(repo.iterdir(), key=lambda path: (path.is_file(), path.name.lower())):
                suffix = "/" if item.is_dir() else ""
                self.file_list.insert(tk.END, f"{item.name}{suffix}")
        except OSError as exc:
            self.file_list.insert(tk.END, f"Error: {exc}")

    def run_git(self, args, success_label):
        if not self.validate_repo():
            return

        repo = self.repo_dir()
        cmd = [str(self.git_path), "-C", str(repo), *args]
        self.append_output(f"\n> {' '.join(args)}\n")
        self.set_status(f"Running: {' '.join(args)}", self.colors["warning"])

        def worker():
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
                combined = (result.stdout or "") + (result.stderr or "")
                if not combined.strip():
                    combined = "(no output)\n"
                self.root.after(0, lambda: self.append_output(combined if combined.endswith("\n") else combined + "\n"))
                if result.returncode == 0:
                    self.root.after(0, lambda: self.set_status(success_label, self.colors["success"]))
                else:
                    self.root.after(0, lambda: self.set_status(f"Git failed: {' '.join(args)}", self.colors["danger"]))
                self.root.after(0, self.refresh_repo_view)
            except Exception as exc:
                err_msg = f"{exc}\n"
                self.root.after(0, lambda msg=err_msg: self.append_output(msg))
                self.root.after(0, lambda: self.set_status("Command failed", self.colors["danger"]))

        threading.Thread(target=worker, daemon=True).start()

    def refresh_status(self):
        self.run_git(["status", "--short", "--branch"], "Status updated")

    def fetch_all(self):
        self.run_git(["fetch", "--all", "--prune"], "Fetch complete")

    def pull_current(self):
        self.run_git(["pull"], "Pull complete")

    def push_current(self):
        self.run_git(["push"], "Push complete")

    def list_branches(self):
        self.run_git(["branch", "-vv"], "Branches listed")

    def commit_all(self):
        message = self.commit_message.get().strip()
        if not message:
            messagebox.showerror("Missing Message", "Enter a commit message first.")
            return
        if not self.validate_repo():
            return

        repo = self.repo_dir()
        add_cmd = [str(self.git_path), "-C", str(repo), "add", "-A"]
        commit_cmd = [str(self.git_path), "-C", str(repo), "commit", "-m", message]

        self.append_output("\n> add -A\n")
        self.append_output(f"> commit -m \"{message}\"\n")
        self.set_status("Running commit", self.colors["warning"])

        def worker():
            try:
                add_result = subprocess.run(add_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
                add_output = (add_result.stdout or "") + (add_result.stderr or "")
                if add_output.strip():
                    self.root.after(0, lambda: self.append_output(add_output if add_output.endswith("\n") else add_output + "\n"))
                commit_result = subprocess.run(commit_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
                commit_output = (commit_result.stdout or "") + (commit_result.stderr or "")
                if not commit_output.strip():
                    commit_output = "(no output)\n"
                self.root.after(0, lambda: self.append_output(commit_output if commit_output.endswith("\n") else commit_output + "\n"))
                if commit_result.returncode == 0:
                    self.root.after(0, lambda: self.set_status("Commit complete", self.colors["success"]))
                    self.root.after(0, lambda: self.commit_message.set(""))
                else:
                    self.root.after(0, lambda: self.set_status("Commit failed", self.colors["danger"]))
                self.root.after(0, self.refresh_repo_view)
            except Exception as exc:
                err_msg = f"{exc}\n"
                self.root.after(0, lambda msg=err_msg: self.append_output(msg))
                self.root.after(0, lambda: self.set_status("Commit failed", self.colors["danger"]))

        threading.Thread(target=worker, daemon=True).start()

    def checkout_branch(self):
        branch = self.branch_name.get().strip()
        if not branch:
            messagebox.showerror("Missing Branch", "Enter a branch name first.")
            return
        args = ["checkout"]
        if self.create_branch.get():
            args.append("-b")
        args.append(branch)
        self.run_git(args, f"Checked out {branch}")

    def open_repo_folder(self):
        repo = self.repo_dir()
        if repo.exists():
            self.runtime.open_path(repo)
        else:
            messagebox.showerror("Folder Missing", f"Folder not found:\n{repo}")

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    app = GitHubIDE()
    app.run()
