
(function () {

  const delay = setTimeout;

  setTimeout = (callback, time) => {
    console.log('DELAY', time);
    delay(callback, time);
  };

  const mathRandom = Math.random;
  let i = 0;

  Math.random = () => {
    let val;
    switch (i) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        // success or not
        // must be: (val * 100) % 2 == "1"
        // val = 0.01;
        break;
      case 3:
        // display
        // (val * 100) % 2 === {0 -> iframe, 1 -> table}
        // val = 0.01;
        break;
      case 4:
        // delay or not
        // 0 = delay, 1 = instant
        // val = 0.00;
        break;
      case 5:
        // delay timeout = 1000 * Math.floor((Math.random() * 100 % 8))
        // val = 0.07; // max timeout
        break;
    }
    // console.log('random #' + i + ' ->', val);
    i++;
    return typeof val === 'undefined' ? mathRandom() : val;
  }

})();
