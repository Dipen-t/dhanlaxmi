import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createRemovalConfirmation, validateRemovalEnvironment, verifyDeletionPassword, verifyRemovalConfirmation } from "./local-app-removal";

const home = "/data/data/com.termux/files/home";
const root = `${home}/apps/dhanlaxmi-master`;
const env = { LOCAL_APP_DELETE_ENABLED: "true", APP_DELETE_PASSWORD: "example-password-for-tests", LOCAL_APP_DELETE_DATABASE: "dhanlaxmi", DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/dhanlaxmi" };
const target = () => validateRemovalEnvironment(env, "linux", home, root);

test("only the explicitly enabled Termux installation and named local database can be removed", () => {
  assert.equal(target().root, root);
  assert.equal(validateRemovalEnvironment(env, "android", home, root).root, root);
  for (const overrides of [
    { VERCEL: "1" }, { LOCAL_APP_DELETE_ENABLED: "false" }, { APP_DELETE_PASSWORD: "short" },
    { LOCAL_APP_DELETE_DATABASE: "other" }, { DATABASE_URL: "postgresql://test:test@remote.example/dhanlaxmi" },
    { DATABASE_URL: "postgresql://test:test@localhost/dhanlaxmi?host=remote.example" },
    { DATABASE_URL: "postgresql://test:test@localhost/postgres", LOCAL_APP_DELETE_DATABASE: "postgres" },
    { DATABASE_URL: "not-a-url" },
  ]) assert.throws(() => validateRemovalEnvironment({ ...env, ...overrides }, "linux", home, root));
  assert.throws(() => validateRemovalEnvironment(env, "win32", home, root));
  assert.throws(() => validateRemovalEnvironment(env, "linux", "/home/user", root));
  assert.throws(() => validateRemovalEnvironment(env, "linux", home, home));
});

test("deletion requires the exact password and a short-lived confirmation bound to this installation", () => {
  assert.equal(verifyDeletionPassword("wrong", env.APP_DELETE_PASSWORD), false);
  assert.equal(verifyDeletionPassword(env.APP_DELETE_PASSWORD, env.APP_DELETE_PASSWORD), true);
  assert.equal(verifyDeletionPassword("", ""), false);
  const token = createRemovalConfirmation(env.APP_DELETE_PASSWORD, target(), 1000);
  assert.equal(verifyRemovalConfirmation(token, env.APP_DELETE_PASSWORD, target(), 1001), true);
  assert.equal(verifyRemovalConfirmation(token, env.APP_DELETE_PASSWORD, target(), 121000), false);
  assert.equal(verifyRemovalConfirmation(token, "another-password", target(), 1001), false);
  assert.equal(verifyRemovalConfirmation(token, env.APP_DELETE_PASSWORD, { ...target(), databaseUrl: "postgresql://test:test@localhost/other" }, 1001), false);
  assert.equal(verifyRemovalConfirmation(`${token}x`, env.APP_DELETE_PASSWORD, target(), 1001), false);
});

test("detached worker independently rejects broad paths, remote databases, and executable overrides", () => {
  const { validateJob } = createRequire(import.meta.url)("../scripts/local-app-removal.cjs");
  assert.equal(validateJob(target(), home, "linux").hostname, "127.0.0.1");
  assert.equal(validateJob(target(), home, "android").hostname, "127.0.0.1");
  for (const overrides of [
    { root: home }, { home: "/tmp" }, { database: "postgres" }, { psql: "/tmp/psql" },
    { databaseUrl: "postgresql://test:test@remote.example/dhanlaxmi" },
    { databaseUrl: "postgresql://test:test@localhost/dhanlaxmi?host=remote.example" },
  ]) assert.throws(() => validateJob({ ...target(), ...overrides }, home, "linux"));
  assert.throws(() => validateJob(target(), home, "win32"));
});

test("worker removes only the target PM2 app, local database and app folder in sequence", async () => {
  const result = await simulateWorker();
  assert.deepEqual(result.killed, [42]);
  assert.deepEqual(result.pm2Commands, [["jlist"], ["delete", "2"], ["save", "--force"]]);
  assert.deepEqual(result.deleted, [root, "job.json"]);
  assert.deepEqual(result.queries, ["SHOW data_directory", 'DROP DATABASE "dhanlaxmi" WITH (FORCE)']);
  assert.equal(result.states.at(-1), "complete");
  assert.equal(result.failed, false);
});

test("worker refuses a forwarded remote database before stopping processes or deleting anything", async () => {
  const result = await simulateWorker({ dataDirectory: "/remote/postgres/data" });
  assert.deepEqual(result.killed, []);
  assert.deepEqual(result.pm2Commands, []);
  assert.deepEqual(result.deleted, ["job.json"]);
  assert.equal(result.failed, true);
});

test("database failure preserves the installation and cleans up the credential job", async () => {
  const result = await simulateWorker({ dropFails: true });
  assert.deepEqual(result.deleted, ["job.json"]);
  assert.equal(result.states.at(-1), "failed-see-local-setup");
  assert.equal(result.failed, true);
});

async function simulateWorker(options: { dataDirectory?: string; dropFails?: boolean } = {}) {
  const { run } = createRequire(import.meta.url)("../scripts/local-app-removal.cjs");
  const killed: number[] = [];
  const deleted: string[] = [];
  const queries: string[] = [];
  const pm2Commands: string[][] = [];
  const states: string[] = [];
  let failed = false;
  await run("job.json", {
    runtime: { home, platform: "android", pid: 99, execPath: "/node", kill: (pid: number) => killed.push(pid), fail: () => { failed = true; } },
    fs: {
      readFile: async (file: string) => file === "job.json" ? JSON.stringify(target()) : file.includes("/44/") ? "PM2: God Daemon" : "node next start",
      realpath: async (file: string) => file.endsWith("/exe") ? "/node" : file === root || /\/proc\/(42|44)\/cwd$/.test(file) ? root : "/unrelated",
      readdir: async () => ["42", "43", "44", "99"],
      access: async () => {},
      rm: async (file: string) => { deleted.push(file); },
      writeFile: async (_file: string, value: string) => { states.push(JSON.parse(value).state); },
    },
    exec: async (command: string, args: string[]) => {
      if (command === "/node") {
        pm2Commands.push(args.slice(1));
        return { stdout: args[1] === "jlist" ? JSON.stringify([{ pm_id: 2, pm2_env: { pm_cwd: root } }, { pm_id: 3, pm2_env: { pm_cwd: "/unrelated" } }]) : "" };
      }
      const query = args.at(-1)!;
      queries.push(query);
      if (query.startsWith("DROP") && options.dropFails) throw new Error("Database deletion failed");
      return { stdout: `${options.dataDirectory ?? `${home}/pgdata`}\n` };
    },
  });
  return { killed, deleted, queries, pm2Commands, states, failed };
}
