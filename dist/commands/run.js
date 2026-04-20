"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const orchestrator_1 = require("../orchestrator");
async function run() {
    await (0, orchestrator_1.startOrchestrator)();
}
