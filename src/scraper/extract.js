
/**
 * Extract transactions from given frame
 * Note: it needs to be a function for class context
 *
 * @param {Frame} frame
 * @returns {Array} list of transactions
 */
const extract = async function (frame) {
  // retrieve every rows
  const rows = await frame.$$eval('table tr', (nodes) => {
    // no nodes → error
    if (nodes.length === 0) throw new Error('didnt find any row');
    const transactions = [];
    // iterate over rows, skipping first (header)
    for (let i = 1; i < nodes.length; i++) {
      const { children } = nodes[i];
      const transaction = [];
      // get cells text
      for (let j = 0; j < children.length; j++) {
        transaction.push(children[j].textContent.trim());
      }
      // add transaction
      transactions.push(transaction);
    }
    return transactions;
  });

  // now we are parsing 3 cells text into proper object
  return rows.map((row, i) => {
    // check valid input
    if (row.length !== 3) {
      throw new Error(`invalid length in row #${i}: [${row.join('|')}]`);
    }

    // get any number in string, e.g.: "transaction 4" → 4
    const transaction = /\b\d+\b/.exec(row[1]);
    // get currency (before or after) and amount (+ or -, with decimals), skipping spaces
    // e.g.: "$32.40" → [$, 32.40], "-32,40 €" → [-32.40, €]
    const amount = /^(.*?) *(-?\d+(?:[,.]\d+)?) *(.*?)$/.exec(row[2]);

    if (!transaction || !amount) {
      // should never happen
      throw new Error(`cant parse transaction/amount in row #${i}: [${row.join('|')}]`);
    }

    // return new object
    return {
      account: row[0],
      transaction: parseInt(transaction[0], 10),
      amount: parseFloat(amount[2], 10),
      currency: amount[1] + amount[3], // one of those is empty (e.g.: "" + "€")
    };
  });
};

module.exports = extract;
