import * as si from 'systeminformation';
import { PortInfo } from '../types';
import { createTable, printHeader, printFooter, colorStatus } from '../utils/table';
import { formatBytes } from '../utils/platform';

export async function getPorts(): Promise<PortInfo[]> {
  const sockets = await si.networkConnections();
  
  const ports: PortInfo[] = [];
  const seen = new Set<string>();
  
  for (const socket of sockets) {
    if (socket.state === 'LISTEN') {
      const key = `${socket.localAddress}:${socket.localPort}`;
      if (seen.has(key)) continue;
      seen.add(key);
      
      ports.push({
        port: Number(socket.localPort),
        protocol: socket.protocol,
        process: (socket as any).name || 'unknown',
        pid: socket.pid || 0,
        address: socket.localAddress,
        state: socket.state,
        name: (socket as any).name
      });
    }
  }
  
  return ports.sort((a, b) => a.port - b.port);
}

export async function printPorts(): Promise<void> {
  const ports = await getPorts();
  
  printHeader('ports');
  
  const table = createTable({
    head: ['PORT', 'PROCESS', 'PID', 'ADDRESS', 'STATUS'],
    colWidths: [10, 20, 10, 20, 10]
  });
  
  for (const port of ports) {
    table.push([
      `:${port.port}`,
      port.process.length > 18 ? port.process.substring(0, 15) + '...' : port.process,
      port.pid.toString(),
      port.address,
      colorStatus(port.state) + ' ' + port.state
    ]);
  }
  
  console.log(table.toString());
  printFooter(`${ports.length} ports listening  ·  q to quit`);
}

export async function getPortByNumber(port: number): Promise<PortInfo | null> {
  const ports = await getPorts();
  return ports.find(p => p.port === port) || null;
}
