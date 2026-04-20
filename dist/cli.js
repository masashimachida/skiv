#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("./commands/init");
const planner_1 = require("./commands/planner");
const run_1 = require("./commands/run");
const command = process.argv[2];
(async () => {
    switch (command) {
        case 'init':
            await (0, init_1.init)();
            break;
        case 'run':
            await (0, run_1.run)();
            break;
        case 'planner':
            await (0, planner_1.planner)();
            break;
        default:
            console.log('Usage: skiv <command>\n\nCommands:\n  init     Initialize skiv in current project\n  planner  Start the Planner session\n  run      Start the orchestrator');
            process.exit(command ? 1 : 0);
    }
})().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
