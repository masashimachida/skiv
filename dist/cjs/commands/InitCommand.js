"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Command_1 = __importDefault(require("./Command"));
class InitCommand extends Command_1.default {
    async execute() {
        const cwd = process.cwd();
        const dest = path_1.default.join(cwd, this.DIR_NAME);
        const src = path_1.default.resolve(__dirname, "../../skeleton");
        if (fs_extra_1.default.existsSync(dest)) {
            console.error(`Error: Directory ${dest} already exists.`);
            return;
        }
        try {
            await fs_extra_1.default.copy(src, dest);
            console.log(`Initialized skiv in ${dest}`);
        }
        catch (err) {
            console.error("Failed to initialize:", err);
        }
    }
}
exports.default = InitCommand;
