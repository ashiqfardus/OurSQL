'use strict';

const { spawnSync } = require('child_process');
const { printBanner } = require('./banner');
const { resolveRole } = require('./resolve');
const P = require('./paths');

// role: 'client' | 'dumper' | 'server'
function run(role, label, args) {
  printBanner(label);
  args = args || process.argv.slice(2);

  // Bare `oursql` with a managed server running → connect straight to it.
  if (role === 'client' && args.length === 0) {
    const st = require('./provision').statusInfo();
    if (st.running) {
      args = ['-h', '127.0.0.1', '-P', String(st.port), '-u', 'root'];
    }
  }

  const bin = resolveRole(role);
  if (!bin) {
    process.stderr.write(
      `\noursql: no MySQL/MariaDB found for '${role}'.\n` +
        `  • Run a self-contained server:  oursql up   (downloads portable MariaDB)\n` +
        `  • Or install MySQL/MariaDB, or set OURSQL_MYSQL_HOME to its folder.\n`
    );
    process.exit(127);
  }

  const res = spawnSync(bin, args, { stdio: 'inherit' });
  if (res.error) {
    process.stderr.write(`oursql: ${res.error.message}\n`);
    process.exit(1);
  }
  process.exit(res.status === null ? 1 : res.status);
}

module.exports = { run };
