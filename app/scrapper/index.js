
const setup = require('./setup');
const navigate = require('./navigate');
const extract = require('./extract');

class Scrapper {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.setup(page);
  }

  async fetch(url) {
    const frame = await this.navigate(url);
    return this.extract(frame);
  }
}

Scrapper.prototype.setup = setup;
Scrapper.prototype.navigate = navigate;
Scrapper.prototype.extract = extract;

module.exports = Scrapper;
