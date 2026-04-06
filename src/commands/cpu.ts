import * as si from 'systeminformation';
import { CpuInfo } from '../types';
import { createTable, printHeader, printFooter, colorPercent } from '../utils/table';
import chalk from 'chalk';

export async function getCpuUsage(): Promise<number> {
  const load = await si.currentLoad();
  return load.currentLoad;
}

export async function printCpu(): Promise<void> {
  const [cpu, load, processes] = await Promise.all([
    si.cpu(),
    si.currentLoad(),
    si.processes()
  ]);
  
  printHeader('cpu');
  
  const table = createTable({
    head: ['METRIC', 'VALUE'],
    colWidths: [30, 20]
  });
  
  table.push(['Model', cpu.brand]);
  table.push(['Cores', cpu.cores.toString()]);
  table.push(['Physical Cores', cpu.physicalCores.toString()]);
  table.push(['Speed', `${cpu.speed} GHz`]);
  table.push(['Current Load', colorPercent(load.currentLoad)]);
  table.push(['Running Processes', processes.all.toString()]);
  
  console.log(table.toString());
  
  const barWidth = 40;
  const filledWidth = Math.round((load.currentLoad / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;
  const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
  
  const colorBar = load.currentLoad < 50 ? chalk.green(bar) : 
                   load.currentLoad < 80 ? chalk.yellow(bar) : 
                   chalk.red(bar);
  
  console.log();
  console.log('Load: ' + colorBar + ' ' + colorPercent(load.currentLoad));
  
  console.log();
  console.log(chalk.cyan('Per-Core Usage:'));
  const coreTable = createTable({
    head: ['CORE', 'USAGE'],
    colWidths: [10, 50]
  });
  
  const coreLoads = load.cpus.map((c, i) => ({ core: i, load: c.load }));
  
  for (const core of coreLoads) {
    const coreWidth = Math.round((core.load / 100) * 40);
    const coreBar = '█'.repeat(coreWidth) + '░'.repeat(40 - coreWidth);
    const coreColorBar = core.load < 50 ? chalk.green(coreBar) : 
                         core.load < 80 ? chalk.yellow(coreBar) : 
                         chalk.red(coreBar);
    coreTable.push([`Core ${core.core}`, coreColorBar + ' ' + colorPercent(core.load)]);
  }
  
  console.log(coreTable.toString());
  
  printFooter(`${processes.all} processes running`);
}
