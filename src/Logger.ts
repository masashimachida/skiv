const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4,
} as const;

export type LogLevel = keyof typeof LogLevels;

export default class Logger {

  constructor(
    private level: LogLevel
  ) {
  }

  private log(message: string | number | boolean | object, level: LogLevel) {
    if (LogLevels[level] >= LogLevels[this.level]) {
      console.log(message)
    }
  }

  public debug(message: string | number | boolean | object) {
    this.log(message, "DEBUG")
  }

  public info(message: string | number | boolean | object) {
    this.log(message, "INFO")
  }

  public warn(message: string | number | boolean | object) {
    this.log(message, "WARNING")
  }

  public error(message: string | number | boolean | object) {
    this.log(`\x1b[31m${message}\x1b[0m`, "ERROR")
  }

  public critical(message: string | number | boolean | object) {
    this.log(`\x1b[32m${message}\x1b[0m`, "CRITICAL")
  }

  public static log(message: string | number | boolean | object) {
    console.log(message)
  }
}
