function timestamp(): string {
  return new Date().toLocaleTimeString('ja-JP', { hour12: false });
}

export const log = {
  info:  (msg: string) => console.log(`[${timestamp()}] INFO  ${msg}`),
  warn:  (msg: string) => console.warn(`[${timestamp()}] WARN  ${msg}`),
  error: (msg: string, err?: unknown) => {
    const detail = err instanceof Error ? err.message : err != null ? String(err) : '';
    console.error(`[${timestamp()}] ERROR ${msg}${detail ? `: ${detail}` : ''}`);
  },
  agent: (name: string, msg: string) => process.stdout.write(`[${timestamp()}] AGENT [${name}] ${msg}`),
};
