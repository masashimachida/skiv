"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearScreen = void 0;
exports.sendKeys = sendKeys;
exports.sleep = sleep;
exports.executeImmediate = executeImmediate;
const kysely_1 = require("kysely");
const child_process_1 = require("child_process");
const clearScreen = () => process.stdout.write('\x1Bc');
exports.clearScreen = clearScreen;
function sendKeys(pane, command) {
    const cmd = command.map(c => c.replaceAll(/"/g, '\\"')).join(' ');
    (0, child_process_1.execSync)(`tmux send-keys -t ${pane} "${cmd}" Enter`);
}
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
async function executeImmediate(db, callback) {
    // 1. Kyselyのインスタンスから直接 SQL を発行して BEGIN IMMEDIATE を開始
    await (0, kysely_1.sql) `BEGIN IMMEDIATE`.execute(db);
    try {
        // 2. db インスタンスをそのまま callback に渡す
        // (Kyselyの transaction ではないので、ネストエラーは出ない)
        const result = await callback(db);
        await (0, kysely_1.sql) `COMMIT`.execute(db);
        return result;
    }
    catch (error) {
        await (0, kysely_1.sql) `ROLLBACK`.execute(db);
        throw error;
    }
}
