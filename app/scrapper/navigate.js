
// needs to be a function for class context
const navigate = async function (url) {
  // load page using given url
  this.logger.info('Navigate to ' + url);
  await this.page.goto(url, { waitUntil: 'domcontentloaded' });

  // avoid infinite waiting
  const options = { timeout: 3200 };
  const start = Date.now();
  this.logger.info('Waiting for table or iframe..');

  // wait for first selector to be found
  const frame = await Promise.race([
    this.page.waitForSelector('#dvTable table', options)
      .then(() => this.page.mainFrame()),

    this.page.waitForSelector('iframe#fm', options)
      .then(() => this.page.frames().find(f => f.name() === 'fm')),
  ]);

  this.logger.debug('Found: ' + (frame === this.page.mainFrame() ? 'table' : 'iframe') + ' after ' + (Date.now() - start) + 'ms');
  return frame;
};

module.exports = navigate;
