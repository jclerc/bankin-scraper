
// here is the default configuration
module.exports = {
  // define url to scrap
  url: 'https://web.bankin.com/challenge/index.html?start={START}',
  // url: 'http://localhost:9000/index.html?start={START}',

  // used to get next url (start parameter)
  transactionsPerPage: 50,

  // logger config
  logger: {
    // whether to print debug or not
    debug: false,
    // whether to prefix each line with time or not
    time: true,
    // whether to disable all logs or not
    silent: false,
  },

  // scraper option
  scraper: {
    // set timeout to 300 = timeout early + retry if delay
    // up to 3x faster, but much more errors (set maxErrorTries to 200)
    // default is 8500 = no errors
    timeout: 8500,
    // inject custom js into page to make it error-less
    inject: false,
  },

  // how many chrome tabs will be used (or parallel scrapers)
  // tip: 32 for performance, 12 for efficiency, 16 for both
  tabs: 32,

  // how many retries allowed
  maxErrorTries: 20,

  // set to true to print results to stdout
  // set to any string to store in the path
  // set to false to prevent this
  output: './output.json',
};
