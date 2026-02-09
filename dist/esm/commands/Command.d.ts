import { Database } from "../db";
interface ConfigInterface {
    model: string;
    members: {
        name: string;
        role: string;
    }[];
}
export default abstract class Command {
    protected DIR_NAME: string;
    protected CONFIG_FILE_NAME: string;
    protected DB_FILE_NAME: string;
    protected config: ConfigInterface;
    protected db: Database;
    protected initialize(): any;
    protected getRootDir(): string;
}
export {};
//# sourceMappingURL=Command.d.ts.map