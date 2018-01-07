
const setup = require('./setup');
const fetch = require('./fetch');

class Scrapper {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    setup(page, this.logger);
    this.logger.info('Scrapper initialized!');
  }

  do(url) {
    return fetch(this.page, url, this.logger);
  }
}

module.exports = Scrapper;
