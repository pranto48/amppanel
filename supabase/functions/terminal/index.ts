import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulated server data
const serverInfo = {
  hostname: "amp-server",
  os: "Ubuntu 22.04.3 LTS",
  kernel: "5.15.0-91-generic",
  uptime: "45 days, 12:34:56",
  loadAvg: [0.42, 0.38, 0.35],
  cpuCores: 4,
  cpuModel: "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
  memTotal: 16384,
  memUsed: 6348,
  memFree: 10036,
  diskTotal: 500,
  diskUsed: 124,
  diskFree: 376,
};

const services = [
  { name: "nginx", status: "active", pid: 1234, memory: "124 MB" },
  { name: "mysql", status: "active", pid: 2345, memory: "512 MB" },
  { name: "php8.2-fpm", status: "active", pid: 3456, memory: "256 MB" },
  { name: "redis-server", status: "active", pid: 4567, memory: "64 MB" },
  { name: "postfix", status: "inactive", pid: null, memory: "-" },
  { name: "fail2ban", status: "active", pid: 5678, memory: "32 MB" },
];

const processExecuteCommand = (command: string, args: string[]): { output: string; exitCode: number } => {
  const cmd = command.toLowerCase();
  
  switch (cmd) {
    case "help":
      return {
        output: `AMP Panel Terminal - Available Commands:
        
System Commands:
  uname [-a]        Display system information
  uptime            Show system uptime
  hostname          Display hostname
  whoami            Display current user
  date              Display current date/time
  clear             Clear the terminal

Resource Monitoring:
  free [-h]         Display memory usage
  df [-h]           Display disk usage
  top               Display running processes (snapshot)
  htop              Interactive process viewer (snapshot)

Service Management:
  systemctl status [service]   Check service status
  systemctl list-units         List all services
  service --status-all         Show all service statuses

Network:
  ip addr           Display IP addresses
  netstat -tuln     Show listening ports
  ping [host]       Ping a host (simulated)

File System:
  ls [-la] [path]   List directory contents
  pwd               Print working directory
  cat [file]        Display file contents (limited)

Other:
  echo [text]       Echo text
  history           Show command history
  exit              Close terminal session`,
        exitCode: 0,
      };

    case "uname":
      if (args.includes("-a")) {
        return {
          output: `Linux ${serverInfo.hostname} ${serverInfo.kernel} #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`,
          exitCode: 0,
        };
      }
      return { output: "Linux", exitCode: 0 };

    case "uptime":
      return {
        output: ` ${new Date().toLocaleTimeString()} up ${serverInfo.uptime}, 2 users, load average: ${serverInfo.loadAvg.join(", ")}`,
        exitCode: 0,
      };

    case "hostname":
      return { output: serverInfo.hostname, exitCode: 0 };

    case "whoami":
      return { output: "root", exitCode: 0 };

    case "date":
      return { output: new Date().toString(), exitCode: 0 };

    case "pwd":
      return { output: "/root", exitCode: 0 };

    case "free":
      const freeH = args.includes("-h");
      if (freeH) {
        return {
          output: `              total        used        free      shared  buff/cache   available
Mem:           16Gi       6.2Gi       9.8Gi       256Mi       1.2Gi        9.4Gi
Swap:         2.0Gi          0B       2.0Gi`,
          exitCode: 0,
        };
      }
      return {
        output: `              total        used        free      shared  buff/cache   available
Mem:       16777216     6504448    10272768      262144     1257472     9879552
Swap:       2097152           0     2097152`,
        exitCode: 0,
      };

    case "df":
      const dfH = args.includes("-h");
      if (dfH) {
        return {
          output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       500G  124G  376G  25% /
tmpfs           7.8G     0  7.8G   0% /dev/shm
/dev/sdb1       1.0T  456G  544G  46% /var/www`,
          exitCode: 0,
        };
      }
      return {
        output: `Filesystem     1K-blocks      Used Available Use% Mounted on
/dev/sda1      524288000 130023424 394264576  25% /
tmpfs            8192000         0   8192000   0% /dev/shm
/dev/sdb1     1073741824 478150656 595591168  46% /var/www`,
        exitCode: 0,
      };

    case "top":
    case "htop":
      return {
        output: `top - ${new Date().toLocaleTimeString()} up ${serverInfo.uptime}, 2 users, load average: ${serverInfo.loadAvg.join(", ")}
Tasks: 142 total,   1 running, 141 sleeping,   0 stopped,   0 zombie
%Cpu(s):  4.2 us,  1.3 sy,  0.0 ni, 94.0 id,  0.3 wa,  0.0 hi,  0.2 si,  0.0 st
MiB Mem :  16384.0 total,  10036.0 free,   6348.0 used,   1248.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   9648.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 2345 mysql     20   0 2048576 524288  16384 S   2.3   3.2  45:23.12 mysqld
 3456 www-data  20   0  262144 131072   8192 S   1.2   0.8  12:45.67 php-fpm8.2
 1234 root      20   0  131072  65536   4096 S   0.8   0.4   8:32.45 nginx
 4567 redis     20   0   65536  32768   2048 S   0.3   0.2   3:21.89 redis-server
 5678 root      20   0   32768  16384   1024 S   0.1   0.1   1:12.34 fail2ban`,
        exitCode: 0,
      };

    case "systemctl":
      if (args[0] === "status" && args[1]) {
        const service = services.find(s => s.name.includes(args[1]));
        if (service) {
          return {
            output: `● ${service.name}.service - ${service.name.charAt(0).toUpperCase() + service.name.slice(1)} Service
     Loaded: loaded (/lib/systemd/system/${service.name}.service; enabled)
     Active: ${service.status === "active" ? "active (running)" : "inactive (dead)"} since ${new Date().toDateString()}
   Main PID: ${service.pid || "-"} (${service.name})
      Tasks: 4 (limit: 4915)
     Memory: ${service.memory}
        CPU: 1.234s`,
            exitCode: 0,
          };
        }
        return { output: `Unit ${args[1]}.service could not be found.`, exitCode: 4 };
      }
      if (args[0] === "list-units") {
        return {
          output: services.map(s => 
            `  ${s.name}.service    loaded ${s.status === "active" ? "active   running" : "inactive dead   "} ${s.name}`
          ).join("\n"),
          exitCode: 0,
        };
      }
      return { output: "Usage: systemctl [status|list-units] [service]", exitCode: 1 };

    case "service":
      if (args.includes("--status-all")) {
        return {
          output: services.map(s => 
            ` [ ${s.status === "active" ? "+" : "-"} ]  ${s.name}`
          ).join("\n"),
          exitCode: 0,
        };
      }
      return { output: "Usage: service --status-all", exitCode: 1 };

    case "ip":
      if (args[0] === "addr" || args[0] === "a") {
        return {
          output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
    inet 127.0.0.1/8 scope host lo
    inet6 ::1/128 scope host
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
    inet6 fe80::1/64 scope link
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0`,
          exitCode: 0,
        };
      }
      return { output: "Usage: ip addr", exitCode: 1 };

    case "netstat":
      return {
        output: `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:6379          0.0.0.0:*               LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
tcp6       0      0 :::443                  :::*                    LISTEN`,
        exitCode: 0,
      };

    case "ping":
      if (args[0]) {
        const host = args[0];
        return {
          output: `PING ${host} (93.184.216.34) 56(84) bytes of data.
64 bytes from ${host} (93.184.216.34): icmp_seq=1 ttl=56 time=12.3 ms
64 bytes from ${host} (93.184.216.34): icmp_seq=2 ttl=56 time=11.8 ms
64 bytes from ${host} (93.184.216.34): icmp_seq=3 ttl=56 time=12.1 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 11.8/12.1/12.3/0.2 ms`,
          exitCode: 0,
        };
      }
      return { output: "Usage: ping [hostname]", exitCode: 1 };

    case "ls":
      const showHidden = args.includes("-la") || args.includes("-a");
      const path = args.find(a => !a.startsWith("-")) || "/root";
      
      if (path === "/root" || path === "~") {
        const files = showHidden 
          ? `drwx------  5 root root 4096 Jan 15 10:30 .
drwxr-xr-x 24 root root 4096 Jan  1 00:00 ..
-rw-------  1 root root 1234 Jan 15 10:30 .bash_history
-rw-r--r--  1 root root  570 Jan  1 00:00 .bashrc
drwx------  3 root root 4096 Jan  1 00:00 .ssh
-rw-r--r--  1 root root  807 Jan  1 00:00 .profile
drwxr-xr-x  2 root root 4096 Jan 10 15:20 scripts
-rw-r--r--  1 root root 2048 Jan  5 12:00 notes.txt`
          : `scripts  notes.txt`;
        return { output: files, exitCode: 0 };
      }
      if (path === "/var/www" || path === "/var/www/html") {
        return {
          output: showHidden
            ? `drwxr-xr-x  4 www-data www-data 4096 Jan 15 10:30 .
drwxr-xr-x 14 root     root     4096 Jan  1 00:00 ..
drwxr-xr-x  5 www-data www-data 4096 Jan 12 08:45 example.com
drwxr-xr-x  3 www-data www-data 4096 Jan 14 16:30 myapp.io
-rw-r--r--  1 www-data www-data  612 Jan  1 00:00 index.html`
            : `example.com  myapp.io  index.html`,
          exitCode: 0,
        };
      }
      return { output: `ls: cannot access '${path}': No such file or directory`, exitCode: 2 };

    case "cat":
      if (args[0] === "/etc/os-release") {
        return {
          output: `PRETTY_NAME="Ubuntu 22.04.3 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.3 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian`,
          exitCode: 0,
        };
      }
      if (args[0]) {
        return { output: `cat: ${args[0]}: Permission denied`, exitCode: 1 };
      }
      return { output: "Usage: cat [file]", exitCode: 1 };

    case "echo":
      return { output: args.join(" "), exitCode: 0 };

    case "clear":
      return { output: "__CLEAR__", exitCode: 0 };

    case "exit":
      return { output: "__EXIT__", exitCode: 0 };

    case "neofetch":
      return {
        output: `
        .-/+oossssoo+/-.               root@${serverInfo.hostname}
    \`:+ssssssssssssssssss+:\`           -------------------
  -+ssssssssssssssssssyyssss+-         OS: ${serverInfo.os}
.ossssssssssssssssssdMMMNysssso.       Kernel: ${serverInfo.kernel}
/ssssssssssshdmmNNmmyNMMMMhssssss/     Uptime: ${serverInfo.uptime}
+ssssssssshmydMMMMMMMNddddyssssssss+   Shell: bash 5.1.16
/sssssssshNMMMyhhyyyyhmNMMMNhssssss/   CPU: ${serverInfo.cpuModel}
.ssssssssdMMMNhsssssssssshNMMMdssss.   Memory: ${serverInfo.memUsed}MiB / ${serverInfo.memTotal}MiB
+sssshhhyNMMNyssssssssssssyNMMMysss+   Disk: ${serverInfo.diskUsed}G / ${serverInfo.diskTotal}G
ossyNMMMNyMMhsssssssssssssshmmmhssso
ossyNMMMNyMMhsssssssssssssshmmmhssso
+sssshhhyNMMNyssssssssssssyNMMMysss+
.ssssssssdMMMNhsssssssssshNMMMdssss.
/sssssssshNMMMyhhyyyyhdNMMMNhssssss/
+sssssssssdmydMMMMMMMMddddyssssssss+
/ssssssssssshdmNNNNmyNMMMMhssssss/
.ossssssssssssssssssdMMMNysssso.
  -+sssssssssssssssssyyyssss+-
    \`:+ssssssssssssssssss+:\`
        .-/+oossssoo+/-.`,
        exitCode: 0,
      };

    default:
      return { 
        output: `${command}: command not found. Type 'help' for available commands.`, 
        exitCode: 127 
      };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();
    
    if (!command || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Command is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse command and arguments
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    console.log(`Executing command: ${cmd} ${args.join(' ')}`);

    const result = processExecuteCommand(cmd, args);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Terminal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', output: 'Error executing command', exitCode: 1 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
