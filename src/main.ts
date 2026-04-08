#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
  printPorts,
  printNetwork,
  printMemory,
  printCpu,
  printDisk,
  printProcesses,
  killByPid,
  killByPort,
  killInteractive
} from './commands';
import { watchMode } from './commands/watch';
import { printProcessTree, printProcessesDetailed } from './commands/process';
import { topMode } from './commands/top';
import { 
  printGitStatus, 
  printGitBranches, 
  printGitLog, 
  printGitInfo,
  printGitRemotes,
  printGitStash,
  printGitContributors,
  printGitTags,
  printGitDiff,
  printGitShortlog
} from './commands/git';
import { getPlatform } from './utils/platform';

const program = new Command();

program
  .name('sysview')
  .description('A beautiful CLI tool for system monitoring')
  .version('1.0.0');

program
  .command('ports')
  .description('Show listening ports')
  .action(async () => {
    try {
      await printPorts();
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('network')
  .description('Show network connections and interfaces')
  .action(async () => {
    try {
      await printNetwork();
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('memory')
  .alias('mem')
  .description('Show memory usage')
  .action(async () => {
    try {
      await printMemory();
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('cpu')
  .description('Show CPU usage')
  .action(async () => {
    try {
      await printCpu();
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('disk')
  .description('Show disk usage')
  .action(async () => {
    try {
      await printDisk();
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('ps')
  .description('Show running processes')
  .option('-c, --cpu', 'Sort by CPU usage')
  .option('-m, --memory', 'Sort by memory usage')
  .action(async (options) => {
    try {
      const sortBy = options.memory ? 'memory' : 'cpu';
      await printProcesses(sortBy);
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('kill')
  .description('Kill a process by PID or port')
  .argument('<identifier>', 'PID or port number')
  .option('-f, --force', 'Force kill (SIGKILL)')
  .action(async (identifier, options) => {
    try {
      const num = parseInt(identifier, 10);
      if (isNaN(num)) {
        console.error(chalk.red('Please provide a valid PID or port number'));
        process.exit(1);
      }
      
      if (num <= 65535) {
        await killByPort(num, options.force);
      } else {
        await killByPid(num, options.force);
      }
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch mode - real-time dashboard')
  .option('-i, --interval <ms>', 'Refresh interval in milliseconds', '2000')
  .option('-s, --start', 'Start watching immediately')
  .action(async (options) => {
    if (options.start) {
      try {
        const interval = parseInt(options.interval, 10);
        await watchMode(interval);
      } catch (err) {
        console.error(chalk.red('Error:', err));
        process.exit(1);
      }
    } else {
      console.log();
      console.log(chalk.bold.cyan('╔══════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white('                    WATCH MODE') + chalk.bold.cyan('                            ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════╝'));
      console.log();
      console.log(chalk.cyan('Real-time monitoring of:'));
      console.log(chalk.dim('  • CPU usage'));
      console.log(chalk.dim('  • Memory usage'));
      console.log(chalk.dim('  • Listening ports'));
      console.log(chalk.dim('  • Network interfaces'));
      console.log(chalk.dim('  • Disk usage'));
      console.log();
      console.log(chalk.cyan('Options:'));
      console.log(chalk.green('  -i, --interval <ms>') + '  Refresh interval (default: 2000ms)');
      console.log(chalk.green('  -s, --start              ') + '  Start watching immediately');
      console.log();
      console.log(chalk.dim('Examples:'));
      console.log(chalk.dim('  sysview watch              # Preview watch mode'));
      console.log(chalk.dim('  sysview watch --start     # Start watching'));
      console.log(chalk.dim('  sysview watch -i 1000 -s  # Watch with 1s refresh'));
      console.log();
      console.log(chalk.dim('Press q to quit while watching'));
      console.log();
    }
  });

program
  .command('process')
  .alias('proc')
  .description('Show process tree')
  .option('-t, --tree', 'Show process tree view')
  .option('-l, --list', 'Show process list')
  .option('-c, --cpu', 'Sort by CPU')
  .option('-m, --memory', 'Sort by memory')
  .action(async (options) => {
    try {
      if (options.tree) {
        await printProcessTree();
      } else if (options.list) {
        const sortBy = options.memory ? 'memory' : 'cpu';
        await printProcessesDetailed(sortBy);
      } else {
        console.log();
        console.log(chalk.bold.cyan('╔══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║') + chalk.bold.white('                    PROCESS') + chalk.bold.cyan('                                 ║'));
        console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════╝'));
        console.log();
        console.log(chalk.cyan('Process management:'));
        console.log();
        console.log(chalk.green('  -t, --tree         ') + 'Show process tree view');
        console.log(chalk.green('  -l, --list         ') + 'Show process list');
        console.log(chalk.green('  -c, --cpu          ') + 'Sort by CPU usage (default)');
        console.log(chalk.green('  -m, --memory       ') + 'Sort by memory usage');
        console.log();
        console.log(chalk.dim('Examples:'));
        console.log(chalk.dim('  sysview process            # Show this help'));
        console.log(chalk.dim('  sysview process --tree    # Show process tree'));
        console.log(chalk.dim('  sysview process -l -m     # Show list sorted by memory'));
        console.log();
      }
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('top')
  .description('Interactive process monitor')
  .option('-i, --interval <ms>', 'Refresh interval', '2000')
  .option('-n, --num <n>', 'Number of processes to show', '15')
  .action(async (options) => {
    try {
      const interval = parseInt(options.interval, 10);
      const num = parseInt(options.num, 10);
      await topMode(interval, num);
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('git')
  .description('Git repository info')
  .option('-s, --status', 'Show git status')
  .option('-b, --branches', 'Show branches')
  .option('-l, --log [n]', 'Show recent commits')
  .option('-a, --all', 'Show all git info')
  .option('-r, --remotes', 'Show remotes')
  .option('--stash', 'Show stash list')
  .option('-c, --contributors', 'Show contributors')
  .option('-t, --tags', 'Show tags')
  .option('-d, --diff', 'Show diff')
  .option('--staged', 'Show staged diff')
  .option('--shortlog', 'Show shortlog')
  .action(async (options) => {
    try {
      if (options.status) {
        await printGitStatus();
      } else if (options.branches) {
        await printGitBranches();
      } else if (options.remotes) {
        await printGitRemotes();
      } else if (options.stash) {
        await printGitStash();
      } else if (options.contributors) {
        await printGitContributors();
      } else if (options.tags) {
        await printGitTags();
      } else if (options.diff) {
        await printGitDiff(false);
      } else if (options.staged) {
        await printGitDiff(true);
      } else if (options.shortlog) {
        await printGitShortlog();
      } else if (options.log) {
        const count = typeof options.log === 'number' ? options.log : 10;
        await printGitLog(count);
      } else if (options.all) {
        await printGitInfo();
      } else {
        await printGitStatus();
      }
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .alias('dash')
  .description('Show full dashboard (ports, network, memory, cpu, disk)')
  .action(async () => {
    try {
      console.log();
      console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'));
      console.log(chalk.bold.cyan('                    SYSVIEW DASHBOARD'));
      console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'));
      console.log(chalk.dim(`Platform: ${getPlatform()} | Press Ctrl+C to exit`));
      console.log();
      
      await Promise.all([
        printPorts(),
        printNetwork(),
        printMemory(),
        printCpu(),
        printDisk()
      ]);
    } catch (err) {
      console.error(chalk.red('Error:', err));
      process.exit(1);
    }
  });

program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.dim('\nAvailable commands:'));
  console.log('  ports     Show listening ports');
  console.log('  network   Show network connections');
  console.log('  memory    Show memory usage');
  console.log('  cpu       Show CPU usage');
  console.log('  disk      Show disk usage');
  console.log('  ps        Show processes');
  console.log('  process   Show process tree');
  console.log('  top       Interactive process monitor');
  console.log('  git       Git repository info');
  console.log('  kill      Kill a process');
  console.log('  watch     Real-time dashboard');
  console.log('  dashboard Full system overview');
  console.log();
  process.exit(1);
});

if (process.argv.length === 2) {
  console.log();
  console.log(chalk.bold.cyan('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('                    SYSVIEW') + chalk.bold.cyan('                               ║'));
  console.log(chalk.bold.cyan('║') + chalk.dim('  A beautiful CLI tool for system monitoring              ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════╝'));
  console.log();
  console.log(chalk.cyan('Available commands:'));
  console.log();
  console.log(chalk.green('  ports     ') + 'Show listening ports');
  console.log(chalk.green('  network   ') + 'Show network connections and interfaces');
  console.log(chalk.green('  memory    ') + 'Show memory usage (alias: mem)');
  console.log(chalk.green('  cpu       ') + 'Show CPU usage');
  console.log(chalk.green('  disk      ') + 'Show disk usage');
  console.log(chalk.green('  ps        ') + 'Show running processes (--cpu, --memory)');
  console.log(chalk.green('  process   ') + 'Show process tree (alias: proc)');
  console.log(chalk.green('  top       ') + 'Interactive process monitor');
  console.log(chalk.green('  git       ') + 'Git status, branches, commits');
  console.log(chalk.green('  kill      ') + 'Kill a process by PID or port');
  console.log(chalk.green('  watch     ') + 'Real-time dashboard (--interval <ms>)');
  console.log(chalk.green('  dashboard ') + 'Show full dashboard (alias: dash)');
  console.log();
  console.log(chalk.dim('  Use --help with any command for more options'));
  console.log();
} else {
  program.parse(process.argv);
}
