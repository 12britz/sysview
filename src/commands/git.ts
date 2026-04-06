import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface GitStatus {
  branch: string;
  isClean: boolean;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
}

interface GitBranch {
  name: string;
  current: boolean;
  ahead: number;
  behind: number;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

async function runGitCommand(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
    return stdout.trim();
  } catch (error: any) {
    return error.stdout || '';
  }
}

export async function getGitStatus(): Promise<GitStatus | null> {
  const cwd = process.cwd();
  const isGitRepo = await runGitCommand('git rev-parse --git-dir 2>/dev/null');
  
  if (!isGitRepo) {
    return null;
  }

  const branch = await runGitCommand('git branch --show-current');
  const statusOutput = await runGitCommand('git status --porcelain');
  
  const staged: string[] = [];
  const modified: string[] = [];
  const untracked: string[] = [];
  
  const lines = statusOutput.split('\n').filter(Boolean);
  for (const line of lines) {
    const indexStatus = line[0];
    const workTreeStatus = line[1];
    const file = line.substring(3);
    
    if (indexStatus === '?' && workTreeStatus === '?') {
      untracked.push(file);
    } else if (indexStatus === 'M' || indexStatus === 'A' || indexStatus === 'D') {
      staged.push(file);
    }
    if (workTreeStatus === 'M' || workTreeStatus === 'D') {
      modified.push(file);
    }
  }

  const aheadBehind = await runGitCommand('git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null');
  const [ahead = '0', behind = '0'] = aheadBehind.split('\t');

  return {
    branch: branch || 'HEAD',
    isClean: staged.length === 0 && modified.length === 0 && untracked.length === 0,
    ahead: parseInt(ahead) || 0,
    behind: parseInt(behind) || 0,
    staged,
    modified,
    untracked
  };
}

export async function getGitBranches(): Promise<GitBranch[]> {
  const output = await runGitCommand('git branch -vv');
  if (!output) return [];

  const branches: GitBranch[] = [];
  const lines = output.split('\n').filter(Boolean);
  
  for (const line of lines) {
    const isCurrent = line.startsWith('*');
    const parts = line.substring(2).trim().split(/\s+/);
    const name = parts[0];
    
    let ahead = 0, behind = 0;
    const match = line.match(/\[.*: ([0-9]+)/);
    if (match) {
      behind = parseInt(match[1]) || 0;
    }
    const aheadMatch = line.match(/\[.*([0-9]+)\]/);
    if (aheadMatch && !match) {
      ahead = parseInt(aheadMatch[1]) || 0;
    }
    
    branches.push({
      name,
      current: isCurrent,
      ahead,
      behind
    });
  }
  
  return branches;
}

export async function getGitLog(count: number = 10): Promise<GitCommit[]> {
  const output = await runGitCommand(`git log --pretty=format:"%h|%s|%an|%ar" -${count}`);
  if (!output) return [];

  const commits: GitCommit[] = [];
  const lines = output.split('\n').filter(Boolean);
  
  for (const line of lines) {
    const [hash, message, author, date] = line.split('|');
    commits.push({ hash, message, author, date });
  }
  
  return commits;
}

export async function printGitStatus(): Promise<void> {
  const status = await getGitStatus();
  
  if (!status) {
    console.log(chalk.yellow('Not a git repository'));
    return;
  }

  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git status'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  const branchColor = status.isClean ? chalk.green : chalk.yellow;
  console.log(`  ${chalk.dim('Branch:')} ${branchColor(status.branch)}`);
  
  if (status.ahead > 0 || status.behind > 0) {
    const aheadBehind: string[] = [];
    if (status.ahead > 0) aheadBehind.push(chalk.green(`↑${status.ahead}`));
    if (status.behind > 0) aheadBehind.push(chalk.red(`↓${status.behind}`));
    console.log(`  ${chalk.dim('Sync:')} ${aheadBehind.join(' ')}`);
  }
  console.log();

  if (status.isClean) {
    console.log(chalk.green('  ✓ Working tree is clean'));
  } else {
    if (status.staged.length > 0) {
      console.log(chalk.green(`  Staged (${status.staged.length}):`));
      status.staged.slice(0, 5).forEach(f => console.log(chalk.dim(`    ${chalk.green('+')} ${f}`)));
      if (status.staged.length > 5) console.log(chalk.dim(`    ... and ${status.staged.length - 5} more`));
    }
    
    if (status.modified.length > 0) {
      console.log(chalk.red(`  Modified (${status.modified.length}):`));
      status.modified.slice(0, 5).forEach(f => console.log(chalk.dim(`    ${chalk.red('~')} ${f}`)));
      if (status.modified.length > 5) console.log(chalk.dim(`    ... and ${status.modified.length - 5} more`));
    }
    
    if (status.untracked.length > 0) {
      console.log(chalk.cyan(`  Untracked (${status.untracked.length}):`));
      status.untracked.slice(0, 5).forEach(f => console.log(chalk.dim(`    ${chalk.cyan('?')} ${f}`)));
      if (status.untracked.length > 5) console.log(chalk.dim(`    ... and ${status.untracked.length - 5} more`));
    }
  }
  console.log();
}

export async function printGitBranches(): Promise<void> {
  const branches = await getGitBranches();
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git branches'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  for (const branch of branches) {
    const marker = branch.current ? chalk.green('●') : chalk.dim('○');
    const name = branch.current ? chalk.bold.white(branch.name) : chalk.white(branch.name);
    const sync = [];
    if (branch.ahead > 0) sync.push(chalk.green(`↑${branch.ahead}`));
    if (branch.behind > 0) sync.push(chalk.red(`↓${branch.behind}`));
    
    console.log(`  ${marker} ${name} ${chalk.dim(sync.join(' '))}`);
  }
  console.log();
}

