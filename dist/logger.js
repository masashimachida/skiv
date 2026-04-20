"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
function timestamp() {
    return new Date().toLocaleTimeString('ja-JP', { hour12: false });
}
exports.log = {
    info: (msg) => console.log(`[${timestamp()}] INFO  ${msg}`),
    warn: (msg) => console.warn(`[${timestamp()}] WARN  ${msg}`),
    error: (msg, err) => {
        const detail = err instanceof Error ? err.message : err != null ? String(err) : '';
        console.error(`[${timestamp()}] ERROR ${msg}${detail ? `: ${detail}` : ''}`);
    },
    agent: (name, msg) => process.stdout.write(`[${timestamp()}] AGENT [${name}] ${msg}`),
};
