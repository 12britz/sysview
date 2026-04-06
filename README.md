# sysview

**A beautiful CLI tool for system monitoring - ports, network, memory, CPU, disk, processes, and git with colorful tables.**

Stop guessing. `sysview` gives you a color-coded overview of your system in seconds.

## What it looks like

```
$ sysview ports

┌──────────────────────────────────────────────────┐
│            sysview - ports                        │
└──────────────────────────────────────────────────┘

┌──────────┬────────────────────┬──────────┬────────────────────┬──────────┐
│ PORT     │ PROCESS           │ PID      │ ADDRESS            │ STATUS   │
├──────────┼────────────────────┼──────────┼────────────────────┼──────────┤
│ :3000    │ node              │ 42872    │ 127.0.0.1          │ ● LISTEN │
│ :5432    │ postgres          │ 99101    │ 127.0.0.1          │ ● LISTEN │
│ :6379    │ redis-server      │ 87321    │ 0.0.0.0            │ ● LISTEN │
└──────────┴────────────────────┴──────────┴────────────────────┴──────────┘

6 ports listening  ·  q to quit
```

## Install

```bash
npm install -g sysview
```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `sysview` | Show available commands |
| `sysview ports` | Show listening ports |
| `sysview network` | Show network connections |
| `sysview memory` | Show memory usage |
| `sysview cpu` | Show CPU usage |
| `sysview disk` | Show disk usage |
| `sysview ps` | Show running processes |
| `sysview process` | Show process tree |
| `sysview top` | Interactive process monitor |
| `sysview git` | Git repository info |
| `sysview kill <pid>` | Kill a process |
| `sysview watch` | Real-time dashboard |
| `sysview dashboard` | Full system overview |

### Options

#### ports
```bash
sysview ports
```

#### network
```bash
sysview network
```

#### memory (alias: mem)
```bash
sysview memory
sysview mem
```

#### cpu
```bash
sysview cpu
```

#### disk
```bash
sysview disk
```

#### ps (processes)
```bash
sysview ps                 # Sort by CPU
sysview ps --cpu          # Sort by CPU
sysview ps --memory       # Sort by memory
```

#### process (process tree)
```bash
sysview process            # Show help
sysview process --tree    # Show process tree
sysview process --list    # Show process list
sysview process -l -m     # List sorted by memory
```

#### top (interactive)
```bash
sysview top               # Start monitoring
sysview top --start      # Same as above
sysview top -i 1000      # 1 second refresh
sysview top -n 10        # Show 10 processes
```

#### git
```bash
sysview git               # Show status (default)
sysview git --status     # Show status
sysview git --branches   # Show branches
sysview git --log        # Show recent commits
sysview git --log 20     # Show 20 commits
sysview git --remotes    # Show remotes
sysview git --stash      # Show stash
sysview git --contributors # Show contributors
sysview git --tags       # Show tags
sysview git --diff       # Show diff
sysview git --staged     # Show staged diff
sysview git --shortlog   # Show shortlog
sysview git --all        # Show all git info
```

#### kill
```bash
sysview kill 3000         # Kill by port
sysview kill 42872        # Kill by PID
sysview kill 3000 -f      # Force kill
```

#### watch (real-time dashboard)
```bash
sysview watch            # Show help
sysview watch --start    # Start watching
sysview watch -i 1000    # 1 second refresh
```

#### dashboard
```bash
sysview dashboard         # Full overview
sysview dash             # Alias
```

## Features

- **Cross-platform**: Works on macOS and Linux
- **Color-coded**: Green (good), Yellow (warning), Red (critical)
- **Progress bars**: Visual representation of usage
- **Process tree**: Hierarchical view of processes
- **Git integration**: Status, branches, commits, remotes
- **Interactive**: Real-time monitoring mode

## License

MIT
