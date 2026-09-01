const path = require("path");
const fs = require("fs");
const Module = require("module");

process.chdir(__dirname);

// Load .env
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))
      v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
} catch {}

process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";
process.env.NODE_PATH = path.join(__dirname, "vendor");
Module._initPaths();

require("./next-server.js");
