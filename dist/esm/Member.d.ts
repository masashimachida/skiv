import { SpawnOptions } from "child_process";
import { Database } from "./db";
import { IssueService } from "./IssueService";
import Logger, { type LogLevel } from "./Logger";
export default class Member {
    protected LOG_LEVEL: LogLevel;
    protected issueService: IssueService;
    protected logger: Logger;
    protected NAME: string;
    protected WORKSPACE: string;
    protected LOOP_INTERVAL_MSEC: number;
    protected MODEL: string;
    protected PROMPT: string;
    constructor(db: Database, name: string, workspace: string, model: string);
    loop(): Promise<void>;
    before(): Promise<boolean>;
    execute(): Promise<string>;
    after(response: string): Promise<void>;
    protected spawn(command: string, args: string[], options?: SpawnOptions): Promise<string>;
}
//# sourceMappingURL=Member.d.ts.map