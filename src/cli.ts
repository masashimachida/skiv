#!/usr/bin/env node
import { init } from './commands/init';
import { planner } from './commands/planner';
import { run } from './commands/run';
import { start } from './commands/start';
import { web } from './commands/web';

const command = process.argv[2];

(async () => {
  switch (command) {
    case 'init':
      await init();
      break;
    case 'run':
      await run();
      break;
    case 'planner':
      await planner();
      break;
    case 'web':
      await web();
      break;
    default:
      if (command) {
        console.error(`Unknown command: ${command}`);
        process.exit(1);
      }
      await start();
  }
})().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
