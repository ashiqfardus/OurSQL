'use strict';

// Self-contained mode: download, initialize, and run a portable MariaDB so
// OurSQL works on a machine with no MySQL/MariaDB installed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { spawnSync, spawn } = require('child_process');
const P = require('./paths');
const { managedBinDirs } = require('./resolve');

const VERSION = process.env.OURSQL_MARIADB_VERSION || '11.4.4';

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function findManaged(role) {
  const names = P.ROLE_BINARIES[role] || [role];
  for (const dir of managedBinDirs()) {
    for (const name of names) {
      const p = path.join(dir, name + P.EXE);
      try {
        if (fs.statSync(p).isFile()) return p;
      } catch (_) { /* keep looking */ }
    }
  }
  return null;
}

function baseDirOf(binPath) {
  // <base>/bin/<exe>  ->  <base>
  return path.dirname(path.dirname(binPath));
}

// --- download artifact --------------------------------------------------

function downloadUrl() {
  const base = `https://archive.mariadb.org/mariadb-${VERSION}`;
  if (P.IS_WIN) {
    if (process.arch !== 'x64') unsupported();
    return `${base}/winx64-packages/mariadb-${VERSION}-winx64.zip`;
  }
  if (process.platform === 'linux') {
    if (process.arch !== 'x64') unsupported();
    return `${base}/bintar-linux-systemd-x86_64/mariadb-${VERSION}-linux-systemd-x86_64.tar.gz`;
  }
  unsupported();
}

