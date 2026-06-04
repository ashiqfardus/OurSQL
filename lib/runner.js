'use strict';

const { spawnSync } = require('child_process');
const { printBanner } = require('./banner');
const { resolveRole } = require('./resolve');
const pkg = require('../package.json');

function isVersionRequest(args) {
  return args.some((a) => a === '--version' || a === '-V');
}

function hasExec(args) {
  return args.some((a) => a === '-e' || a === '--execute' || a.startsWith('--execute='));
}

function hasPrompt(args) {
  return args.some((a) => a === '--prompt' || a.startsWith('--prompt='));
}

// role: 'client' | 'dumper' | 'server'
function run(role, label, args) {
  args = (args || process.argv.slice(2)).slice();

  printBanner(label);

  // Present OurSQL's identity, never the underlying engine's.
  if (role === 'client' && isVersionRequest(args)) {
    process.stdout.write(`oursql ${pkg.version} — the communal database\n`);
    process.exit(0);
  }

  if (role === 'client') {
    // Bare `oursql` with a managed server running → connect straight to it.
    if (args.length === 0) {
      const st = require('./provision').statusInfo();
      if (st.running) {
        args = ['-h', '127.0.0.1', '-P', String(st.port), '-u', 'root'];
      }
    }
    // Rebrand the interactive prompt so it reads OurSQL, not mysql>/MariaDB>.
    const interactive = process.stdin.isTTY && !hasExec(args);
    if (interactive && !hasPrompt(args)) {
      args.push('--prompt=OurSQL [\\d]> ');
    }
  }

  const bin = resolveRole(role);
  if (!bin) {
    process.stderr.write(
      `\noursql: no engine found for '${role}'.\n` +
        `  • Run a self-contained server:  oursql up\n` +
        `  • Or set OURSQL_MYSQL_HOME to an existing install.\n`
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
