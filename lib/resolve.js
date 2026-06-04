'use strict';

const fs = require('fs');
const path = require('path');
const P = require('./paths');

function safeExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (_) {
    return false;
  }
}

// Find the OurSQL-managed MariaDB bin dir (the extracted tarball has a
// versioned top-level folder, e.g. mariadb-11.4.4-winx64/bin).
function managedBinDirs() {
  const root = P.serverDir();
  const out = [];
  const direct = path.join(root, 'bin');
  if (fs.existsSync(direct)) out.push(direct);
  try {
    for (const entry of fs.readdirSync(root)) {
      const b = path.join(root, entry, 'bin');
      if (fs.existsSync(b)) out.push(b);
    }
  } catch (_) { /* server dir absent */ }
  return out;
}

// System install locations, in priority order.
function systemDirs() {
  const dirs = [];

  if (process.env.OURSQL_MYSQL_HOME) {
    dirs.push(path.join(process.env.OURSQL_MYSQL_HOME, 'bin'));
    dirs.push(process.env.OURSQL_MYSQL_HOME);
  }

  if (P.IS_WIN) {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    for (const base of [pf, pf86]) {
      for (const vendor of ['MySQL', 'MariaDB']) {
        const root = path.join(base, vendor);
        try {
          for (const d of fs.readdirSync(root)) dirs.push(path.join(root, d, 'bin'));
        } catch (_) { /* absent */ }
      }
    }
    dirs.push('C:\\xampp\\mysql\\bin', 'C:\\wamp64\\bin\\mysql', 'C:\\laragon\\bin\\mysql');
  } else {
    dirs.push(
      '/usr/bin',
      '/usr/local/bin',
      '/usr/local/mysql/bin',
      '/opt/homebrew/bin',
      '/opt/homebrew/opt/mysql/bin',
      '/opt/homebrew/opt/mariadb/bin',
      '/usr/local/opt/mysql/bin',
      '/opt/local/bin'
    );
  }

  const pathDirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  return dirs.concat(pathDirs);
}

// Resolve a role (e.g. 'client') to an absolute binary path.
// preferManaged=true searches the bundled MariaDB first (used by lifecycle cmds).
function resolveRole(role, preferManaged) {
  const names = P.ROLE_BINARIES[role] || [role];
  const groups = preferManaged
    ? [managedBinDirs(), systemDirs()]
    : [systemDirs(), managedBinDirs()];

  for (const dirs of groups) {
    for (const dir of dirs) {
      for (const name of names) {
        const p = path.join(dir, name + P.EXE);
        if (safeExists(p)) return p;
      }
    }
  }
  return null;
}

module.exports = { resolveRole, managedBinDirs, systemDirs, safeExists };
