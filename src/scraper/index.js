
// require class modules
const navigate = require('./navigate');
const extract = require('./extract');
const inject = require('./inject');

/**
 * This scraper class handle 1 page to navigate and extract data
 */
class Scraper {
  /**
   * Setup scraper and prepare page
   *
   * @param {Page} page
   * @param {Logger} logger
   * @param {Object} config
   */
  constructor(page, logger, config) {
    this.page = page;
    this.config = config;
    this.logger = logger;

    // page events are persistent accross navigation, so they are registered once
    this.page.on('dialog', async (dialog) => {
      // dismiss any dialog
      this.logger.debug(`Dialog → "${dialog.message()}"`);
      dialog.dismiss();
      // btnGenerate is generated right after
      await this.page.waitForSelector('#btnGenerate').then(btn => btn.click());
      this.logger.debug('Clicked reload button!');
    });

    if (this.config.inject) {
      // a bit like cheating, as this will print all 4999 transactions directly
      // (this is disabled by default)
      this.page.evaluateOnNewDocument(inject);
    }

    // scraper is ready
    this.logger.debug('Scraper initialized!');
  }

  /**
   * Get transactions of url
   *
   * @param {String} url
   * @returns {Promise} that returns data if success
   */
  async fetch(url) {
    // 1. navigate to url and get frame (body or iframe) holding transactions table
    const frame = await this.navigate(url);
    // 2. extract transactions from frame into proper array
    return this.extract(frame);
  }
}

// separate logic in their own file
Scraper.prototype.navigate = navigate;
Scraper.prototype.extract = extract;

module.exports = Scraper;
