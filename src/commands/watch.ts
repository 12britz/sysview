import * as si from 'systeminformation';
import { clearScreen, formatBytes, formatPercent } from '../utils/platform';
import chalk from 'chalk';

export async function watchMode(interval: number = 2000): Promise<void> {
  console.log(chalk.cyan('sysview watch mode - Press q to quit'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log();

  let running = true;
  const exitHandler = () => {
    running = false;
    console.log();
    console.log(chalk.green('Exiting watch mode.'));
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
      await displayDashboard();
    } catch (err) {
      console.error(chalk.red('Error fetching data:', err));
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
    
    if (running) {
      clearScreen();
    }
  }
}

async function displayDashboard(): Promise<void> {
  const [cpu, mem, ports, network, disk] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.networkConnections(),
    si.networkStats(),
    si.fsSize()
  ]);

  const width = 50;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' sysview - live dashboard'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  console.log(chalk.cyan.bold('┌─ CPU ────────────────────────────────────────────┐'));
  const barWidth = 40;
  const cpuBar = Math.round((cpu.currentLoad / 100) * barWidth);
  const cpuColor = cpu.currentLoad < 50 ? chalk.green : cpu.currentLoad < 80 ? chalk.yellow : chalk.red;
  console.log(cpuColor('│ ' + '█'.repeat(cpuBar) + '░'.repeat(barWidth - cpuBar) + ' ' + formatPercent(cpu.currentLoad) + ' '.repeat(Math.max(0, 8 - formatPercent(cpu.currentLoad).length)) + '│'));
  console.log(chalk.cyan('└───────────────────────────────────────────────────┘'));

  console.log(chalk.cyan.bold('┌─ MEMORY ─────────────────────────────────────────┐'));
  const memPercent = (mem.used / mem.total) * 100;
  const memBar = Math.round((memPercent / 100) * barWidth);
  const memColor = memPercent < 50 ? chalk.green : memPercent < 80 ? chalk.yellow : chalk.red;
  console.log(memColor('│ ' + '█'.repeat(memBar) + '░'.repeat(barWidth - memBar) + ' ' + formatPercent(memPercent) + ' '.repeat(Math.max(0, 8 - formatPercent(memPercent).length)) + '│'));
  console.log(chalk.dim(`│   ${formatBytes(mem.used)} / ${formatBytes(mem.total)}${' '.repeat(Math.max(0, 42 - (formatBytes(mem.used).length + formatBytes(mem.total).length + 4)))}│`));
  console.log(chalk.cyan('└───────────────────────────────────────────────────┘'));

  console.log(chalk.cyan.bold('┌─ PORTS ───────────────────────────────────────────┐'));
  const listeningPorts = (ports as any[]).filter((p: any) => p.state === 'LISTEN').slice(0, 5);
  if (listeningPorts.length === 0) {
    console.log(chalk.dim('│  No listening ports' + ' '.repeat(Math.max(0, 33)) + '│'));
  } else {
    for (const port of listeningPorts) {
      const portStr = `:${port.localPort}`.padEnd(8);
      const procStr = ((port as any).name || 'unknown').substring(0, 20).padEnd(21);
      console.log(`│  ${chalk.green(portStr)} ${procStr}│`);
    }
  }
  console.log(chalk.cyan('└───────────────────────────────────────────────────┘'));

  console.log(chalk.cyan.bold('┌─ NETWORK ─────────────────────────────────────────┐'));
  for (const iface of network.slice(0, 3)) {
    const name = iface.iface.padEnd(8);
    const rx = formatBytes(iface.rx_bytes).padEnd(10);
    const tx = formatBytes(iface.tx_bytes).padEnd(10);
    console.log(chalk.dim(`│  ${name} ↓ ${rx}  ↑ ${tx}` + ' '.repeat(Math.max(0, 38 - name.length - rx.length - tx.length)) + '│'));
  }
  console.log(chalk.cyan('└───────────────────────────────────────────────────┘'));

  console.log(chalk.cyan.bold('┌─ DISK ────────────────────────────────────────────┐'));
  for (const fs of disk.slice(0, 3)) {
    const mount = fs.mount.substring(0, 10).padEnd(11);
    const usage = formatPercent(fs.use);
    const usedOf = `${formatBytes(fs.used)}/${formatBytes(fs.size)}`.padEnd(20);
    console.log(chalk.dim(`│  ${mount} ${usage} ${usedOf}` + ' '.repeat(Math.max(0, 38 - mount.length - usage.length - usedOf.length)) + '│'));
  }
  console.log(chalk.cyan('└───────────────────────────────────────────────────┘'));

  console.log();
  console.log(chalk.dim('q to quit · refresh: 2s'));
}
