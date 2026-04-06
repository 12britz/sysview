import * as si from 'systeminformation';
import { NetworkConnection, NetworkInterface } from '../types';
import { createTable, printHeader, printFooter, colorStatus } from '../utils/table';
import { formatBytes } from '../utils/platform';
import chalk from 'chalk';

export async function getNetworkConnections(): Promise<NetworkConnection[]> {
  const sockets = await si.networkConnections();
  
  return sockets.map((s: any) => ({
    protocol: s.protocol,
    localAddress: s.localAddress,
    localPort: s.localPort as number,
    remoteAddress: s.peerAddress || '',
    remotePort: s.peerPort as number,
    state: s.state,
    pid: s.pid || 0,
    process: s.name || 'unknown'
  }));
}

export async function getNetworkInterfaces(): Promise<NetworkInterface[]> {
  const stats = await si.networkStats();
  
  return stats.map(s => ({
    name: s.iface,
    rx: formatBytes(s.rx_bytes),
    tx: formatBytes(s.tx_bytes),
    rxBytes: s.rx_bytes,
    txBytes: s.tx_bytes
  }));
}

export async function printNetwork(): Promise<void> {
  const [connections, interfaces] = await Promise.all([
    getNetworkConnections(),
    getNetworkInterfaces()
  ]);
  
  printHeader('network');
  
  console.log(chalk.cyan('Active Connections:'));
  const connTable = createTable({
    head: ['PROTOCOL', 'LOCAL', 'REMOTE', 'STATE', 'PID'],
    colWidths: [10, 25, 25, 15, 10]
  });
  
  for (const conn of connections.slice(0, 20)) {
    connTable.push([
      conn.protocol,
      `${conn.localAddress}:${conn.localPort}`,
      `${conn.remoteAddress}:${conn.remotePort}`,
      colorStatus(conn.state) + ' ' + conn.state,
      conn.pid.toString()
    ]);
  }
  console.log(connTable.toString());
  
  console.log();
  console.log(chalk.cyan('Interfaces:'));
  const intTable = createTable({
    head: ['INTERFACE', 'RX', 'TX'],
    colWidths: [20, 15, 15]
  });
  
  for (const int of interfaces) {
    intTable.push([int.name, int.rx, int.tx]);
  }
  console.log(intTable.toString());
  
  printFooter(`${connections.length} connections  ·  ${interfaces.length} interfaces`);
}
