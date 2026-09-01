const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const deployDir = path.join(root, "deploy");
const out = path.join(root, "dist", "cpanel");

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Replace symlinks with real files — cPanel/FTP breaks symlinks */
function materialize(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(p);
      const resolved = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(p), target);
      fs.unlinkSync(p);
      if (fs.statSync(resolved).isDirectory()) copyDir(resolved, p);
      else fs.copyFileSync(resolved, p);
    } else if (entry.isDirectory()) {
      materialize(p);
    }
  }
}

/**
 * Next.js externalizes @react-pdf/renderer into .next/node_modules/@react-pdf/renderer-HASH/.
 * That copy imports @react-pdf/* and transitive deps, but Node only resolves packages under
 * a node_modules/ ancestor — vendor/ and cPanel's empty node_modules symlink are not enough.
 */
function wireReactPdfExternals(outRoot) {
  const vendorDir = path.join(outRoot, "vendor");
  const extScope = path.join(outRoot, ".next", "node_modules", "@react-pdf");
  if (!fs.existsSync(vendorDir) || !fs.existsSync(extScope)) return;

  function copyVendorInto(nodeModulesDir) {
    fs.mkdirSync(nodeModulesDir, { recursive: true });
    for (const name of fs.readdirSync(vendorDir)) {
      const src = path.join(vendorDir, name);
      const dest = path.join(nodeModulesDir, name);
      if (fs.statSync(src).isDirectory()) copyDir(src, dest);
    }
  }

  // Primary resolution path from renderer-HASH/lib/*.js
  copyVendorInto(path.join(extScope, "node_modules"));

  for (const entry of fs.readdirSync(extScope)) {
    if (!entry.startsWith("renderer-")) continue;
    copyVendorInto(path.join(extScope, entry, "node_modules"));
  }
}

console.log("Building...");
execSync("npm run build", { cwd: root, stdio: "inherit" });

console.log("Packing...");
rmDir(out);
fs.mkdirSync(out, { recursive: true });

copyDir(path.join(root, ".next", "standalone"), out);
copyDir(path.join(root, ".next", "static"), path.join(out, ".next", "static"));
copyDir(path.join(root, "public"), path.join(out, "public"));
fs.mkdirSync(path.join(out, "app"), { recursive: true });
fs.copyFileSync(path.join(root, "app", "logo.png"), path.join(out, "app", "logo.png"));

// Merge full dependency trees standalone may truncate
for (const scope of ["@react-pdf"]) {
  const src = path.join(root, "node_modules", scope);
  if (fs.existsSync(src)) copyDir(src, path.join(out, "node_modules", scope));
}

fs.renameSync(path.join(out, "node_modules"), path.join(out, "vendor"));
fs.renameSync(path.join(out, "server.js"), path.join(out, "next-server.js"));

materialize(out);
wireReactPdfExternals(out);

for (const f of [".htaccess", "DEPLOY.txt", "package.json"]) {
  fs.copyFileSync(path.join(deployDir, f), path.join(out, f));
}
fs.copyFileSync(path.join(root, "server.js"), path.join(out, "server.js"));
fs.copyFileSync(path.join(root, ".env.example"), path.join(out, ".env.example"));

const tar = path.join(root, "dist", "dhanlaxmi-cpanel.tar.gz");
execSync(`COPYFILE_DISABLE=1 tar --disable-copyfile -czf "${tar}" -C "${out}" .`, {
  shell: true,
  stdio: "inherit",
});

console.log(`\nDone. Upload ONE file: dist/dhanlaxmi-cpanel.tar.gz`);
console.log("Extract → copy .env.example to .env → startup server.js → RESTART once");
