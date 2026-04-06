import * as si from 'systeminformation';
import { clearScreen } from '../utils/platform';
import chalk from 'chalk';

interface TopStats {
  cpu: { currentLoad: number; cpus: { load: number }[] };
  mem: { total: number; used: number; available: number; free: number };
  processes: { list: { pid: number; name: string; cpu: number; mem: number; memRss: number; state: string }[] };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

function drawBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export async function topMode(interval: number = 2000, maxProcesses: number = 15): Promise<void> {
  let running = true;
  
  const exitHandler = () => {
    running = false;
    console.log();
    console.log(chalk.green('Exiting top.'));
    process.exit(0);
  };

  process.stdin.setRawMode?.(true);
  process.stdin.resume?.();
  process.stdin.on('data', (key) => {
    if (key.toString() === 'q' || key.toString() === '\u0003') {
      exitHandler();
    }
  });

  while (running) {
    try {
      const [cpu, mem, processes] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.processes()
      ]);

      clearScreen();
      
      const width = 70;
      console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
      console.log(chalk.bold.cyan('│') + chalk.bold.white(' sysview top'.padEnd(width)) + chalk.bold.cyan('│'));
      console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
      console.log();

      const barWidth = 35;
      const cpuBar = drawBar(cpu.currentLoad, barWidth);
      const cpuColor = cpu.currentLoad < 50 ? chalk.green : cpu.currentLoad < 80 ? chalk.yellow : chalk.red;
      
      const memPercent = (mem.used / mem.total) * 100;
      const memBar = drawBar(memPercent, barWidth);
      const memColor = memPercent < 50 ? chalk.green : memPercent < 80 ? chalk.yellow : chalk.red;

      console.log(chalk.cyan('┌─ System ────────────────────────────────────────────────────┐'));
      console.log(chalk.cyan('│') + ` CPU:  ${cpuColor(cpuBar)} ${formatPercent(cpu.currentLoad).padStart(6)}                          ` + chalk.cyan('│'));
      console.log(chalk.cyan('│') + ` MEM:  ${memColor(memBar)} ${formatPercent(memPercent).padStart(6)}                          ` + chalk.cyan('│'));
      console.log(chalk.cyan('│') + `       ${formatBytes(mem.used)} / ${formatBytes(mem.total)}                                     ` + chalk.cyan('│'));
      console.log(chalk.cyan('└─────────────────────────────────────────────────────────────────┘'));
      console.log();

      const sortedProcesses = processes.list
        .filter(p => p.pid > 0)
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, maxProcesses);

      console.log(chalk.cyan('┌─ Processes ──────────────────────────────────────────────────────┐'));
      console.log(chalk.cyan('│') + 
        chalk.bold.white(' PID    NAME              CPU%    MEM RSS    STATE      ').padEnd(69) + 
        chalk.cyan('│'));
      console.log(chalk.cyan('├─────────────────────────────────────────────────────────────────┤'));
      
      for (const proc of sortedProcesses) {
        const cpuStr = proc.cpu > 0 ? proc.cpu.toFixed(1).padStart(5) + '%' : '  0.0%';
        const cpuDisplay = proc.cpu > 50 ? chalk.red(cpuStr) : 
                          proc.cpu > 20 ? chalk.yellow(cpuStr) : 
                          proc.cpu > 0 ? chalk.green(cpuStr) : chalk.dim('  0.0%');
        
        const memStr = formatBytes(proc.memRss).padStart(10);
        const memDisplay = chalk.dim(memStr);
        
        const nameStr = (proc.name || 'unknown').substring(0, 16).padEnd(16);
        const pidStr = proc.pid.toString().padStart(6);
        const stateStr = proc.state.substring(0, 8).padEnd(8);
        
        console.log(chalk.cyan('│') + 
          `${pidStr}  ${chalk.white(nameStr)}  ${cpuDisplay}  ${memDisplay}  ${chalk.dim(stateStr)}      ` +
          chalk.cyan('│'));
      }
      
      console.log(chalk.cyan('└─────────────────────────────────────────────────────────────────┘'));
      console.log();
      console.log(chalk.dim(`  ${processes.all} total processes │ q to quit │ refresh: ${interval}ms`));

    } catch (err) {
      console.error(chalk.red('Error:', err));
    }

    if (running) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}
