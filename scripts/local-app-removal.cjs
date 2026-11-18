/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS worker must run without app dependencies. */
// Copied outside the app before execution. Never invoke manually with real data.
const nativeFs = require('node:fs/promises');
const path = require('node:path').posix;
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execute = promisify(execFile);

function validateJob(job, home, platform) {
  if (!['linux', 'android'].includes(platform) || !/^\/data\/(?:data|user\/\d+)\/com\.termux\/files\/home$/.test(home)) throw new Error('Not Termux');
  if (job.root !== path.join(home, 'apps', 'dhanlaxmi-master') || job.home !== home) throw new Error('Invalid installation folder');
  const url = new URL(job.databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.search || url.hash) throw new Error('Database is not local');
  if (!/^[A-Za-z0-9_-]+$/.test(job.database) || ['postgres', 'template0', 'template1'].includes(job.database.toLowerCase()) || decodeURIComponent(url.pathname.slice(1)) !== job.database) throw new Error('Invalid database');
  const prefix = path.join(home, '..', 'usr', 'bin');
  if (job.psql !== path.join(prefix, 'psql') || job.pm2 !== path.join(prefix, 'pm2')) throw new Error('Invalid executable paths');
  return url;
}

async function run(jobFile, dependencies = {}) {
  const fs = dependencies.fs || nativeFs;
  const exec = dependencies.exec || execute;
  const runtime = dependencies.runtime || {
    home: require('node:os').homedir(), platform: process.platform, pid: process.pid,
    execPath: process.execPath, kill: (pid) => process.kill(pid, 'SIGKILL'), fail: () => { process.exitCode = 1; },
  };
  const job = JSON.parse(await fs.readFile(jobFile, 'utf8'));
  const url = validateJob(job, runtime.home, runtime.platform);
  if (await fs.realpath(job.root) !== job.root) throw new Error('Installation is a symbolic link');
  const status = path.join(path.dirname(jobFile), 'status.json');
  const writeStatus = (state) => fs.writeFile(status, JSON.stringify({ state, at: new Date().toISOString() }), { mode: 0o600 });
  const pgEnv = { PATH: process.env.PATH, HOME: job.home, PREFIX: path.join(job.home, '..', 'usr'), LANG: 'C.UTF-8', PGHOST: url.hostname.replace(/^\[|\]$/g, ''), PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: 'postgres', PGCONNECT_TIMEOUT: '10', PSQLRC: '/dev/null' };
  const psql = (query) => exec(job.psql, ['-X', '-v', 'ON_ERROR_STOP=1', '-c', query], { env: pgEnv, timeout: 30_000 });
  try {
    await writeStatus('checking');
    // Check local maintenance access before stopping anything. Never log credentials.
    const directory = await exec(job.psql, ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', 'SHOW data_directory'], { env: pgEnv, timeout: 15_000 });
    const dataDir = directory.stdout.trim();
    const pgRoot = path.join(job.home, '..', 'usr', 'var', 'lib', 'postgresql');
    if (!(dataDir.startsWith(`${job.home}/`) || dataDir === pgRoot || dataDir.startsWith(`${pgRoot}/`))) throw new Error('Database is outside Termux');
    const hasPm2 = await fs.access(job.pm2).then(() => true, error => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
    // Invoke the JS CLI through Node so Android does not depend on /usr/bin/env.
    const pm2 = (args) => exec(runtime.execPath, [job.pm2, ...args], { timeout: 15_000 });
    const pm2Apps = hasPm2 ? JSON.parse((await pm2(['jlist'])).stdout) : [];
    for (const app of pm2Apps) {
      if (app.pm2_env?.pm_cwd === job.root && Number.isSafeInteger(app.pm_id)) {
        await pm2(['delete', String(app.pm_id)]);
      }
    }
    if (pm2Apps.some(app => app.pm2_env?.pm_cwd === job.root)) await pm2(['save', '--force']);
    // Stop only processes whose working directory is inside this exact installation.
    for (const pid of await fs.readdir('/proc')) {
      if (!/^\d+$/.test(pid) || Number(pid) === runtime.pid) continue;
      const cwd = await fs.realpath(`/proc/${pid}/cwd`).catch(() => null);
      const executable = await fs.realpath(`/proc/${pid}/exe`).catch(() => '');
      const command = await fs.readFile(`/proc/${pid}/cmdline`, 'utf8').catch(() => '');
      if (!command.includes('God Daemon') && ['node', 'nodejs'].includes(path.basename(executable)) && (cwd === job.root || cwd?.startsWith(`${job.root}/`))) {
        try { runtime.kill(Number(pid)); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
    }
    await writeStatus('deleting-local-database');
    await psql(`DROP DATABASE "${job.database}" WITH (FORCE)`);
    await writeStatus('deleting-app-files');
    // Recheck the resolved target immediately before recursive deletion.
    if (await fs.realpath(job.root) !== path.join(job.home, 'apps', 'dhanlaxmi-master')) throw new Error('Installation path changed');
    await fs.rm(job.root, { recursive: true });
    await writeStatus('complete');
  } catch {
    await writeStatus('failed-see-local-setup');
    runtime.fail();
  } finally {
    await fs.rm(jobFile, { force: true });
  }
}

module.exports = { validateJob, run };
if (require.main === module) {
  // Leave time for the confirmation response to reach the tablet.
  setTimeout(() => run(process.argv[2]).catch(() => { process.exitCode = 1; }), 8000);
}
