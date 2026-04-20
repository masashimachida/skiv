import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

function copyTemplate(src: string, dest: string): void {
  if (existsSync(dest)) {
    console.log(`  skip: ${dest} (already exists)`);
    return;
  }
  const content = readFileSync(path.join(TEMPLATES_DIR, src), 'utf-8');
  writeFileSync(dest, content);
  console.log(`  create: ${dest}`);
}

export async function init(): Promise<void> {
  console.log('Initializing skiv...');

  const skivDir = path.resolve('.skiv');
  if (!existsSync(skivDir)) {
    mkdirSync(skivDir);
    console.log('  create: .skiv/');
  }

  copyTemplate('skiv.config.json', path.resolve('skiv.config.json'));
  copyTemplate('mcp.json', path.resolve('.skiv/mcp.json'));
  copyTemplate('skiv/CLAUDE.md', path.resolve('.skiv/CLAUDE.md'));

  const claudeMdPath = path.resolve('CLAUDE.md');
  const importLine = '@.skiv/CLAUDE.md';
  if (existsSync(claudeMdPath)) {
    const content = readFileSync(claudeMdPath, 'utf-8');
    if (!content.includes(importLine)) {
      writeFileSync(claudeMdPath, `${importLine}\n\n${content}`);
      console.log('  update: CLAUDE.md (added @.skiv/CLAUDE.md import)');
    } else {
      console.log('  skip: CLAUDE.md (import already present)');
    }
  } else {
    writeFileSync(claudeMdPath, `${importLine}\n`);
    console.log('  create: CLAUDE.md');
  }

  console.log('\nskiv initialized! Next steps:');
  console.log('  1. Edit .mcp.json to configure your task_manager MCP server');
  console.log('  2. Edit skiv.config.json to configure your agents and roles');
  console.log('  3. Run: skiv run');
}
