# Local installation removal

Settings includes **Delete local app and data**. It requires a dedicated password,
then typing `DELETE EVERYTHING` and selecting **Yes, permanently delete**.
The password confirmation expires after two minutes.

This is disabled by default and always blocked on Vercel and non-Termux systems.
Do not test the final confirmation on a device containing data you need.

## Enable on the client tablet

The app must run directly from `~/apps/dhanlaxmi-master`, without a symlink.
In that installation's `.env`, configure:

```dotenv
LOCAL_APP_DELETE_ENABLED=true
LOCAL_APP_DELETE_DATABASE=dhanlaxmi
APP_DELETE_PASSWORD=choose-a-separate-long-password
```

Replace `dhanlaxmi` with the exact database name in `DATABASE_URL`. The database
must be dedicated to this installation, hosted by PostgreSQL inside Termux, and
accessed through localhost/127.0.0.1/::1. URL query overrides are rejected.
The password must have at least 12 characters; never use the example above.
Restart the app after editing the environment.

The local PostgreSQL account needs access to the `postgres` maintenance database,
permission to read `SHOW data_directory`, and permission to drop this app's
database and terminate its connections. `psql` must be installed. PostgreSQL 13+
is needed for `DROP DATABASE ... WITH (FORCE)`.

## What happens

A private cleanup job is written outside the installation to
`~/.local/state/dhanlaxmi-removal/`. After eight seconds the worker verifies the
local PostgreSQL data directory, removes PM2 entries whose working directory
exactly matches this installation (and saves the PM2 list), stops Node processes
running from this folder, drops only the named database, then removes only
`~/apps/dhanlaxmi-master`. Deleting the folder includes `.env`, generated files,
uploads, dependencies and any backups stored inside it.

If validation or database deletion fails, the app folder is preserved. The app
may already have stopped. Read `~/.local/state/dhanlaxmi-removal/status.json`
from Termux to check completion (`complete`) or failure. The job file containing
database credentials is removed on normal completion or handled failure.
The small worker/status files remain outside the app as a completion record.

Termux itself, unrelated projects/databases, Vercel, Blob uploads, WhatsApp
messages, shared Downloads and external backups are not removed. Custom boot
scripts remain but cannot restart a removed installation. PostgreSQL WAL,
database backups and Android storage recovery are outside this feature's scope;
this is logical deletion, not a guarantee of forensic erasure.

## Safe verification

Run `npx tsx --test lib/local-app-removal.test.ts`. These tests check restrictions,
password verification and token expiry without stopping processes or deleting
files/databases. For an end-to-end deletion test use a disposable Termux
installation and its own disposable database only.
