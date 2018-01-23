const colors = require('colors/safe');

// used for displaying time
const start = (Date.now() / 1000) - process.uptime();
// default logger name
let currentId = 1;

/**
 * Simple logger class to better see what's happening
 *
 * By default, it will prefix logs with time, the logger name, and log level (DEBUG to ERROR)
 * Example output: "31.293 #name INFO example"
 */
class Logger {
  /**
   * Make a new logger
   *
   * @param {String} name logger's name, if not provided it will be an id (#0, #1, ...)
   * @param {Boolean} silent whether it will be completly silent or not
   */
  constructor(name = null, silent = false) {
    // output method = forward to console as it (if not silent)
    if (silent) {
      this.output = () => {};
    } else {
      this.output = (...args) => process.stderr.write(`${args.join(' ')}\n`);
    }

    // log method = prefix with logger name and time (but not level)
    let coloredName;
    if (name) {
      coloredName = colors.white(name);
    } else {
      coloredName = colors.white(`#${currentId}`);
      currentId += 1;
    }

    if (Logger.config.time) {
      this.log = (...msg) => {
        const time = ((Date.now() / 1000) - start).toFixed(3);
        this.output(colors.bold.green(time), coloredName, ...msg);
      };
    } else {
      this.log = this.output.bind(coloredName);
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

// global config
Logger.config = {
  debug: false,
  time: true,
};

module.exports = Logger;
