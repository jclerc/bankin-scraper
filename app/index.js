const puppeteer = require('puppeteer');
const config = require('./config');
const Logger = require('./logger');
const Scrapper = require('./scrapper');

const logger = new Logger('APP');

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
      if (done) return;

      let index;
      if (errors.length) {
        index = errors.pop();
      } else {
        index = i;
        i += 1;
      }

      try {
        const data = await scrapper.do(config.url.replace('{START}', 50 * index));
        logger.info('DATA LENGTH →', data ? data.length : 'null');
        logger.info('DATA →', JSON.stringify(data).substr(0, 70) + '..');

        if (data.length === 0) {
          done = true;
        } else {
          chunks[index] = data;
        }
      } catch (error) {
        logger.error('HERE WE ARE', error);
        errors.push(index);
      }

      await work(scrapper);
    };

    await Promise.all(scrappers.map(work));

    // const chunks = [];

    // let tries = 10000;
    // while (tries >= 0) {

    //   scrappers;

    //   tries -= 1;
    // }

    // const scraps = [];
    // for (let i = 0; i < 1; i++) {
    //   scraps.push(new Promise(async (resolve, reject) => {
    //     const page = await browser.newPage();
    //     const scrapper = new Scrapper(page, new Logger('@' + i));

    //     try {
    //       const data = await scrapper.do(config.url.replace('{START}', 10000 + 100 * i));
    //       logger.info('DATA LENGTH →', data ? data.length : 'null');
    //       logger.info('DATA →', JSON.stringify(data).substr(0, 70) + '..');
    //       resolve(data);
    //     } catch (error) {
    //       logger.error('HERE WE ARE', error);
    //     }
    //     reject();
    //   }));
    // }

    // const data = await Promise.all(scraps);
    logger.info('DATA', chunks);

    logger.info('Closing...');
    await browser.close();
  } catch (error) {
    logger.error('Error thrown:', error);
  }

  logger.info('Session ended!');
})();
