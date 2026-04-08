import Table from 'cli-table3';
import chalk from 'chalk';

export interface TableConfig {
  head: string[];
  colWidths?: number[];
}

export function createTable(config: TableConfig): any {
  const validColWidths = config.colWidths?.map(w => Math.max(5, w)) || undefined;
  return new Table({
    head: config.head.map(h => chalk.cyan.bold(h)),
    colWidths: validColWidths
  });
}

export function colorStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'listen' || s === 'listening' || s === 'established' || s === 'healthy' || s === 'up') {
    return chalk.green('●');
  }
  if (s === 'time_wait' || s === 'time-wait' || s === 'close_wait' || s === 'close-wait') {
    return chalk.yellow('●');
  }
  if (s === 'closed' || s === 'down' || s === 'zombie') {
    return chalk.red('●');
  }
  return chalk.white('●');
}

export function colorPercent(percent: number): string {
  if (percent < 50) return chalk.green(`${percent.toFixed(1)}%`);
  if (percent < 80) return chalk.yellow(`${percent.toFixed(1)}%`);
  return chalk.red(`${percent.toFixed(1)}%`);
}

export function colorCpu(cpu: number): string {
  if (cpu < 10) return chalk.green(cpu.toFixed(1));
  if (cpu < 50) return chalk.yellow(cpu.toFixed(1));
  return chalk.red(cpu.toFixed(1));
}

export function colorMemory(mem: number): string {
  if (mem < 100) return chalk.green(`${mem}MB`);
  if (mem < 500) return chalk.yellow(`${mem}MB`);
  return chalk.red(`${mem}MB`);
}

export function printHeader(title: string): void {
  const width = 50;
  const prefix = ' sysview - ';
  const fullTitle = prefix + title;
  const padding = Math.max(0, Math.floor((width - fullTitle.length) / 2));
  const rightPadding = Math.max(0, width - fullTitle.length - padding);
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + ' '.repeat(padding) + chalk.bold.white(fullTitle) + ' '.repeat(rightPadding) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();
}

export function printFooter(message: string): void {
  console.log();
  console.log(chalk.dim(message));
}

export function printError(message: string): void {
  console.log(chalk.red(`Error: ${message}`));
}

export function printSuccess(message: string): void {
  console.log(chalk.green(message));
}
