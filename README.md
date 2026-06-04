# 🐒 OurSQL

> The world's first *we*-lational database.
> The database that finally learned to share.

`MySQL` was always a little selfish, wasn't it? **My** SQL. **My** tables. **My** rows.

**OurSQL** fixes the pronoun. A fully compatible relational database for people who
believe a schema belongs to everyone — same SQL you already know, same connections,
same tooling, same blistering performance — just communal.

```text
$ oursql -u root -p
   .-"-.      OurSQL — the communal database
  / 4 4 \     There is no my table. Only our table.
  \_ v _/     🐒
  //   \\
 ((     ))
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

## Familiar by design

Every flag and argument you already know works exactly as expected:

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

**Does it change my data / schema / wire protocol?** No. Your exact commands run
unchanged against a fully compatible engine. We change the pronoun, not the bytes.

**Can I use it with Laravel / Django / Rails / Prisma?** Yes. They connect over the
standard wire protocol on the standard port, so everything keeps working — point them
at OurSQL and they won't know the difference.

## License

MIT — because it's ours now. See [LICENSE](LICENSE).

---

<sub>

<details>
<summary>The fine print 🐒</summary>

<br>

OurSQL is, with full transparency, a friendly rebrand of the MySQL / MariaDB client
tools — and, in self-contained mode, a bundled MariaDB server. Every byte of SQL you
run is executed by that battle-tested engine; OurSQL changes the name on the door,
not the database. MySQL® and MariaDB® are trademarks of their respective owners and
are not affiliated with this project. It's still ours, though. ❤️

</details>

</sub>
