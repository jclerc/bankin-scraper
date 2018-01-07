
const setup = (page, logger) => {
  page.on('dialog', async (dialog) => {
    logger.log('Dialog:', dialog.message());
    dialog.dismiss();
    page.waitForSelector('#btnGenerate').then(async () => {
      const btnReload = await page.$('#btnGenerate');
      btnReload.click();
    });
  });
};

module.exports = setup;
