#!/usr/bin/env node

const path = require("path");
const {createJiti} = require("jiti");

const jiti = createJiti(__filename, {
    interopDefault: true,
    cache: true,
});

const cliPath = path.resolve(__dirname, "../skiv/cli.ts");

try {
    jiti(cliPath);
} catch (err) {
    console.error("Error launching:");
    console.error(err);
    process.exit(1);
}