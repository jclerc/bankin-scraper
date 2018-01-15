# Bankin scraper

![terminal](https://i.imgur.com/gcCUUUt.gif)

## What is it?

This is a solution to the [engineering challenge](/CHALLENGE.md) of Bankin, where we were asked to scrap a website to get all transactions from it.

## How can I run it?

```shell
git clone https://github.com/JClerc/BankinScraper.git
cd BankinScraper
yarn # or npm install
```

And start by running **`node app`**!

## How it works?

It was built on `node 9.3.0`, using `puppeteer 0.13.0` to manipulate `Headless Chrome 63`.
More technically speaking, the script starts the browser without its interface, open some tabs to fetch multiple pages simultanously.
As soon as a tab fetched the data, it goes to the next url and so on, until there is no more transactions.
Per default, it will use 16 tabs.

## Why 16 tabs?

Pretty obviously, the more tabs are used, the faster data is fetched, but more memory is needed.
Here is some measures:

| tabs            | 1      | 2      | 4      | 8      | 16     | 32     | 64      |
|-----------------|--------|--------|--------|--------|--------|--------|---------|
| time _(in sec)_ | 179.51 | 93.16  | 49.1   | 27.51  | 16.88  | 12.7   | 11.66   |
| cpu _(in sec)_  | 3.96   | 4.12   | 4.13   | 4.42   | 4.72   | 5.15   | 6.63    |
| mem _(in mb)_   | 85.14  | 104.60 | 144.28 | 216.78 | 357.49 | 630.05 | 1175.56 |

_`cpu` here is measured by time command, and represent how much cpu time the process actually took_

Now, deciding how much tabs we need isn't that obvious.
For instance, using 32 to 64 tabs make it slightly faster, but it takes almost 2x more memory.
But we can make an approximation on how many times we can run the script per hour and per gb of ram: `x = 3600/time * (1000/mem)`.
Here are the results:

| tabs            | 1      | 2      | 4      | 8      | 16     | 32     | 64      |
|-----------------|--------|--------|--------|--------|--------|--------|---------|
| scraps/h/gb     | 235.55 | 369.45 | 508.17 | 603.65 | 596.58 | 449.91 | 262.64  |

In a graphical way:
![chart](https://i.imgur.com/2FIyYHU.jpg)\
_Left chart is on a linear scale, right chart on a logarithm one_

So using anything between 8 to 16 tabs will allow us to make ±600 scraps per hour using 1gb of ram.
Thus, the most efficient should be something like 12 tabs, but using 16 tabs is nearly equally efficient while being considerably faster for the end-user.

As a conclusion, **16 tabs** seems to be the best considering both efficiency and wait time for the end-user, with an average of **16.8 seconds**.

#### Some notes

Here we take advantage of the fact we know there is 100 pages of transactions to fetch.
If, for instance, the user would have just 2, then 14 tabs would be opened for nothing.

Hopefully, this can be be easily avoided.\
If we scrapped the user in the past, we can estimate how many transactions (and thus pages) he would have.\
If we don't know, then we can edit our code to open more tabs (up to 16) each time a new transaction page is found.
For instance, we start with 2 tabs, if a 3rd page is found, we open 2 more tabs, and so on.

------

## Can we make it faster?

Yes, but what will follow may not be applicable for real bank pages. Note that the following methods are disabled by default in the config.

#### Using timeout

If delay of the page is somewhat random, we can lower the timeout, so if the page is slow we scrap the same page again and hope that the second try (or 3rd) will be faster.
This works great for our challenge where delay is randomized.

To test that, edit the config and set `timeout: 400` and `maxErrorTries: 200`.
Using 16 tabs, it will throw a lot of errors but it will query all transactions in more or less 7 seconds!

#### Using reverse-engineering

But we can make it faster by analyzing a bit the page we scrap. `Math.random` is called several times to define what the page will do:
- print a dialog if `(Math.random() * 100) % 2 === 0`
- if `(Math.random() * 100) % 2` is 1, transactions are in a `<table>`, if it is 0, they are in an `<iframe>`
- a delay is made if `(Math.random() * 100) % 2 === 0`
- that delay will be `1000 * Math.floor((Math.random() * 100 % 8))` (0 to 7000)

So evaluating the following code before any script is enough to avoid any dialog, display transactions in table and avoiding any delay.
```js
Math.random = () => 0.99; # or any odd value
```

You can test it by setting `inject: true` in config _(you can revert previous changes made for timeout if you did)_. Doing so, using 16 tabs, all transactions are fetched in less than **3 seconds** :)

As a side note, while this is highly specific to this challenge and won't work on any other page, I think this kind of technic can still be used for scrapping real banks.
It may be by cancelling useless requests (CSS, images, ads...), or injecting javascript to change the page behaviour.

_But the challenge was only about speed, right?_

![terminal](https://i.imgur.com/8Hj6uSW.gif)
