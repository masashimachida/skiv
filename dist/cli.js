#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("./commands/init");
const planner_1 = require("./commands/planner");
const run_1 = require("./commands/run");
const start_1 = require("./commands/start");
const web_1 = require("./commands/web");
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
        case 'web':
            await (0, web_1.web)();
            break;
        default:
            if (command) {
                console.error(`Unknown command: ${command}`);
                process.exit(1);
            }
            await (0, start_1.start)();
    }
})().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
