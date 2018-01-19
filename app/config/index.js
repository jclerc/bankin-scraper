
// merge objects recursively
const deepmerge = require('deepmerge');
// colors utils
const colors = require('colors/safe');
// the base config (default)
const base = require('./default');
// extensions to extend config
const extensions = require('./extensions');

// get our args (without leading dashes, e.g. "--inject" is same as "inject")
const args = process.argv.slice(2).map(arg => arg.replace(/-/g, ''));

// no args -> print help
if (args.length === 0 || args.some(arg => arg === 'h' || arg === 'help')) {
  console.log(`\n${colors.blue('HELP')} Please append a configuration name to start:`);

  const help = (name, desc) => `${colors.gray('-')} node app ${colors.white(name)} ${colors.gray(`# ${desc}`)}`;

  console.log(help('default', 'the default configuration - recommended'));
  Object.entries(extensions).forEach(([name, ext]) => {
    console.log(help(name, ext.description));
  });
  console.log(`\nMore information in ${colors.underline('README.md')} file!\n`);

  // success as we asked for help
  process.exit(0);
}

// default = no extension, so remove from args
const defaults = ['', 'def', 'default'];
const params = args.filter(arg => defaults.indexOf(arg) === -1);

// check if other params are binded to extensions
const invalid = params.filter(arg => !extensions[arg]);
if (invalid.length > 0) {
  console.log(`${colors.red('ERROR')} invalid configuration extensions: ${invalid.join(', ')}`);
  console.log(`Valids are: ${['default', ...Object.keys(extensions)].join(', ')}`);
  // error as it wasn't expected
  process.exit(110);
}

// make our config
const config = params.reduce((obj, param) => deepmerge(obj, extensions[param].config), base);

module.exports = config;
