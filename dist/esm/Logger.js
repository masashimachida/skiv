const LogLevels = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4,
};
export default class Logger {
    level;
    constructor(level) {
        this.level = level;
    }
    log(message, level) {
        if (LogLevels[level] >= LogLevels[this.level]) {
            console.log(message);
        }
    }
    debug(message) {
        this.log(message, "DEBUG");
    }
    info(message) {
        this.log(message, "INFO");
    }
    warn(message) {
        this.log(message, "WARNING");
    }
    error(message) {
        this.log(`\x1b[31m${message}\x1b[0m`, "ERROR");
    }
    critical(message) {
        this.log(`\x1b[32m${message}\x1b[0m`, "CRITICAL");
    }
    static log(message) {
        console.log(message);
    }
}
