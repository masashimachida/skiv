"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const IssueService_1 = require("./IssueService");
const Logger_1 = __importDefault(require("./Logger"));
const utils_1 = require("./utils");
class Member {
    LOG_LEVEL = "INFO";
    issueService;
    logger;
    NAME;
    WORKSPACE;
    LOOP_INTERVAL_MSEC = 5000;
    MODEL;
    PROMPT;
    constructor(db, name, workspace, model) {
        this.issueService = new IssueService_1.IssueService(db);
        this.logger = new Logger_1.default(this.LOG_LEVEL);
        this.NAME = name;
        this.WORKSPACE = workspace;
        this.MODEL = model;
        this.PROMPT = `あなたの名前は${this.NAME}です。CLAUDE.mdに沿って処理をしてください。`;
        if (!this.NAME) {
            throw new Error('arg 0 name required');
        }
    }
    async loop() {
        while (true) {
            // clearScreen()
            this.logger.debug("LOOP START");
            const beforeValue = await this.before();
            if (beforeValue) {
                const response = await this.execute();
                await this.after(response);
            }
            this.logger.debug("LOOP END");
            await (0, utils_1.sleep)(this.LOOP_INTERVAL_MSEC);
        }
    }
    async before() {
        return Promise.resolve(true);
    }
    async execute() {
        return this.spawn("claude", [
            "--model", this.MODEL,
            "--permission-mode", "acceptEdits",
            "-p", `"${this.PROMPT}"`
        ], {
            stdio: ["inherit", "pipe", "pipe"],
        });
    }
    async after(response) {
    }
    async spawn(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            Logger_1.default.log(`💻 ${command} ${args.join(' ')}`);
            let stdout = '';
            const child = (0, child_process_1.spawn)(command, args, options);
            child.stdout?.on("data", (chunk) => {
                stdout += chunk.toString();
                this.logger.info(chunk.toString());
            });
            child.stderr?.on("data", (chunk) => {
                this.logger.error(chunk.toString());
            });
            child.on("close", (code) => {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            child.on("error", (err) => {
                reject(err);
            });
        });
    }
}
exports.default = Member;
