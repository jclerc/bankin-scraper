# Bankin Scraper

<p align="center">
  <a href="https://imgur.com/a/DYMhQ" target="_blank">
    <img src="https://i.imgur.com/ukk3N8F.gif" alt="yarn start" />
  </a>
  <a href="https://imgur.com/a/DYMhQ" target="_blank">
    <img src="https://i.imgur.com/QLxFEKb.gif" alt="yarn start inject" />
  </a>
  <br>
  <em>Left: normal scraping method, <b>9.94s</b> using <code>yarn start</code></em> | <em>Right: use script injection, <b>1.98s</b> with <code>yarn start inject</code></em>
</p>

## What is it?

This is a solution to the [engineering challenge](/CHALLENGE.md) of Bankin, where we were asked to scrap a website to get all transactions from it.

## How can I run it?

```shell
git clone https://github.com/JClerc/BankinScraper.git
cd BankinScraper
yarn # or npm install
```

To start with default configuration, simply do **`yarn start`** (or `npm start`). It will use 32 tabs, with logs printed to console, and transactions stored in `output.json`.

But for advanced usage, run `node src` (or `yarn start help`) to print some help on how cli arguments can change script behavior. Some examples:

- `node src default` use default configuration (same as `yarn start`)
- `node src stdout 64` print transactions to stdout (instead of file) with 64 tabs
- `node src inject` use script injection (explained later in this README)

#### Notes

- To suppress logs, simply use `2>/dev/null`
- You can append arguments to `yarn start` directly, e.g.: `yarn start timeout 16`
- Default configuration is in `src/config/default.js`
- More cli arguments can be defined in `src/config/extensions.js`
- Don't use `yarn start` with `stdout`, as yarn prints some lines in stdout too

## How does it works?

It was built on `node 9.3.0`, using `puppeteer 0.13.0` to manipulate `Headless Chrome 63`.
More technically speaking, the script starts the browser without its interface, open some tabs to fetch multiple pages simultaneously.
As soon as a tab fetched the data, it goes to the next url and so on, until there is no more transactions.
Per default, it will use 32 tabs.

To better understand how it works, take a look at these files:
- `src/index.js` main logic, browser management and recursive system _(94 lines of code)_
- `src/scraper/index.js` scraper class, handle one tab at a time _(27 lines of code)_
- `src/scraper/navigate.js` navigate to an url and wait for transactions to be in DOM _(17 lines of code)_
- `src/scraper/extract.js` extract the list of transactions from the DOM _(32 lines of code)_
Note: the code complies to airbnb style guide, and is validated using `yarn lint`.

## How many tabs to use?

Pretty obviously, the more tabs are used, the faster data is fetched, but more memory is needed.
Here is some measures (with a bad but constant network):

| tabs            | 1      | 2      | 4      | 8      | 16     | 32     | 64      |
|-----------------|--------|--------|--------|--------|--------|--------|---------|
| time _(in sec)_ | 179.51 | 93.16  | 49.1   | 27.51  | 16.88  | 12.7   | 11.66   |
| cpu _(in sec)_  | 3.96   | 4.12   | 4.13   | 4.42   | 4.72   | 5.15   | 6.63    |
| mem _(in mb)_   | 85.14  | 104.60 | 144.28 | 216.78 | 357.49 | 630.05 | 1175.56 |

_`cpu` here is measured by `time` command, and represent how much cpu time the process actually took_

Here we have some data to decide how many tabs we need.
For instance, using 32 to 64 tabs make it a little bit faster, but it almost takes 2x more memory.
So for good performances, it is better to use **32 tabs**.

To determine the most efficient configuration, we can approximate how many times we can run the script per hour and per gb of ram: `x = 3600/time * (1000/mem)`.
Here are the results:

| tabs            | 1      | 2      | 4      | 8      | 16     | 32     | 64      |
|-----------------|--------|--------|--------|--------|--------|--------|---------|
| scraps/h/gb     | 235.55 | 369.45 | 508.17 | 603.65 | 596.58 | 449.91 | 262.64  |

In a graphical way:
![chart](https://i.imgur.com/2FIyYHU.jpg)\
_The left chart is on a linear scale, right chart on a logarithm one_

So using anything between 8 to 16 tabs will allow us to make ±600 scraps per hour using 1gb of ram.
Thus, the most efficient should be something like 12 tabs. But using 16 tabs is nearly equally efficient while being considerably faster for the end-user.

As a conclusion, depending on our needs, we can use:
- **16 tabs** for efficiency (e.g. when many users are connected in the same time)
- **32 tabs** for performances (e.g. for off-peak hours)

#### Some notes

Here we take advantage of the fact we know there is 100 pages of transactions to fetch.
If, for instance, the user would have just 2, then many tabs would be opened for nothing.

Hopefully, this can be easily avoided.\
If we scraped the user in the past, we can estimate how many transactions (and thus pages) he would have.\
If we don't know, then we can edit our code to open more tabs (up to 16) each time a new transaction page is found.
For instance, we start with 2 tabs, if a 3rd page is found, we open 4 more tabs, and so on.

------

## Can we make it faster?

Yes, but what will follow may not be applicable for real bank pages. Note that the following methods are disabled by default in the config.

#### Using timeout

If delay of the page is somewhat random, we can lower the timeout, so if the page is slow we scrap the same page again and hope that the second try (or 3rd) will be faster.
This works great for our challenge where delay is randomized.

To test that, run `yarn start timeout`.
It will use 16 tabs and throw a lot of errors but it will query all transactions in more or less 7 seconds!

#### Using reverse-engineering

But we can make it faster by analyzing a bit the page we scrap. `Math.random` is called several times to define what the page will do:
- print a dialog if `(Math.random() * 100) % 2 === 0`
- if `(Math.random() * 100) % 2` is 1, transactions are in a `<table>`, if it is 0, they are in an `<iframe>`
- a delay is made if `(Math.random() * 100) % 2 === 0`
- that delay will be `1000 * Math.floor((Math.random() * 100 % 8))` (0 to 7000)

So evaluating the following code before any script is enough to avoid any dialog, display transactions in a table and avoiding any delay.
```js
Math.random = () => 0.99; # or any odd value
```

Moreover, the `doGenerate` function and `start` variable are globals, so we can increase `start` and call `goGenerate()` many times to generate all the transactions.
We just have to handle two things:
1. `Element.prototype.appendChild` to prevent `<th>` headers, except the first one
2. `document.getElementById` so we make a `Proxy` around `#dvTable` to prevent `innerHTML` to be cleared on `doGenerate()`

You can test it by running `yarn start inject`. Doing so, all transactions are fetched in **2 seconds** :)

As a side note, while this is highly specific to this challenge and won't work on any other page, I think this kind of technic can still be used for scraping real banks.
It may be by cancelling useless requests (CSS, images, ads...), or injecting javascript to change the page behaviour.

> But the challenge was only about speed, right?

------

## Page issues

We had to scrape [`https://web.bankin.com/challenge/index.html`](https://web.bankin.com/challenge/index.html), where transactions are generated on the client side.
It uses some crypto-stuff to generate "randomly" (but using the same seed) transaction amounts, this led to few issues:

1. Amounts are different depending on browser used. On Google Chrome, `Transaction 38` is `82€`, while on Safari the same transaction is `90€`.
2. Transaction amounts change depending on `start` parameter. `start=0` → `Transaction 5` is 101€, for `start=1` → `Transaction 5` is 100€, for `start=2` → `Transaction 5` is 99€ and so on.
3. `start` parameter can be any negative value, e.g. `-1000000000`, `-1e200` or even `-Infinity`, or float like `3.14`.
