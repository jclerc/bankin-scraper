
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
  // print "node src <cmd> # <desc>"
  const usage = (cmd, desc) => {
    console.log(`${colors.gray('-')} node src ${colors.white(cmd)} ${colors.gray(`# ${desc}`)}`);
  };

  // usage
  console.log(`\n${colors.blue('USAGE')} node src [configuration ...] [tabs]`);

  // help
  console.log(`\n${colors.blue('HELP')} Please append at least one configuration name to start:`);
  // show all extensions
  Object.entries(extensions).forEach(([name, ext]) => usage(name, ext.description));
  console.log('You can also specify a number for tabs.');

  // examples
  console.log(`\n${colors.blue('EXAMPLES')}`);
  [
    ['default', 'use default configuration - good place to start!'],
    ['default 64', 'default configuration with 64 tabs'],
    ['inject stdout', 'use injection and prints results to stdout'],
  ].forEach(([cmd, desc]) => usage(cmd, desc));

  // more informations
  console.log(`\nMore information in ${colors.underline('README.md')} file!\n`);

  // success as we asked for help
  process.exit(0);
}

// check if args are binded to valid extensions or integers (for tabs)
const invalid = args.filter(arg => !extensions[arg] && !(parseInt(arg, 10) > 0)); // NaN<0 is false
if (invalid.length > 0) {
  console.log(`\n${colors.red('ERROR')} invalid configuration extensions: ${invalid.join(', ')}`);
  console.log(`Valids are: ${Object.keys(extensions).map(ext => colors.white(ext)).join(', ')}, or any integer for # tabs\n`);
  // error as it wasn't expected
  process.exit(110);
}

// make our config
const config = args.reduce((conf, arg) => {
  const val = parseInt(arg, 10);
  return (val > 0)
    ? { ...conf, tabs: val } // update tabs
    : deepmerge(conf, extensions[arg].config); // merge extension
}, base);

module.exports = config;
