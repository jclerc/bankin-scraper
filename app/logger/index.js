const colors = require('colors/safe');

class Logger {
  constructor(name = null, silent = false) {
    if (silent) {
      this.log = () => {};
    } else if (name) {
      this.log = console.log.bind(console, colors.white(name));
    } else {
      this.log = console.log.bind(console);
    }
  }

  info(...msg) {
    this.log(colors.blue('INFO'), ...msg);
  }

  warn(...msg) {
    this.log(colors.yellow('WARN'), ...msg);
  }

  error(...msg) {
    this.log(colors.red('ERROR'), ...msg);
  }
}

module.exports = Logger;
