console.time('__app__');
console.time('# import');

const puppeteer = require('puppeteer');

console.timeEnd('# import');
console.time('# init');

// const base = 'https://web.bankin.com/challenge/index.html?start=';
const base = 'http://localhost:9000/index.html?start=';
const start = process.argv.length >= 3 ? process.argv[2] : '0';
const url = base + start;

// table row to correct json
const parse = (row) => {
  if (!row || row.length < 3) {
    return null;
  }

  var transaction = /\b\d+\b/.exec(row[1]);
  var amount = /^(.*?) *(-?\d+(?:[,.]\d+)?) *(.*?)$/.exec(row[2]);

  if (!transaction || !amount) {
    return null;
  }

  return {
    'account': row[0],
    'transaction': parseInt(transaction[0], 10),
    'amount': parseFloat(amount[2], 10),
    'currency': amount[1] + amount[3],
  };
};

// fetch transactions from table
const scrap = async (frame) => {
  const x = await frame.$$eval('table tr', nodes => {
    const transactions = [];
    for (let i = 1; i < nodes.length; i++) {
      const children = nodes[i].children;
      const transaction = [];
      for (let j = 0; j < children.length; j++) {
        transaction.push(children[j].innerText);
      }
      transactions.push(transaction);
    }
    return transactions;
  });
  console.timeEnd('# scrap');
  console.time('# parse');
  const y = x.map(parse);
  console.timeEnd('# parse');
  return y;
};

(async () => {
  try {
    console.timeEnd('# init');

    console.time('# startup');
    console.log('Starting...');
    const browser = await puppeteer.launch();
    console.timeEnd('# startup');
    console.time('# page');
    const page = await browser.newPage();
    console.timeEnd('# page');

    console.time('__fetch__');

    console.time('# events');
    console.log('Attaching events...');
    page.on('dialog', async (dialog) => {
      console.time('# dialog #async');
      console.log('Dialog:', dialog.message());
      dialog.dismiss();
      page.waitForSelector('#btnGenerate').then(async () => {
        const btnReload = await page.$('#btnGenerate');
        btnReload.click();
        console.timeEnd('# dialog #async');
      });
    });
    console.timeEnd('# events');

    console.time('# load');
    console.log('Navigate to ' + url);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.timeEnd('# load');

    console.time('# wait');
    console.log('Wait for table or iframe');
    let timeout;
    const data = await Promise.race([
      page.waitForSelector('#dvTable table').then(() => {
        console.timeEnd('# wait');
        console.log('Found: table');
        console.time('# scrap');
        return scrap(page);
      }),
      page.waitForSelector('iframe#fm').then(() => {
        console.timeEnd('# wait');
        console.log('Found: iframe');
        const frame = page.frames().find(f => f.name() === 'fm');
        console.time('# scrap');
        return scrap(frame);
      }),
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          console.log('Timeout!');
          resolve(null);
        }, 3000 * 1.15);
      }),
    ]);

    if (timeout) clearTimeout(timeout);

    console.timeEnd('__fetch__');
    console.log('DATA LENGTH →', data ? data.length : 'null');
    console.log('DATA →', JSON.stringify(data).substr(0, 70) + '..');
    // console.log('DATA RAW →', data);

    console.log('Closing...');
    console.time('# close');
    await browser.close();
    console.timeEnd('# close');
  } catch (error) {
    console.error('Error thrown:', error);
  }

  console.log('Session ended!');
  console.timeEnd('__app__');
})();
