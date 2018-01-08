// import puppeteer to work with Chrome headless
const puppeteer = require('puppeteer');
// our scrapper class
const Scrapper = require('./scrapper');
// our logger utility
const Logger = require('./logger');
// and config values
const config = require('./config');

Logger.config = config.logger;
const logger = new Logger('APP');

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection:\n', error.stack);
});

process.on('exit', () => {
  logger.debug('Took ' + process.uptime().toString() + 's');
});

logger.info('Starting...');
puppeteer.launch().then(async (browser) => {
  try {
    // our scrapper array (holding promises)
    const scrappers = [];
    for (let i = 0; i < config.threads; i++) {
      const scrapper = browser.newPage().then(page => new Scrapper(page, new Logger()));
      scrappers.push(scrapper);
    }

    // transactions chunks, or indexed-array of array of transactions
    const chunks = [];

    // errored works
    const errors = [];
    // variables to control the loop
    let hasMore = true;
    let currentIndex = 0;
    let maxErrorTries = 10;

    const work = async function work(scrapper) {
      // get index of the page we will fetch
      let index;
      if (errors.length) {
        // retry errors first
        if (maxErrorTries-- <= 0) {
          // too many errors, stopping now
          logger.error('app:work → too many errors');
          return;
        }
        // get last errored work
        index = errors.pop();
      } else if (!hasMore) {
        // reached the end, and no error
        return;
      } else {
        // fetch next page
        index = currentIndex++;
      }

      try {
        // make our url from our index
        const url = config.url.replace('{START}', config.transactionsPerPage * index);

        // fetch transactions
        const start = Date.now();
        const data = await scrapper.fetch(url);
        const ms = Date.now() - start;

        // debug logging
        scrapper.logger.debug('Fetched data in ' + ms + 'ms:', '\n→', JSON.stringify(data).substr(0, 73) + '..');

        if (!data) {
          // data is invalid
          throw new Error('fetched invalid data: ' + JSON.stringify(data));
        } else if (data.length !== config.transactionsPerPage) {
          // success but we reached the end!
          hasMore = false;
        }

        // success, add chunk to result set
        chunks[index] = data;

        // DEBUG: stop after few requests
        // if (chunks.length >= 5) hasMore = false;
      } catch (error) {
        logger.error('app:work →', error);
        errors.push(index);
      }

      // and call the next work
      await work(scrapper);
    };

    // let's start all promises!
    await Promise.all(scrappers.map(scrapper => scrapper.then(work)));

    // close browser properly
    logger.debug('Closing...');
    await browser.close();

    if (hasMore || maxErrorTries <= 0) {
      // we failed
      logger.error('Failed to fetch transactions. Sorry.');
      process.exit(1);
    } else {
      // flatten chunks into one array
      const transactions = chunks.reduce((a, b) => a.concat(b), []);
      // log some transactions
      const json = JSON.stringify(transactions);
      logger.info('Ended with ' + transactions.length + ' transactions:', '\n' + json.substr(0, 300) + '   . . .   ' + json.slice(-300));
    }
  } catch (error) {
    await browser.close();
    logger.error('fatal error →', error);
    process.exit(2);
  }
});
