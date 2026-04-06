import * as si from 'systeminformation';
import { ProcessInfo } from '../types';
import { createTable, printHeader, printFooter, colorCpu, colorMemory } from '../utils/table';
import { formatUptime, formatBytes } from '../utils/platform';

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

export async function printProcesses(sortBy: 'cpu' | 'memory' = 'cpu'): Promise<void> {
  const processes = await getProcesses(sortBy);
  
  printHeader(`processes (sorted by ${sortBy})`);
  
  const table = createTable({
    head: ['PID', 'NAME', 'CPU%', 'MEM%', 'RSS', 'STATE', 'UPTIME'],
    colWidths: [10, 20, 10, 10, 12, 10, 15]
  });
  
  const topProcesses = processes.slice(0, 20);
  
  for (const proc of topProcesses) {
    table.push([
      proc.pid.toString(),
      proc.name.length > 18 ? proc.name.substring(0, 15) + '...' : proc.name,
      colorCpu(proc.cpu),
      colorMemory(Math.round(proc.memRss / 1024 / 1024)),
      formatBytes(proc.memRss),
      proc.state,
      formatUptime(proc.uptime)
    ]);
  }
  
  console.log(table.toString());
  
  const totalCpu = topProcesses.reduce((sum, p) => sum + p.cpu, 0);
  const totalMem = formatBytes(topProcesses.reduce((sum, p) => sum + p.memRss, 0));
  
  printFooter(`${processes.length} processes  ·  Top 20 shown  ·  CPU: ${totalCpu.toFixed(1)}%  ·  MEM: ${totalMem}`);
}

export async function findProcessByPid(pid: number): Promise<ProcessInfo | null> {
  const processes = await getProcesses();
  return processes.find(p => p.pid === pid) || null;
}
