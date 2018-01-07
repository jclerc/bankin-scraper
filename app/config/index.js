
module.exports = {
  // url: 'https://web.bankin.com/challenge/index.html?start={START}',
  url: 'http://localhost:9000/?start={START}',
  threads: 1,
  transactionsPerPage: 50,
  logger: {
    debug: true,
    time: true,
  },
};
