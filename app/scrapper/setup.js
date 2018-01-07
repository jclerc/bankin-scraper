
// needs to be a function for this
const setup = function () {
  // page events are persistent accross navigation, so they are registered at start
  // dismiss any dialog
  this.page.on('dialog', async (dialog) => {
    this.logger.debug('Dialog:', dialog.message());
    await dialog.dismiss();
  });

  this.logger.debug('Scrapper initialized!');
};

module.exports = setup;
