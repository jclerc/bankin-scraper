
// import puppeteer to work with Chrome headless
const puppeteer = require('puppeteer');
// file system helper
const fs = require('fs');
// our scraper class
const Scraper = require('./scraper');
// our logger utility
const Logger = require('./logger');
// and config values
const config = require('./config');

// setup logger
Logger.config = config.logger;
const logger = new Logger('APP');

// display stacktrace on unhandled rejection
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection:\n', error.stack);
});

// exit whole process on first Ctrl-C
process.on('SIGINT', async () => {
  logger.output(' → Received SIGINT');
  logger.warn('Exiting right now.');
  process.exit(100);
});

// on quit, display some performance stats
process.on('exit', () => {
  // time = how many seconds elapsed since start
  const time = process.uptime();
  // cpu = how much cpu time our script really took
  const { user, system } = process.cpuUsage();
  const cpu = ((user + system) / 1e6);
  logger.info(`Total script took ${time.toFixed(3)}s, cpu time ${cpu.toFixed(3)}s, using ${config.tabs} tabs`);
});

// starting now
logger.info('Starting...');
puppeteer.launch().then(async (browser) => {
  try {
    // close default tab
    browser.pages().then(pages => pages.forEach(page => page.close()));

    // our scraper array (holding promises)
    const scrapers = [];
    for (let i = 0; i < config.tabs; i++) {
      const scraper = browser.newPage().then(page => new Scraper(page, new Logger(), config.scraper));
      scrapers.push(scraper);
    }

    // transactions chunks, or indexed-array of array of transactions
    const chunks = [];

    // errored works
    const errors = [];
    // variables to control the loop
    let hasMore = true;
    let currentIndex = 0;
    let maxErrorTries = config.maxErrorTries;

    const work = async function work(scraper) {
      // get index of the page we will fetch
      let index;
      if (errors.length) {
        // retry errors first
        if (maxErrorTries-- <= 0) {
          // too many errors, stopping now
          scraper.logger.error('work → too many errors');
          return;
        }
        // get last errored work
        index = errors.pop();
      } else if (!hasMore) {
        // reached the end, and no error
        scraper.logger.debug('No more work to do for this scraper');
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
        const data = await scraper.fetch(url);
        const ms = Date.now() - start;

        if (!data) {
          // data is invalid
          throw new Error(`fetched invalid data: ${JSON.stringify(data)}`);
        } else if (data.length !== config.transactionsPerPage) {
          // success but we reached the end!
          hasMore = false;
        }

        // debug logging
        scraper.logger.info(`Fetched ${data.length} transactions for chunk #${index} in ${ms}ms`);
        scraper.logger.debug('→', `${JSON.stringify(data).substr(0, 57)}..`);

        // success, add chunk to result set
        chunks[index] = data;

        // DEBUG: stop after few requests
        // if (chunks.length >= 20) hasMore = false;
      } catch (error) {
        scraper.logger.error('work →', error);
        errors.push(index);
      }

      // and call the next work
      await work(scraper);
    };

    // let's start all promises!
    await Promise.all(scrapers.map(scraper => scraper.then(work)));

    // close browser properly
    logger.debug('Closing...');
    await browser.close();

    if (hasMore || maxErrorTries <= 0) {
      // we failed
      logger.error('Failed to fetch transactions. Maybe try to increase config.maxErrorTries?');
      process.exit(102);
    } else {
      // flatten chunks into one array
      const transactions = chunks.reduce((a, b) => a.concat(b), []);
      // log some transactions
      const json = JSON.stringify(transactions);
      logger.info(`Ended with ${transactions.length} transactions:`, `\n${json.substr(0, 300)}   . . .   ${json.slice(-300)}`);
      if (config.outputFile) {
        logger.info(`Writing results to file "${config.outputFile}" (${Math.floor(json.length / 1000)}kb)`);
        fs.writeFileSync(config.outputFile, `${json}\n`);
      }
    }
  } catch (error) {
    await browser.close();
    logger.error('fatal error →', error);
    process.exit(101);
  }
});
