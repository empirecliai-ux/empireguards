export interface Command {
  name: string;
  desc: string;
  syntax: string;
}

export interface Category {
  name: string;
  commands: Command[];
}

export const COMMAND_CATEGORIES: Category[] = [
  {
    name: "Directory Navigation",
    commands: [
      { name: "cd", desc: "Change directory", syntax: "cd /path/to/dir" },
      { name: "ls", desc: "List directory contents", syntax: "ls -la" },
      { name: "pwd", desc: "Print working directory", syntax: "pwd" },
      { name: "dir", desc: "Directory listing in columnar format", syntax: "dir -v" },
      { name: "tree", desc: "List directories in tree structure", syntax: "tree -L 2" },
      { name: "pushd", desc: "Push directory to stack", syntax: "pushd /path" },
      { name: "popd", desc: "Pop directory from stack", syntax: "popd" },
      { name: "z", desc: "Jump to frequently used directory", syntax: "z project" },
      { name: "find", desc: "Search for files", syntax: "find . -name \"*.txt\"" },
      { name: "locate", desc: "Find files by name", syntax: "locate file.txt" },
      { name: "basename", desc: "Strip directory info from path", syntax: "basename /path/file" },
      { name: "dirname", desc: "Print directory name from path", syntax: "dirname /path/file" },
      { name: "realpath", desc: "Print absolute path", syntax: "realpath file" },
      { name: "mktemp", desc: "Create temporary directory", syntax: "mktemp -d" },
      { name: "readlink", desc: "Print resolved symbolic links", syntax: "readlink -f link" },
      { name: "cd ..", desc: "Go up one directory", syntax: "cd .." },
      { name: "cd ~", desc: "Go to home directory", syntax: "cd ~" },
      { name: "cd -", desc: "Go to previous directory", syntax: "cd -" },
      { name: "dirs", desc: "Display directory stack", syntax: "dirs -v" },
      { name: "pwd -P", desc: "Print physical directory (resolve symlinks)", syntax: "pwd -P" }
    ]
  },
  {
    name: "File Manipulation",
    commands: [
      { name: "mkdir", desc: "Make directory", syntax: "mkdir -p /path/dir" },
      { name: "rmdir", desc: "Remove empty directory", syntax: "rmdir dir" },
      { name: "rm", desc: "Remove files/directories", syntax: "rm -rf dir" },
      { name: "cp", desc: "Copy files/directories", syntax: "cp -r source dest" },
      { name: "mv", desc: "Move/rename files", syntax: "mv source dest" },
      { name: "touch", desc: "Create/update file timestamp", syntax: "touch file.txt" },
      { name: "ln", desc: "Create links", syntax: "ln -s source link" },
      { name: "chmod", desc: "Change permissions", syntax: "chmod 755 file" },
      { name: "chown", desc: "Change owner/group", syntax: "chown user:group file" },
      { name: "rsync", desc: "Sync files/directories", syntax: "rsync -avz source dest" },
      { name: "tar", desc: "Archive files", syntax: "tar -czvf archive.tar.gz dir" },
      { name: "gzip", desc: "Compress file", syntax: "gzip file" },
      { name: "gunzip", desc: "Decompress file", syntax: "gunzip file.gz" },
      { name: "zip", desc: "Compress to zip", syntax: "zip -r archive.zip dir" },
      { name: "unzip", desc: "Extract zip", syntax: "unzip archive.zip" },
      { name: "split", desc: "Split file into pieces", syntax: "split -b 100k file" },
      { name: "cpio", desc: "Copy to/from archives", syntax: "cpio -idmv < archive" },
      { name: "bzip2", desc: "Compress with bzip2", syntax: "bzip2 file" },
      { name: "bunzip2", desc: "Decompress bzip2", syntax: "bunzip2 file.bz2" },
      { name: "mktemp file", desc: "Create temporary file", syntax: "mktemp file.XXXX" }
    ]
  },
  {
    name: "Text Processing",
    commands: [
      { name: "cat", desc: "Concatenate/print files", syntax: "cat file.txt" },
      { name: "tac", desc: "Print in reverse", syntax: "tac file.txt" },
      { name: "head", desc: "Show first lines", syntax: "head -n 10 file" },
      { name: "tail", desc: "Show last lines", syntax: "tail -f file" },
      { name: "grep", desc: "Search pattern", syntax: "grep \"pattern\" file" },
      { name: "sed", desc: "Stream editor", syntax: "sed 's/old/new/g' file" },
      { name: "awk", desc: "Pattern scanning", syntax: "awk '{print $1}' file" },
      { name: "cut", desc: "Remove sections", syntax: "cut -d':' -f1 file" },
      { name: "sort", desc: "Sort lines", syntax: "sort file" },
      { name: "uniq", desc: "Remove duplicates", syntax: "uniq -c file" },
      { name: "paste", desc: "Merge lines", syntax: "paste file1 file2" },
      { name: "echo", desc: "Print text", syntax: "echo \"text\" > file" },
      { name: "printf", desc: "Format print", syntax: "printf \"%s\\n\" text" },
      { name: "wc", desc: "Word count", syntax: "wc -l file" },
      { name: "less", desc: "Pager for files", syntax: "less file" },
      { name: "more", desc: "Pager for files", syntax: "more file" },
      { name: "column", desc: "Format into columns", syntax: "column -t file" },
      { name: "tr", desc: "Translate characters", syntax: "tr 'a' 'A' < file" },
      { name: "fold", desc: "Wrap lines", syntax: "fold -w80 file" },
      { name: "nl", desc: "Number lines", syntax: "nl file" }
    ]
  },
  {
    name: "System Monitoring",
    commands: [
      { name: "uname", desc: "System info", syntax: "uname -a" },
      { name: "free", desc: "Memory usage", syntax: "free -h" },
      { name: "df", desc: "Disk space", syntax: "df -h" },
      { name: "du", desc: "Disk usage", syntax: "du -sh dir" },
      { name: "top", desc: "Process monitor", syntax: "top" },
      { name: "htop", desc: "Interactive process viewer", syntax: "htop" },
      { name: "ps", desc: "Process status", syntax: "ps aux" },
      { name: "lscpu", desc: "CPU info", syntax: "lscpu" },
      { name: "lsblk", desc: "Block devices", syntax: "lsblk -f" },
      { name: "uptime", desc: "System uptime", syntax: "uptime" },
      { name: "vmstat", desc: "Virtual memory stats", syntax: "vmstat 1" },
      { name: "iostat", desc: "I/O stats", syntax: "iostat -x" },
      { name: "mpstat", desc: "CPU stats", syntax: "mpstat -P ALL" },
      { name: "dmesg", desc: "Kernel messages", syntax: "dmesg | grep error" },
      { name: "hostname", desc: "Show hostname", syntax: "hostname -f" },
      { name: "lsb_release", desc: "Distribution info", syntax: "lsb_release -a" },
      { name: "whoami", desc: "Current user", syntax: "whoami" },
      { name: "w", desc: "Logged in users", syntax: "w" },
      { name: "ionice", desc: "I/O priority", syntax: "ionice -c3 command" },
      { name: "ncdu", desc: "Disk usage analyzer", syntax: "ncdu /" }
    ]
  },
  {
    name: "Networking",
    commands: [
      { name: "ping", desc: "Test connectivity", syntax: "ping google.com" },
      { name: "ifconfig", desc: "Network interface config", syntax: "ifconfig" },
      { name: "ip", desc: "IP addressing", syntax: "ip addr show" },
      { name: "netstat", desc: "Network stats", syntax: "netstat -tuln" },
      { name: "ss", desc: "Socket stats", syntax: "ss -tuln" },
      { name: "traceroute", desc: "Trace route", syntax: "traceroute google.com" },
      { name: "dig", desc: "DNS lookup", syntax: "dig google.com" },
      { name: "nslookup", desc: "DNS query", syntax: "nslookup google.com" },
      { name: "curl", desc: "Transfer data", syntax: "curl -O url" },
      { name: "wget", desc: "Download file", syntax: "wget url" },
      { name: "ssh", desc: "Secure shell", syntax: "ssh user@host" },
      { name: "scp", desc: "Secure copy", syntax: "scp file user@host:/path" },
      { name: "ufw", desc: "Firewall", syntax: "ufw allow 22" },
      { name: "iptables", desc: "Firewall rules", syntax: "iptables -L" },
      { name: "nmcli", desc: "Network manager", syntax: "nmcli device status" },
      { name: "whois", desc: "Domain info", syntax: "whois google.com" },
      { name: "tailscale install", desc: "Download Tailscale", syntax: "curl -fsSL https://tailscale.com/install.sh | sh" },
      { name: "tailscale up", desc: "Start Tailscale", syntax: "sudo tailscale up" },
      { name: "tailscale auth", desc: "Authenticate", syntax: "tailscale up --auth-key=key" },
      { name: "tailscale reauth", desc: "Re-auth", syntax: "tailscale up --force-reauth" }
    ]
  },
  {
    name: "Process Management",
    commands: [
      { name: "ps aux", desc: "Process status", syntax: "ps aux" },
      { name: "kill", desc: "Kill process", syntax: "kill -9 PID" },
      { name: "killall", desc: "Kill by name", syntax: "killall process" },
      { name: "pkill", desc: "Kill by pattern", syntax: "pkill pattern" },
      { name: "bg", desc: "Background job", syntax: "bg %1" },
      { name: "fg", desc: "Foreground job", syntax: "fg %1" },
      { name: "jobs", desc: "List jobs", syntax: "jobs -l" },
      { name: "nohup", desc: "Run immune to hangup", syntax: "nohup command &" },
      { name: "nice", desc: "Run with priority", syntax: "nice -n 10 command" },
      { name: "renice", desc: "Change priority", syntax: "renice -n 5 PID" },
      { name: "pstree", desc: "Process tree", syntax: "pstree -p" },
      { name: "lsof", desc: "List open files", syntax: "lsof -i :80" },
      { name: "watch", desc: "Run repeatedly", syntax: "watch -n1 command" },
      { name: "sleep", desc: "Delay", syntax: "sleep 10s" },
      { name: "time", desc: "Measure time", syntax: "time command" },
      { name: "crontab", desc: "Schedule tasks", syntax: "crontab -e" },
      { name: "at", desc: "Schedule one-time", syntax: "at now +1 hour" },
      { name: "screen", desc: "Screen session", syntax: "screen -S name" },
      { name: "tmux", desc: "Terminal multiplexer", syntax: "tmux new -s name" },
      { name: "disown", desc: "Detach job", syntax: "disown -h %1" }
    ]
  },
  {
    name: "User Management",
    commands: [
      { name: "useradd", desc: "Add user", syntax: "useradd -m user" },
      { name: "userdel", desc: "Delete user", syntax: "userdel user" },
      { name: "usermod", desc: "Modify user", syntax: "usermod -aG group user" },
      { name: "passwd", desc: "Change password", syntax: "passwd user" },
      { name: "su", desc: "Switch user", syntax: "su - user" },
      { name: "sudo", desc: "Run as superuser", syntax: "sudo command" },
      { name: "groups", desc: "Show groups", syntax: "groups user" },
      { name: "id", desc: "User/group IDs", syntax: "id user" },
      { name: "who", desc: "Logged in users", syntax: "who" },
      { name: "w", desc: "Who and what", syntax: "w" },
      { name: "last", desc: "Last logins", syntax: "last -n 10" },
      { name: "finger", desc: "User info", syntax: "finger user" },
      { name: "chgrp", desc: "Change group", syntax: "chgrp group file" },
      { name: "adduser", desc: "Add interactive user", syntax: "adduser user" },
      { name: "deluser", desc: "Delete user", syntax: "deluser user" },
      { name: "gpasswd", desc: "Group password", syntax: "gpasswd group" },
      { name: "logname", desc: "Print login name", syntax: "logname" },
      { name: "getent", desc: "Get entries", syntax: "getent passwd" },
      { name: "visudo", desc: "Edit sudoers", syntax: "visudo" },
      { name: "sudoers", desc: "Sudo config", syntax: "man sudoers" }
    ]
  },
  {
    name: "Package Management",
    commands: [
      { name: "apt", desc: "Package manager", syntax: "apt update" },
      { name: "apt-get", desc: "APT tool", syntax: "apt-get install pkg" },
      { name: "dpkg", desc: "Debian package", syntax: "dpkg -i pkg.deb" },
      { name: "rpm", desc: "RPM manager", syntax: "rpm -ivh pkg.rpm" },
      { name: "yum", desc: "YUM manager", syntax: "yum install pkg" },
      { name: "dnf", desc: "DNF manager", syntax: "dnf install pkg" },
      { name: "pacman", desc: "Arch manager", syntax: "pacman -S pkg" },
      { name: "snap", desc: "Snap packages", syntax: "snap install pkg" },
      { name: "flatpak", desc: "Flatpak", syntax: "flatpak install pkg" },
      { name: "tar", desc: "Archive", syntax: "tar -xvf archive.tar" },
      { name: "zip", desc: "Zip compress", syntax: "zip file.zip file" },
      { name: "unzip", desc: "Unzip", syntax: "unzip file.zip" },
      { name: "gzip", desc: "Gzip compress", syntax: "gzip -k file" },
      { name: "gunzip", desc: "Gzip decompress", syntax: "gunzip file.gz" },
      { name: "bzip2", desc: "Bzip compress", syntax: "bzip2 file" },
      { name: "bunzip2", desc: "Bzip decompress", syntax: "bunzip2 file.bz2" },
      { name: "xz", desc: "XZ compress", syntax: "xz file" },
      { name: "unxz", desc: "XZ decompress", syntax: "unxz file.xz" },
      { name: "7z", desc: "7-Zip", syntax: "7z a archive.7z file" },
      { name: "cpio", desc: "Archive copy", syntax: "cpio -o > archive" }
    ]
  },
  {
    name: "Hardware Management",
    commands: [
      { name: "fdisk", desc: "Partition table", syntax: "fdisk -l" },
      { name: "mkfs", desc: "Make filesystem", syntax: "mkfs.ext4 /dev/sda1" },
      { name: "fsck", desc: "Filesystem check", syntax: "fsck /dev/sda1" },
      { name: "badblocks", desc: "Scan bad blocks", syntax: "badblocks -v /dev/sda" },
      { name: "mount", desc: "Mount filesystem", syntax: "mount /dev/sda1 /mnt" },
      { name: "umount", desc: "Unmount", syntax: "umount /mnt" },
      { name: "lspci", desc: "List PCI", syntax: "lspci -v" },
      { name: "dmidecode", desc: "DMI info", syntax: "dmidecode -t bios" },
      { name: "hdparm", desc: "HDD params", syntax: "hdparm -t /dev/sda" },
      { name: "dd", desc: "Disk duplicate", syntax: "dd if=/dev/sda of=backup.img" },
      { name: "cfdisk", desc: "Disk partition", syntax: "cfdisk /dev/sda" },
      { name: "blkid", desc: "Block ID", syntax: "blkid /dev/sda1" },
      { name: "smartctl", desc: "SMART monitor", syntax: "smartctl -t long /dev/sda" },
      { name: "e2fsck", desc: "Ext filesystem check", syntax: "e2fsck /dev/sda1" },
      { name: "resize2fs", desc: "Resize ext", syntax: "resize2fs /dev/sda1" },
      { name: "partprobe", desc: "Reload partitions", syntax: "partprobe" },
      { name: "mdadm", desc: "RAID management", syntax: "mdadm --assemble /dev/md0" },
      { name: "lvm", desc: "LVM tools", syntax: "lvcreate -L 10G vgname" },
      { name: "pvdisplay", desc: "Physical volume", syntax: "pvdisplay" },
      { name: "vgdisplay", desc: "Volume group", syntax: "vgdisplay" }
    ]
  },
  {
    name: "Security & Misc",
    commands: [
      { name: "iptables", desc: "Firewall", syntax: "iptables -A INPUT -j DROP" },
      { name: "ufw", desc: "Uncomplicated firewall", syntax: "ufw enable" },
      { name: "sudo -u", desc: "Superuser do as user", syntax: "sudo -u user command" },
      { name: "visudo", desc: "Edit sudoers", syntax: "visudo" },
      { name: "chroot", desc: "Change root", syntax: "chroot /path" },
      { name: "apparmor", desc: "AppArmor status", syntax: "aa-status" },
      { name: "selinux", desc: "SELinux status", syntax: "sestatus" },
      { name: "openssl", desc: "SSL toolkit", syntax: "openssl genrsa -out key.pem" },
      { name: "gpg", desc: "GPG encrypt", syntax: "gpg -c file" },
      { name: "shred", desc: "Secure delete", syntax: "shred -u file" },
      { name: "bc", desc: "Calculator", syntax: "bc -l" },
      { name: "cal", desc: "Calendar", syntax: "cal -3" },
      { name: "factor", desc: "Prime factors", syntax: "factor 100" },
      { name: "yes", desc: "Print yes", syntax: "yes y | command" },
      { name: "banner", desc: "Print banner", syntax: "banner \"Empire\"" },
      { name: "aplay", desc: "Play audio", syntax: "aplay sound.wav" },
      { name: "spd-say", desc: "Speak text", syntax: "spd-say \"Hello\"" },
      { name: "cmatrix", desc: "Matrix screensaver", syntax: "cmatrix" },
      { name: "sl", desc: "Steam locomotive", syntax: "sl" },
      { name: "fortune", desc: "Random quote", syntax: "fortune" }
    ]
  }
];
