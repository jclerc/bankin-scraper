
const parse = async (frame) => {
  const rows = await frame.$$eval('table tr', (nodes) => {
    const transactions = [];
    for (let i = 1; i < nodes.length; i++) {
      const children = nodes[i].children;
      const transaction = [];
      for (let j = 0; j < children.length; j++) {
        transaction.push(children[j].innerText);
      }
      transactions.push(transaction);
    }
    return transactions;
  });

  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length !== 3) {
      // should never happen
      return null;
    }

    const transaction = /\b\d+\b/.exec(row[1]);
    const amount = /^(.*?) *(-?\d+(?:[,.]\d+)?) *(.*?)$/.exec(row[2]);

    if (!transaction || !amount) {
      // should never happen
      return null;
    }

    data.push({
      account: row[0],
      transaction: parseInt(transaction[0], 10),
      amount: parseFloat(amount[2], 10),
      currency: amount[1] + amount[3],
    });
  }
  return data;
};

module.exports = parse;