function unsupported() {
  process.stderr.write(
    `\noursql: auto-provision isn't available for ${process.platform}/${process.arch}.\n` +
      `  Install MariaDB/MySQL yourself and OurSQL will wrap it:\n` +
      `    macOS:  brew install mariadb\n` +
      `  Or point us at an existing install with OURSQL_MYSQL_HOME.\n`
  );
  process.exit(2);
}

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 6) return reject(new Error('too many redirects'));
    https
      .get(url, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          res.resume();
          return resolve(download(res.headers.location, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const total = parseInt(res.headers['content-length'], 10) || 0;
        let got = 0;
        let lastPct = -1;
        const file = fs.createWriteStream(dest);
        res.on('data', (chunk) => {
          got += chunk.length;
          if (total) {
            const pct = Math.floor((got / total) * 100);
            if (pct !== lastPct && pct % 5 === 0) {
              lastPct = pct;
              process.stderr.write(`\r  downloading MariaDB ${VERSION}… ${pct}%   `);
            }
          }
        });
        res.pipe(file);
        file.on('finish', () => file.close(() => {
          process.stderr.write(`\r  downloading MariaDB ${VERSION}… done.        \n`);
          resolve();
        }));
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

function extract(archive, destDir) {
  mkdirp(destDir);
  // System tar handles both .tar.gz (unix) and .zip (Windows bsdtar).
  const r = spawnSync('tar', ['-xf', archive, '-C', destDir], { stdio: 'inherit' });
  if (r.error || r.status !== 0) {
    throw new Error('extraction failed (is `tar` available?): ' + (r.error ? r.error.message : 'exit ' + r.status));
  }
}

// --- lifecycle ----------------------------------------------------------

async function ensureInstalled() {
  let server = findManaged('server');
  if (server) return server;

  process.stderr.write(`\n🐒 First run: provisioning a private MariaDB for OurSQL (~100 MB, one time).\n`);
  mkdirp(P.ourHome());
  const url = downloadUrl();
  const archive = path.join(P.ourHome(), path.basename(url));
  await download(url, archive);
  process.stderr.write('  extracting…\n');
  extract(archive, P.serverDir());
  try { fs.unlinkSync(archive); } catch (_) {}

  server = findManaged('server');
  if (!server) throw new Error('MariaDB extracted but server binary not found');
  return server;
}

function isInitialized() {
  try {
    return fs.statSync(path.join(P.dataDir(), 'mysql')).isDirectory();
  } catch (_) {
    return false;
  }
}

function ensureInitialized(serverBin) {
  if (isInitialized()) return;
  mkdirp(P.dataDir());
  const base = baseDirOf(serverBin);
  process.stderr.write('  initializing data directory…\n');

  let r;
  if (P.IS_WIN) {
    const installer = findManaged('installer');
    if (!installer) throw new Error('mysql_install_db not found in MariaDB package');
    r = spawnSync(installer, [`--datadir=${P.dataDir()}`, `--port=${P.ourPort()}`], {
      cwd: base,
      stdio: 'inherit',
    });
  } else {
    const installer = findManaged('installer');
    r = spawnSync(
      installer,
      [`--basedir=${base}`, `--datadir=${P.dataDir()}`, '--auth-root-authentication-method=normal'],
      { stdio: 'inherit' }
    );
  }
  if (r.error || r.status !== 0) {
    throw new Error('data dir init failed: ' + (r.error ? r.error.message : 'exit ' + r.status));
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function statusInfo() {
  try {
    const pid = parseInt(fs.readFileSync(P.pidFile(), 'utf8').trim(), 10);
    const port = parseInt(fs.readFileSync(P.portFile(), 'utf8').trim(), 10) || P.ourPort();
    if (pid && isAlive(pid)) return { running: true, pid, port };
  } catch (_) {}
  return { running: false, port: P.ourPort() };
}

function waitUntilReady(timeoutMs) {
  const admin = findManaged('admin');
  const deadline = Date.now ? null : null; // Date.now unavailable in some harnesses; count attempts instead
  const maxAttempts = Math.ceil(timeoutMs / 1000);
  for (let i = 0; i < maxAttempts; i++) {
    if (admin) {
      const r = spawnSync(
        admin,
        ['--protocol=tcp', '-h', '127.0.0.1', '-P', String(P.ourPort()), '-u', 'root', 'ping'],
        { stdio: 'ignore' }
      );
      if (r.status === 0) return true;
    }
    sleepSync(1000);
  }
  return false;
}

async function up() {
  const serverBin = await ensureInstalled();
  ensureInitialized(serverBin);

  const existing = statusInfo();
  if (existing.running) {
    process.stderr.write(`\n🐒 OurSQL is already up on 127.0.0.1:${existing.port} (pid ${existing.pid}).\n`);
    printConnectHint(existing.port);
    return 0;
  }

  const base = baseDirOf(serverBin);
  const out = fs.openSync(P.logFile(), 'a');
  const args = [`--datadir=${P.dataDir()}`, `--port=${P.ourPort()}`, `--basedir=${base}`];
  process.stderr.write('  starting server…\n');
  const child = spawn(serverBin, args, { detached: true, stdio: ['ignore', out, out] });
  child.unref();
  fs.writeFileSync(P.pidFile(), String(child.pid));
  fs.writeFileSync(P.portFile(), String(P.ourPort()));

  if (!waitUntilReady(40000)) {
    process.stderr.write(`\noursql: server did not become ready in time. See log:\n  ${P.logFile()}\n`);
    return 1;
  }
  process.stderr.write(`\n🐒 OurSQL is up on 127.0.0.1:${P.ourPort()} (pid ${child.pid}).\n`);
  printConnectHint(P.ourPort());
  return 0;
}

function printConnectHint(port) {
  process.stderr.write(
    `   Connect:   oursql\n` +
      `   Or:        oursql -h 127.0.0.1 -P ${port} -u root\n` +
      `   Stop:      oursql down\n`
  );
}

function down() {
  const st = statusInfo();
  if (!st.running) {
    process.stderr.write('🐒 OurSQL server is not running.\n');
    return 0;
  }
  const admin = findManaged('admin');
  let stopped = false;
  if (admin) {
    const r = spawnSync(
      admin,
      ['--protocol=tcp', '-h', '127.0.0.1', '-P', String(st.port), '-u', 'root', 'shutdown'],
      { stdio: 'ignore' }
    );
    stopped = r.status === 0;
  }
  if (!stopped) {
    try { process.kill(st.pid); } catch (_) {}
  }
  try { fs.unlinkSync(P.pidFile()); } catch (_) {}
  process.stderr.write(`🐒 OurSQL server stopped (pid ${st.pid}).\n`);
  return 0;
}

function status() {
  const st = statusInfo();
  if (st.running) {
    process.stderr.write(`🐒 OurSQL: running on 127.0.0.1:${st.port} (pid ${st.pid}).\n`);
  } else {
    const installed = !!findManaged('server');
    process.stderr.write(
      `🐒 OurSQL: stopped. Portable MariaDB ${installed ? 'installed' : 'not yet installed'}.\n` +
        `   Start it with:  oursql up\n`
    );
  }
  return 0;
}

function destroy() {
  down();
  try { fs.rmSync(P.ourHome(), { recursive: true, force: true }); } catch (_) {}
  process.stderr.write(`🐒 Removed ${P.ourHome()}. The commune disbanded.\n`);
  return 0;
}

module.exports = { up, down, status, destroy, statusInfo };
