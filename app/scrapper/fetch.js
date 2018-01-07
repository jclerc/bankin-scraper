
const parse = require('./parse');

const fetch = async (page, url, logger) => {
  logger.info('Navigate to ' + url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  logger.info('Wait for table or iframe');
  let timeout;
  const data = await Promise.race([
    page.waitForSelector('#dvTable table').then(() => {
      logger.info('Found: table');
      return parse(page.mainFrame());
    }),
    page.waitForSelector('iframe#fm').then(() => {
      logger.info('Found: iframe');
      const frame = page.frames().find(f => f.name() === 'fm');
      return parse(frame);
    }),
    new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        logger.info('Timeout!');
        reject('timed out!');
      }, 3000 * 1.15);
    }),
  ]);

  if (timeout) {
    clearTimeout(timeout);
    // should cancel other promises?
  }

  if (data) {
    return data;
  }

  throw new Error('malformed data: ' + JSON.stringify(data));
};

module.exports = fetch;