export async function printGitLog(count: number = 10): Promise<void> {
  const commits = await getGitLog(count);
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(` git log (${count} commits)`.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  for (const commit of commits) {
    const shortHash = chalk.green(commit.hash);
    const author = chalk.dim(commit.author);
    const date = chalk.dim(commit.date);
    const message = commit.message;
    
    console.log(`  ${shortHash} ${chalk.white(message)}`);
    console.log(chalk.dim(`      ${author} · ${date}`));
    console.log();
  }
}

export async function printGitInfo(): Promise<void> {
  const [status, branches, log] = await Promise.all([
    getGitStatus(),
    getGitBranches(),
    getGitLog(5)
  ]);

  if (!status) {
    console.log(chalk.yellow('Not a git repository'));
    return;
  }

  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  console.log(chalk.cyan('Branch:'));
  const currentBranch = branches.find(b => b.current);
  if (currentBranch) {
    console.log(`  ${chalk.green('●')} ${chalk.bold.white(currentBranch.name)}`);
    if (currentBranch.ahead > 0 || currentBranch.behind > 0) {
      const sync = [];
      if (currentBranch.ahead > 0) sync.push(chalk.green(`↑${currentBranch.ahead}`));
      if (currentBranch.behind > 0) sync.push(chalk.red(`↓${currentBranch.behind}`));
      console.log(chalk.dim(`    Sync: ${sync.join(' ')}`));
    }
  }
  console.log();

  console.log(chalk.cyan('Status:'));
  if (status.isClean) {
    console.log(chalk.green('  ✓ Clean'));
  } else {
    const changes = [];
    if (status.staged.length > 0) changes.push(chalk.green(`+${status.staged.length}`));
    if (status.modified.length > 0) changes.push(chalk.red(`~${status.modified.length}`));
    if (status.untracked.length > 0) changes.push(chalk.cyan(`?${status.untracked.length}`));
    console.log(`  ${changes.join(' ')}`);
  }
  console.log();

  console.log(chalk.cyan('Recent commits:'));
  for (const commit of log.slice(0, 5)) {
    console.log(`  ${chalk.green(commit.hash)} ${chalk.white(commit.message.substring(0, 35))}`);
  }
  console.log();
}

export async function printGitRemotes(): Promise<void> {
  const output = await runGitCommand('git remote -v');
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git remotes'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  if (!output) {
    console.log(chalk.dim('  No remotes configured'));
  } else {
    const lines = output.split('\n').filter(Boolean);
    for (const line of lines) {
      const [name, url, action] = line.split(/\s+/);
      console.log(`  ${chalk.green(name)}  ${chalk.dim(url)} ${chalk.dim(`(${action})`)}`);
    }
  }
  console.log();
}

