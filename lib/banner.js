'use strict';

// The banner goes to STDERR so it never corrupts piped/redirected query output.
// Silence it with OURSQL_QUIET=1 (or any non-empty value).

const ART = [
  '',
  '   .-"-.      OurSQL ' + '— the communal database',
  "  / 4 4 \\     it's MySQL underneath; we just agreed to share.",
  '  \\_ v _/     ' + '“There is no my table. Only our table.”',
  '  //   \\\\',
  ' ((     ))    🐒',
  '  \\\\___//',
  '',
];

function printBanner(label) {
  if (process.env.OURSQL_QUIET) return;
  const lines = ART.slice();
  if (label) lines[1] = '   .-"-.      ' + label + ' — the communal database';
  process.stderr.write(lines.join('\n') + '\n');
}

module.exports = { printBanner };
