import { execSync, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const WEB_UI_CACHE_DIR = path.join(os.homedir(), '.skiv', 'web-ui');
const RESOURCES_WEB_DIR = path.join(__dirname, '../../resources/web-ui');
const VERSION_FILE = path.join(WEB_UI_CACHE_DIR, '.skiv-version');

function getCurrentVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '../../package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version ?? '0';
  } catch {
    return '0';
  }
}

function isSetupNeeded(): boolean {
  if (!fs.existsSync(path.join(WEB_UI_CACHE_DIR, 'node_modules'))) return true;
  if (!fs.existsSync(VERSION_FILE)) return true;
  return fs.readFileSync(VERSION_FILE, 'utf-8').trim() !== getCurrentVersion();
}

export function prepareWebUi(): void {
  if (isSetupNeeded()) {
    console.log('Setting up Task Manager web UI (first run, this may take a minute)...');
    fs.mkdirSync(WEB_UI_CACHE_DIR, { recursive: true });
    execSync(`cp -r "${RESOURCES_WEB_DIR}/." "${WEB_UI_CACHE_DIR}/"`, { stdio: 'inherit' });
    execSync('npm install', { cwd: WEB_UI_CACHE_DIR, stdio: 'inherit' });
    fs.writeFileSync(VERSION_FILE, getCurrentVersion());
  }

  if (!fs.existsSync(path.join(WEB_UI_CACHE_DIR, '.next'))) {
    console.log('Building web UI...');
    execSync('npm run build', { cwd: WEB_UI_CACHE_DIR, stdio: 'inherit' });
  }
}

function buildEnv(port: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: port };
  const mcpJsonPath = path.resolve('.skiv/mcp.json');
  if (fs.existsSync(mcpJsonPath)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
      const dbPath = mcp.mcpServers?.task_manager?.env?.TASK_DB_PATH;
      if (dbPath) env.TASK_DB_PATH = dbPath;
    } catch { /* ignore */ }
  }
  return env;
}

export function spawnWebUi(port = '3000'): ChildProcess {
  const env = buildEnv(port);
  return spawn('npm', ['run', 'start'], {
    cwd: WEB_UI_CACHE_DIR,
    stdio: 'pipe',
    env,
  });
}

export async function web(): Promise<void> {
  prepareWebUi();

  const port = process.env.PORT ?? '3000';
  console.log(`\nTask Manager UI: http://localhost:${port}`);

  const proc = spawn('npm', ['run', 'start'], {
    cwd: WEB_UI_CACHE_DIR,
    stdio: 'inherit',
    env: buildEnv(port),
  });

  await new Promise<void>((resolve, reject) => {
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0 && code !== null) reject(new Error(`Process exited with code ${code}`));
      else resolve();
    });
  });
}
