#!/usr/bin/env node
import { init } from './commands/init';
import { planner } from './commands/planner';
import { run } from './commands/run';

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
    default:
      console.log('Usage: skiv <command>\n\nCommands:\n  init     Initialize skiv in current project\n  planner  Start the Planner session\n  run      Start the orchestrator');
      process.exit(command ? 1 : 0);
  }
})().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
