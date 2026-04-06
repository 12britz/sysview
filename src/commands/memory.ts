import * as si from 'systeminformation';
import { MemoryInfo } from '../types';
import { createTable, printHeader, printFooter, colorPercent } from '../utils/table';
import { formatBytes } from '../utils/platform';
import chalk from 'chalk';

export async function getMemory(): Promise<MemoryInfo> {
  const mem = await si.mem();
  
  return {
    total: mem.total,
    used: mem.used,
    free: mem.free,
    available: mem.available,
    usedPercent: (mem.used / mem.total) * 100,
    swapTotal: mem.swaptotal,
    swapUsed: mem.swapused,
    swapFree: mem.swapfree
  };
}

export async function printMemory(): Promise<void> {
  const mem = await getMemory();
  
  printHeader('memory');
  
  const table = createTable({
    head: ['TYPE', 'USED', 'TOTAL', 'FREE', 'USAGE'],
    colWidths: [20, 15, 15, 15, 10]
  });
  
  table.push([
    'Physical Memory',
    formatBytes(mem.used),
    formatBytes(mem.total),
    formatBytes(mem.free),
    colorPercent(mem.usedPercent)
  ]);
  
  table.push([
    'Available',
    formatBytes(mem.available),
    formatBytes(mem.total),
    '-',
    colorPercent((mem.used / mem.total) * 100)
  ]);
  
  if (mem.swapTotal > 0) {
    const swapPercent = (mem.swapUsed / mem.swapTotal) * 100;
    table.push([
      'Swap',
      formatBytes(mem.swapUsed),
      formatBytes(mem.swapTotal),
      formatBytes(mem.swapFree),
      colorPercent(swapPercent)
    ]);
  }
  
  console.log(table.toString());
  
  const barWidth = 40;
  const filledWidth = Math.round((mem.usedPercent / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
  const colorBar = mem.usedPercent < 50 ? chalk.green(bar) : 
                   mem.usedPercent < 80 ? chalk.yellow(bar) : 
                   chalk.red(bar);
  
  console.log();
  console.log(colorBar + ' ' + colorPercent(mem.usedPercent));
  console.log();
  
  printFooter(formatBytes(mem.available) + ' available');
}
