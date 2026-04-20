import { spawn } from 'child_process';
import * as path from 'path';

export async function planner(): Promise<void> {
  const mcpConfigPath = path.resolve('.skiv/mcp.json');
  const claude = spawn('claude', ['--mcp-config', mcpConfigPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    claude.on('close', (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
  });
}
