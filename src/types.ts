export interface PortInfo {
  port: number;
  protocol: string;
  process: string;
  pid: number;
  address: string;
  state: string;
  name?: string;
}

export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
  pid: number;
  process: string;
}

export interface NetworkInterface {
  name: string;
  rx: string;
  tx: string;
  rxBytes: number;
  txBytes: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  available: number;
  usedPercent: number;
  swapTotal: number;
  swapUsed: number;
  swapFree: number;
}

export interface CpuInfo {
  core: number;
  model: string;
  speed: number;
  usage: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  memRss: number;
  state: string;
  uptime: number;
  command: string;
}

export interface DiskInfo {
  fs: string;
  mount: string;
  type: string;
  size: number;
  used: number;
  available: number;
  usePercent: number;
}

export interface SystemStats {
  ports: PortInfo[];
  network: {
    connections: NetworkConnection[];
    interfaces: NetworkInterface[];
  };
  memory: MemoryInfo;
  cpu: {
    count: number;
    model: string;
    usage: number;
  };
  disks: DiskInfo[];
}
