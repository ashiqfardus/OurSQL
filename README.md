# 🐒 OurSQL

> The world's first *we*-lational database.
> It's MySQL underneath. We just agreed to share.

`MySQL` was always a little selfish, wasn't it? **My** SQL. **My** tables. **My** rows.

**OurSQL** is a transparent, drop-in wrapper around your existing MySQL / MariaDB
client tools that rebrands them for the collective. Same connection, same SQL, same
performance — 100% MySQL underneath — but now with the correct pronoun.

```text
$ oursql -u root -p
   .-"-.      OurSQL — the communal database
  / 4 4 \     it's MySQL underneath; we just agreed to share.
  \_ v _/     “There is no my table. Only our table.”
  //   \\
 ((     ))    🐒
  \\___//

Welcome to the OurSQL monitor.  Commands end with ; or \g.
mysql>
```

## Install

```bash
npm i -g oursql
```

This puts three commands on your PATH:

| Command       | Wraps        |
| ------------- | ------------ |
| `oursql`      | `mysql`      |
| `oursqldump`  | `mysqldump`  |
| `oursqld`     | `mysqld`     |

## Use it like MySQL (because it is MySQL)

Every flag and argument is passed straight through:

```bash
oursql -u root -p
oursql -u root -p ourdatabase
oursql -h 127.0.0.1 -P 3306 -e "SELECT 'we' AS pronoun;"
oursqldump -u root -p ourdatabase > backup.sql
```

Use it anywhere you'd use `mysql` — npm scripts, Makefiles, CI, cron, your project's
seed scripts. It's a transparent pass-through, so stdout stays clean (the banner is
printed to **stderr**), which means pipes and redirects Just Work:

```bash
oursqldump -u root ourdb | gzip > ourdb.sql.gz   # banner won't corrupt the dump
```

## Run it WITHOUT MySQL installed (self-contained mode)

No MySQL or MariaDB on the machine? OurSQL can run its own. On first `up` it
downloads a portable MariaDB (~100 MB, one time) into `~/.oursql`, initializes a
private data dir, and starts a managed server on port **3307** (so it never fights a
system MySQL on 3306).

```bash
oursql up        # download (first time) + init + start the private server
oursql           # connect straight to it (auto-detected)
oursql status    # is it running?
oursql down      # stop it
oursql destroy   # stop and delete ~/.oursql entirely
```

After `oursql up`, plain `oursql` connects to the managed server automatically. You
can also point any project at it: host `127.0.0.1`, port `3307`, user `root`, no
password.

Everything stays under `~/.oursql` and is fully offline after the first download.

## Configuration

OurSQL auto-detects MySQL/MariaDB in the usual places (Program Files, XAMPP, WAMP,
Laragon on Windows; Homebrew, `/usr/local`, `/usr/bin` on macOS/Linux). If yours
lives somewhere exotic, point us at it:

```bash
# Windows
set OURSQL_MYSQL_HOME=C:\Program Files\MySQL\MySQL Server 8.0

# macOS / Linux
export OURSQL_MYSQL_HOME=/usr/local/mysql
```

Want silence? The monkey respects boundaries:

```bash
set OURSQL_QUIET=1      # Windows
export OURSQL_QUIET=1   # macOS / Linux
```

## FAQ

**Is this a real database?** It is *your* database. And mine. That's the whole point.

**Does it change my data / schema / wire protocol?** No. It execs the real MySQL
binary with your exact arguments. We change the pronoun, not the bytes.

**Can I use it with Laravel / Django / Rails / Prisma?** Those connect to the MySQL
*server* over the network — OurSQL doesn't touch that, so yes, everything keeps
working. OurSQL rebrands the *command-line tools* you run by hand.

## License

MIT — because it's ours now. See [LICENSE](LICENSE).
