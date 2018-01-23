
// extensions are used to quickly change configuration directly from command line
module.exports = {

  default: {
    description: 'the default configuration - recommended',
    config: {},
  },

  timeout: {
    description: 'x2 faster using lower timeout to retry slow requests',
    config: {
      scraper: {
        timeout: 300,
      },
      maxErrorTries: 200,
      tabs: 16,
    },
  },

  inject: {
    description: 'x5 faster by injecting javascript into pages',
    config: {
      scraper: {
        inject: true,
      },
      tabs: 16,
    },
  },

  stdout: {
    description: 'print results to stdout',
    config: {
      output: true,
    },
  },

};
