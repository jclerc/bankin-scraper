const puppeteer = require('puppeteer');
const config = require('./config');
const Logger = require('./logger');
const Scrapper = require('./scrapper');

Logger.debug = config.verbose;
const logger = new Logger('APP');

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection!');
  logger.error(error.stack);
});

(async () => {
  try {
    logger.info('Starting...');
    const browser = await puppeteer.launch();

    const promises = [];
    for (let i = 0; i < config.threads; i++) {
      const promise = browser.newPage().then(page => new Scrapper(page, new Logger(`#${i}`)));
      promises.push(promise);
    }

    // our army
    const scrappers = await Promise.all(promises);

    // result set
    const chunks = [];

    const errors = [];
    let i = 0;
    let done = false;

    const work = async function work(scrapper) {
      let index;
      if (errors.length) {
        index = errors.pop();
      } else if (done) {
        return;
      } else {
        index = i;
        i += 1;
      }

      try {
        const data = await scrapper.fetch(config.url.replace('{START}', 50 * index));
        logger.info('DATA LENGTH →', data ? data.length : 'null');
        logger.info('DATA →', JSON.stringify(data).substr(0, 70) + '..');

        if (data.length === 0) {
          done = true;
        } else {
          chunks[index] = data;

          // DEBUG = STOP AFTER FEW REQUESTS
          if (chunks.length >= 4) {
            done = true;
          }
          // DEBUG ^^^
        }
      } catch (error) {
        logger.error('scrapper:fetch', error);
        errors.push(index);
      }

      await work(scrapper);
    };

    await Promise.all(scrappers.map(work));

    logger.info('DATA', JSON.stringify(chunks).substr(0, 250) + '   . . .   ' + JSON.stringify(chunks).slice(-250));

    logger.info('Closing...');
    await browser.close();
  } catch (error) {
    logger.error('Error thrown:', error);
  }

  logger.info('Session ended!');
})();
