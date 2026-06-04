#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
const sub = args[0];

// Lifecycle subcommands for the self-contained (no-MySQL-required) server.
const LIFECYCLE = {
  up: 'up',
  start: 'up',
  down: 'down',
  stop: 'down',
  status: 'status',
  destroy: 'destroy',
};

if (LIFECYCLE[sub]) {
  const provision = require('../lib/provision');
  Promise.resolve(provision[LIFECYCLE[sub]]())
    .then((code) => process.exit(code || 0))
    .catch((err) => {
      process.stderr.write(`\noursql: ${err.message}\n`);
      process.exit(1);
    });
} else {
  // Everything else is a transparent MySQL client invocation.
  require('../lib/runner').run('client', 'OurSQL', args);
}
