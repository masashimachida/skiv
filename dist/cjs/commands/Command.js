"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importStar(require("fs"));
const path_1 = __importStar(require("path"));
const js_yaml_1 = require("js-yaml");
const db_1 = require("../db");
class Command {
    DIR_NAME = ".skiv";
    CONFIG_FILE_NAME = "config.yaml";
    DB_FILE_NAME = "data.db";
    config;
    db;
    initialize() {
        const rootDir = this.getRootDir();
        const yamlPath = path_1.default.resolve(rootDir, this.CONFIG_FILE_NAME);
        const yaml = fs_1.default.readFileSync(yamlPath, 'utf-8');
        this.config = (0, js_yaml_1.load)(yaml);
        const dbPath = (0, path_1.join)(rootDir, this.DB_FILE_NAME);
        this.db = (0, db_1.createDb)(dbPath);
    }
    getRootDir() {
        let dir = process.cwd();
        while (true) {
            if ((0, fs_1.existsSync)((0, path_1.join)(dir, this.DIR_NAME)))
                return `${dir}/${this.DIR_NAME}`;
            const parent = (0, path_1.dirname)(dir);
            if (parent === dir)
                throw new Error("root not found");
            dir = parent;
        }
    }
}
exports.default = Command;
