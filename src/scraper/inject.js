
/**
 * This code will be executed in document context
 * It will display all 4999 transactions, without neither alert, nor delay
*/
/* eslint no-undef: "off" */
const inject = () => {
  // prevent alert and delay, and results will always be in #dvTable (see README.md)
  Math.random = () => 0.99;

  // save Element.appendChild reference
  const { appendChild } = Element.prototype;
  let firstHeader = true;
  // and override prototype
  Element.prototype.appendChild = function (node) {
    // call real method first (to have tables in right order)
    const ret = appendChild.apply(this, [node]);
    // if it's a <table>
    if (ret.nodeName === 'TABLE') {
      if (firstHeader) {
        // first header = ok
        firstHeader = false;
      } else {
        // all other headers = remove them
        ret.children[0].children[0].remove();
      }
      // if we got 50+ transactions
      if (ret.children[0].childElementCount >= 50) {
        // then generate next table
        start += 50;
        doGenerate();
      }
    }
    return ret;
  };

  // save document.getElementById reference
  const byId = document.getElementById.bind(document);
  // and override method
  document.getElementById = (id) => {
    // call real method
    const node = byId(id);
    if (id !== 'dvTable') {
      // if not #dvTable, return node
      return node;
    }

    // proxy #dvTable node
    return new Proxy(node, {
      get: (target, prop) => {
        // getter: reflect normal behavior
        let x = Reflect.get(target, prop);
        // ensure function has correct `this` context
        if (typeof x === 'function') x = x.bind(target);
        return x;
      },
      set: (target, prop, value) => {
        // setter: if we tried to clear <table> on doGenerate() -> do nothing
        if (prop === 'innerHTML' && value.trim() === '') return true;
        // otherwise, reflect normal behavior
        return Reflect.set(target, prop, value);
      },
    });
  };
};

module.exports = inject;
