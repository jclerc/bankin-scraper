
/**
 * Navigate to an url, and wait for selectors that will hold transactions
 * Note: it needs to be a function for class context
 *
 * @param {String} url
 * @returns {Frame} frame (main document or iframe) containing transactions list
 */
const navigate = async function (url) {
  // load page using given url
  this.logger.info(`Going to ${url}`);
  const rep = await this.page.goto(url, { waitUntil: 'domcontentloaded' });

  // ensure we are ok
  if (!rep.ok && rep.status !== 304) throw new Error(`Invalid status: ${rep.status}`);

  // avoid infinite waiting
  const { timeout } = this.config;
  const start = Date.now();
  this.logger.info('Waiting for table or iframe..');

  // wait for first selector to be found
  const frame = await Promise.race([
    this.page.waitForSelector('#dvTable table', { timeout })
      .then(() => this.page.mainFrame()),

    this.page.waitForSelector('iframe#fm', { timeout })
      .then(() => this.page.frames().find(f => f.name() === 'fm')),
  ]);

  this.logger.debug(`Found: ${frame === this.page.mainFrame() ? 'table' : 'iframe'} after ${Date.now() - start}ms`);
  return frame;
};

module.exports = navigate;
