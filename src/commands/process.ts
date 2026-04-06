import * as si from 'systeminformation';
import { ProcessInfo } from '../types';
import { createTable, printHeader, printFooter, colorCpu, colorMemory } from '../utils/table';
import { formatUptime, formatBytes } from '../utils/platform';
import chalk from 'chalk';

export async function getProcessTree(): Promise<Map<number, ProcessInfo[]>> {
  const processes = await si.processes();
  
  const tree = new Map<number, ProcessInfo[]>();
  
  for (const proc of processes.list) {
    if (proc.pid > 0) {
      const parentPid = (proc as any).parentPid || 1;
      if (!tree.has(parentPid)) {
        tree.set(parentPid, []);
      }
      tree.get(parentPid)!.push({
        pid: proc.pid,
        name: proc.name,
        cpu: proc.cpu || 0,
        memory: proc.mem || 0,
        memRss: proc.memRss || 0,
        state: proc.state,
        uptime: (proc as any).uptime || 0,
        command: proc.command || proc.name
      });
    }
  }
  
  return tree;
}

export async function printProcessTree(maxDepth: number = 3): Promise<void> {
  const processes = await si.processes();
  const tree = await getProcessTree();
  
  printHeader('process tree');
  
  function printNode(pid: number, depth: number, prefix: string): void {
    if (depth > maxDepth) return;
    
    const children = tree.get(pid) || [];
    if (children.length === 0) return;
    
    children.sort((a, b) => b.cpu - a.cpu).forEach((proc, index) => {
      const isLast = index === children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      
      const indent = '  '.repeat(depth);
      const cpuColor = proc.cpu > 50 ? chalk.red : proc.cpu > 20 ? chalk.yellow : chalk.green;
      
      console.log(
        chalk.dim(`${indent}${prefix}${connector}`) +
        chalk.white(`${proc.name} `) +
        chalk.dim(`(PID: ${proc.pid})`) +
        chalk.dim(` CPU: ${cpuColor(proc.cpu.toFixed(1))}%`) +
        chalk.dim(` MEM: ${colorMemory(Math.round(proc.memRss / 1024 / 1024))}`)
      );
      
      printNode(proc.pid, depth + 1, childPrefix);
    });
  }
  
  printNode(1, 0, '');
  
  const total = processes.all;
  printFooter(`${total} total processes`);
}

export async function printProcessesDetailed(sortBy: 'cpu' | 'memory' = 'cpu'): Promise<void> {
  const processes = await getProcesses(sortBy);
  
  printHeader(`processes (sorted by ${sortBy})`);
  
  const table = createTable({
    head: ['PID', 'NAME', 'CPU%', 'RSS', 'STATE', 'UPTIME'],
    colWidths: [8, 25, 8, 12, 12, 12]
  });
  
  const topProcesses = processes.slice(0, 20);
  
  for (const proc of topProcesses) {
    const memMB = Math.round((proc.memRss || 0) / 1024 / 1024);
    table.push([
      proc.pid.toString(),
      (proc.name || 'unknown').substring(0, 23),
      colorCpu(proc.cpu || 0),
      colorMemory(memMB),
      (proc.state || 'unknown').substring(0, 10),
      formatUptime(proc.uptime || 0)
    ]);
  }
  
  console.log(table.toString());
  
  const totalCpu = topProcesses.reduce((sum, p) => sum + (p.cpu || 0), 0);
  const totalMem = formatBytes(topProcesses.reduce((sum, p) => sum + (p.memRss || 0), 0));
  
  printFooter(`${processes.length} processes  ·  Top 20 shown  ·  CPU: ${totalCpu.toFixed(1)}%  ·  MEM: ${totalMem}`);
}

export async function getProcesses(sortBy: 'cpu' | 'memory' = 'cpu'): Promise<ProcessInfo[]> {
  const processes = await si.processes();
  
  const infos: ProcessInfo[] = processes.list
    .filter(p => p.pid > 0)
    .map(p => ({
      pid: p.pid,
      name: p.name,
      cpu: p.cpu || 0,
      memory: p.mem || 0,
      memRss: p.memRss || 0,
      state: p.state,
      uptime: (p as any).uptime || 0,
      command: p.command || p.name
    }));
  
  if (sortBy === 'cpu') {
    return infos.sort((a, b) => b.cpu - a.cpu);
  } else {
    return infos.sort((a, b) => b.memRss - a.memRss);
  }
}
