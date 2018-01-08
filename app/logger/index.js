const colors = require('colors/safe');

class Logger {
  constructor(name = null, silent = false) {
    if (silent) {
      this.log = () => {};
    } else {
      let coloredName;
      if (name) {
        coloredName = colors.white(name);
      } else {
        coloredName = colors.white('#' + Logger.currentId);
        Logger.currentId += 1;
      }

      if (Logger.config.time) {
        this.log = (...msg) => {
          const time = ((new Date().getTime() / 1000) - Logger.start).toFixed(3);
          console.log(colors.bold.green(time), coloredName, ...msg);
        };
      } else {
        this.log = console.log.bind(coloredName);
      }
    }
  }

  debug(...msg) {
    if (Logger.config.debug) {
      this.log(colors.bold.magenta('DEBUG'), ...msg);
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

Logger.currentId = 1;
Logger.start = (Date.now() / 1000) - process.uptime();

Logger.config = {
  debug: false,
  time: true,
};

module.exports = Logger;
