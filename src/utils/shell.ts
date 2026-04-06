import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });
    return { stdout, stderr };
  } catch (error: any) {
    return { stdout: error.stdout || '', stderr: error.stderr || error.message };
  }
}

export async function killProcess(pid: number, force: boolean = false): Promise<boolean> {
  try {
    const signal = force ? 'SIGKILL' : 'SIGTERM';
    const { stderr } = await runCommand(`kill -${signal} ${pid} 2>&1`);
    return stderr === '';
  } catch {
    return false;
  }
}

export async function getProcessName(pid: number): Promise<string> {
  const { stdout } = await runCommand(`ps -p ${pid} -o comm= 2>/dev/null || echo "unknown"`);
  return stdout.trim();
}
