import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { prepareWebUi, spawnWebUi } from './web';

export async function start(): Promise<void> {
  prepareWebUi();

  const logPath = path.resolve('.skiv/orchestrator.log');
  const logStream = createWriteStream(logPath, { flags: 'a' });

  const cliPath = path.resolve(__dirname, '../cli.js');
  const orchestrator = spawn('node', [cliPath, 'run'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  orchestrator.stdout?.pipe(logStream);
  orchestrator.stderr?.pipe(logStream);
  orchestrator.on('close', (code) => {
    logStream.end();
    if (code !== 0 && code !== null) {
      console.error(`\n[skiv] orchestrator exited unexpectedly (code=${code}). Check ${logPath}`);
    }
  });

  const webPort = process.env.PORT ?? '3000';
  const webProc = spawnWebUi(webPort);
  webProc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n[skiv] web UI exited unexpectedly (code=${code})`);
    }
  });

  console.log(`[skiv] orchestrator started (log: ${logPath})`);
  console.log(`[skiv] web UI started at http://localhost:${webPort}`);

  const mcpConfigPath = path.resolve('.skiv/mcp.json');
  const claude = spawn('claude', ['--mcp-config', mcpConfigPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    claude.on('close', (code) => {
      orchestrator.kill();
      webProc.kill();
      if (code === 0 || code === null) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
  });
}
