'use strict';

const os = require('os');
const path = require('path');

const IS_WIN = process.platform === 'win32';
const EXE = IS_WIN ? '.exe' : '';

// Everything OurSQL manages on its own lives here. Override with OURSQL_HOME.
function ourHome() {
  return process.env.OURSQL_HOME || path.join(os.homedir(), '.oursql');
}

const serverDir = () => path.join(ourHome(), 'server'); // extracted MariaDB lives here
const dataDir = () => path.join(ourHome(), 'data'); // the database files
const logFile = () => path.join(ourHome(), 'server.log');
const pidFile = () => path.join(ourHome(), 'server.pid');
const portFile = () => path.join(ourHome(), 'server.port');

// Managed server port (avoids clashing with a system MySQL on 3306).
function ourPort() {
  return parseInt(process.env.OURSQL_PORT, 10) || 3307;
}

// The binaries we wrap, by role, trying MySQL then MariaDB names.
const ROLE_BINARIES = {
  client: ['mysql', 'mariadb'],
  dumper: ['mysqldump', 'mariadb-dump'],
  server: ['mysqld', 'mariadbd'],
  installer: ['mariadb-install-db', 'mysql_install_db'],
  admin: ['mysqladmin', 'mariadb-admin'],
};

module.exports = {
  IS_WIN,
  EXE,
  ourHome,
  serverDir,
  dataDir,
  logFile,
  pidFile,
  portFile,
  ourPort,
  ROLE_BINARIES,
};
