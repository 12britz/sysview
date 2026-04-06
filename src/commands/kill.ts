import inquirer from 'inquirer';
import { killProcess } from '../utils/shell';
import { printSuccess, printError } from '../utils/table';
import { getPortByNumber } from './ports';
import { findProcessByPid } from './ps';
import { formatUptime, formatBytes } from '../utils/platform';
import chalk from 'chalk';

export async function killByPid(pid: number, force: boolean = false): Promise<boolean> {
  const proc = await findProcessByPid(pid);
  
  if (!proc) {
    printError(`No process found with PID ${pid}`);
    return false;
  }
  
  console.log(chalk.cyan('Process Information:'));
  console.log(`  PID:     ${proc.pid}`);
  console.log(`  Name:    ${proc.name}`);
  console.log(`  CPU:     ${proc.cpu.toFixed(1)}%`);
  console.log(`  Memory:  ${formatBytes(proc.memRss)}`);
  console.log(`  Uptime:  ${formatUptime(proc.uptime)}`);
  console.log(`  Command: ${proc.command}`);
  console.log();
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Kill process ${proc.name} (PID: ${proc.pid})?`,
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('Cancelled.'));
    return false;
  }
  
  const signal = force ? 'SIGKILL' : 'SIGTERM';
  console.log(chalk.dim(`Sending ${signal} to ${pid}...`));
  
  const success = await killProcess(pid, force);
  
  if (success) {
    printSuccess(`Process ${pid} killed successfully.`);
    return true;
  } else {
    printError(`Failed to kill process ${pid}. Try with -f flag.`);
    return false;
  }
}

export async function killByPort(port: number, force: boolean = false): Promise<boolean> {
  const portInfo = await getPortByNumber(port);
  
  if (!portInfo) {
    printError(`No process found on port ${port}`);
    return false;
  }
  
  console.log(chalk.cyan(`Port ${port} is being used by:`));
  console.log(`  Process: ${portInfo.process}`);
  console.log(`  PID:     ${portInfo.pid}`);
  console.log(`  Address: ${portInfo.address}:${port}`);
  console.log();
  
  return killByPid(portInfo.pid, force);
}

export async function killInteractive(): Promise<void> {
  const { identifier, force } = await inquirer.prompt([
    {
      type: 'input',
      name: 'identifier',
      message: 'Enter PID or port number to kill:'
    },
    {
      type: 'confirm',
      name: 'force',
      message: 'Force kill (SIGKILL)?',
      default: false
    }
  ]);
  
  const id = identifier.trim();
  
  if (!id) {
    printError('No identifier provided');
    return;
  }
  
  const num = parseInt(id, 10);
  
  if (isNaN(num)) {
    printError('Please enter a valid PID or port number');
    return;
  }
  
  if (id.length <= 5 && num <= 65535) {
    await killByPort(num, force);
  } else {
    await killByPid(num, force);
  }
}
