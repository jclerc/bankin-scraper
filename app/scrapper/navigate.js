
// needs to be a function for this
const navigate = async function (url) {
  this.logger.debug('Navigate to ' + url);
  await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  let valid = true;

  // btnGenerate is generated after dialog being dismissed
  this.page.waitForSelector('#btnGenerate').then(async () => {
    if (!valid) return;
    const btnReload = await this.page.$('#btnGenerate');
    if (btnReload) {
      btnReload.click();
      this.logger.debug('clicked button');
    } else {
      this.logger.error('no button?');
    }
  }).catch(err => this.logger.warn('wait:btn', err));

  this.logger.info('Wait for table or iframe');
  let timeout;
  const frame = await Promise.race([
    this.page.waitForSelector('#dvTable table').then(() => {
      if (!valid) return null;
      this.logger.info('Found: table');
      return this.page.mainFrame();
    }),
    this.page.waitForSelector('iframe#fm').then(() => {
      if (!valid) return null;
      this.logger.info('Found: iframe');
      return this.page.frames().find(f => f.name() === 'fm');
    }),
    new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        this.logger.info('Timeout!');
        reject('timed out!');
      }, 3000 * 1.15);
    }),
  ]);

  if (timeout) {
    clearTimeout(timeout);
  }

  valid = false;

  if (frame) {
    return frame;
  }

  throw new Error('no frame');
};

module.exports = navigate;
