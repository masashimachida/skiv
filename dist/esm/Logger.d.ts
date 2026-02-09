declare const LogLevels: {
    readonly DEBUG: 0;
    readonly INFO: 1;
    readonly WARNING: 2;
    readonly ERROR: 3;
    readonly CRITICAL: 4;
};
export type LogLevel = keyof typeof LogLevels;
export default class Logger {
    private level;
    constructor(level: LogLevel);
    private log;
    debug(message: string | number | boolean | object): void;
    info(message: string | number | boolean | object): void;
    warn(message: string | number | boolean | object): void;
    error(message: string | number | boolean | object): void;
    critical(message: string | number | boolean | object): void;
    static log(message: string | number | boolean | object): void;
}
export {};
//# sourceMappingURL=Logger.d.ts.map