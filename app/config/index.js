
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
  Object.entries(extensions).forEach(([name, ext]) => {
    console.log(`${colors.gray('-')} node app ${colors.white(name)} ${colors.gray(`# ${ext.description}`)}`);
  });
  console.log(`\nMore information in ${colors.underline('README.md')} file!\n`);

  // success as we asked for help
  process.exit(0);
}

// check if args are binded to invalid extensions
const invalid = args.filter(arg => !extensions[arg]);
if (invalid.length > 0) {
  console.log(`${colors.red('ERROR')} invalid configuration extensions: ${invalid.join(', ')}`);
  console.log(`Valids are: ${Object.keys(extensions).join(', ')}`);
  // error as it wasn't expected
  process.exit(110);
}

// make our config
const config = args.reduce((obj, param) => deepmerge(obj, extensions[param].config), base);

module.exports = config;
