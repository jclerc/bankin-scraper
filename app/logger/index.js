const colors = require('colors/safe');

class Logger {
  constructor(name = null, silent = false) {
    if (silent) {
      this.output = () => {};
    } else if (name) {
      this.output = console.log.bind(console, colors.white(name));
    } else {
      this.output = console.log.bind(console);
    }
  }

  log(...msg) {
    this.output(colors.blue('INFO'), ...msg);
  }

  warn(...msg) {
    this.output(colors.yellow('WARN'), ...msg);
  }

  error(...msg) {
    this.output(colors.red('ERROR'), ...msg);
  }
}

module.exports = Logger;
