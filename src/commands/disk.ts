import * as si from 'systeminformation';
import { DiskInfo } from '../types';
import { createTable, printHeader, printFooter, colorPercent } from '../utils/table';
import { formatBytes } from '../utils/platform';
import chalk from 'chalk';

export async function getDisks(): Promise<DiskInfo[]> {
  const disks = await si.fsSize();
  
  return disks.map(d => ({
    fs: d.fs,
    mount: d.mount,
    type: d.type,
    size: d.size,
    used: d.used,
    available: d.available,
    usePercent: d.use
  }));
}

export async function printDisk(): Promise<void> {
  const disks = await getDisks();
  
  printHeader('disk');
  
  const table = createTable({
    head: ['FILESYSTEM', 'MOUNT', 'SIZE', 'USED', 'AVAILABLE', 'USE%'],
    colWidths: [25, 15, 12, 12, 12, 8]
  });
  
  for (const disk of disks) {
    table.push([
      disk.fs.length > 23 ? disk.fs.substring(0, 20) + '...' : disk.fs,
      disk.mount,
      formatBytes(disk.size),
      formatBytes(disk.used),
      formatBytes(disk.available),
      colorPercent(disk.usePercent)
    ]);
  }
  
  console.log(table.toString());
  
  for (const disk of disks) {
    const barWidth = 40;
    const filledWidth = Math.round((disk.usePercent / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
    
    const colorBar = disk.usePercent < 50 ? chalk.green(bar) : 
                     disk.usePercent < 80 ? chalk.yellow(bar) : 
                     chalk.red(bar);
    
    console.log();
    console.log(chalk.dim(disk.mount) + ' ' + colorBar + ' ' + colorPercent(disk.usePercent));
    console.log(chalk.dim(`  ${formatBytes(disk.used)} / ${formatBytes(disk.size)} (${formatBytes(disk.available)} free)`));
  }
  
  printFooter(`${disks.length} filesystems`);
}