export async function printGitStash(): Promise<void> {
  const list = await runGitCommand('git stash list');
  const status = await getGitStatus();
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git stash'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  if (!list) {
    console.log(chalk.dim('  No stashes'));
  } else {
    const lines = list.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/(stash@\{[0-9]+\}): (.*)/);
      if (match) {
        console.log(`  ${chalk.yellow(match[1])}  ${chalk.white(match[2])}`);
      } else {
        console.log(`  ${chalk.yellow(line)}`);
      }
    }
  }
  console.log();
  
  if (status && !status.isClean) {
    console.log(chalk.dim('  Use --push to stash changes or --pop to apply'));
  }
}

export async function printGitContributors(): Promise<void> {
  const output = await runGitCommand('git shortlog -sne --all');
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git contributors'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  if (!output) {
    console.log(chalk.dim('  No commits'));
  } else {
    const lines = output.split('\n').filter(Boolean).slice(0, 10);
    for (const line of lines) {
      const match = line.trim().match(/^\s*([0-9]+)\s+(.*)$/);
      if (match) {
        const [, count, author] = match;
        console.log(`  ${chalk.green(count.padStart(5))}  ${chalk.white(author)}`);
      } else {
        console.log(chalk.dim(`  ${line}`));
      }
    }
    if (output.split('\n').length > 10) {
      console.log(chalk.dim('  ... and more'));
    }
  }
  console.log();
}

export async function printGitTags(): Promise<void> {
  const output = await runGitCommand('git tag -l --sort=-v:refname');
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git tags'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  if (!output) {
    console.log(chalk.dim('  No tags'));
  } else {
    const tags = output.split('\n').filter(Boolean).slice(0, 15);
    for (const tag of tags) {
      console.log(`  ${chalk.magenta(tag)}`);
    }
    if (output.split('\n').length > 15) {
      console.log(chalk.dim('  ... and more'));
    }
  }
  console.log();
}

export async function printGitDiff(staged: boolean = false): Promise<void> {
  const cmd = staged ? 'git diff --cached --stat' : 'git diff --stat';
  const output = await runGitCommand(cmd);
  const status = await getGitStatus();
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(` git diff ${staged ? '(staged)' : ''}`.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  if (!output || output === '') {
    console.log(chalk.dim('  No changes'));
  } else {
    console.log(chalk.dim(output));
  }
  console.log();
}

export async function printGitShortlog(): Promise<void> {
  const output = await runGitCommand('git shortlog -sn --all');
  
  const width = 60;
  console.log(chalk.bold.cyan('┌' + '─'.repeat(width) + '┐'));
  console.log(chalk.bold.cyan('│') + chalk.bold.white(' git shortlog'.padEnd(width)) + chalk.bold.cyan('│'));
  console.log(chalk.bold.cyan('└' + '─'.repeat(width) + '┘'));
  console.log();

  if (!output) {
    console.log(chalk.dim('  No commits'));
  } else {
    const lines = output.split('\n').filter(Boolean).slice(0, 15);
    for (const line of lines) {
      const match = line.match(/^\s*([0-9]+)\s+(.*)$/);
      if (match) {
        const [, count, message] = match;
        console.log(`  ${chalk.green(count.padStart(4))}  ${chalk.white(message)}`);
      } else {
        console.log(chalk.dim(`  ${line}`));
      }
    }
  }
  console.log();
}
