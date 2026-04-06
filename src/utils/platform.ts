import * as os from 'os';

export type Platform = 'darwin' | 'linux' | 'win32';

export function getPlatform(): Platform {
  return os.platform() as Platform;
}

export function isMac(): boolean {
  return getPlatform() === 'darwin';
}

export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

export function clearScreen(): void {
  process.stdout.write('\x1B[2J\x1B[0f');
}

export function moveCursor(x: number, y: number): void {
  process.stdout.write(`\x1B[${y};${x}H`);
}
