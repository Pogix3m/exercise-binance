const assert = require('assert');

const Binance = require('../binance');
describe('Binance Test', () => {
  const symbol = 'BTCUSDT';

  it('Validation', async () => {
    const binance = new Binance(symbol, {
      lastUpdateId: 100,
      bids: [
        [8175.68000000, 1],
      ],
      asks: [
        [8175.69000000, 1],
      ]
    });

    assert.equal(binance.validate({u: 10}, 1), 4);
    assert.equal(binance.validate({U: 102, u:103}, 1), 5);
  });
  it('Update Order Book', async () => {
    let binance = new Binance(symbol, {
      lastUpdateId: 100,
      bids: [],
      asks: []
    });

    let data = {
      U: 99,
      u: 104,
      b: [
        [8175.68000000, 1],
        [8175.67000000, 1],
        [8175.66000000, 1],
      ],
      a: [
        [8175.69000000, 1],
        [8175.70000000, 1],
        [8175.71000000, 1],
      ],
    };
    assert.equal(binance.validate(data, 1), 0);
    binance.updateOrderBook(data);
    assert.deepStrictEqual(binance.bids, data.b);
    assert.deepStrictEqual(binance.asks, data.a);

    data = {
      U: 105,
      u: 110,
      b: [
        [8175.69000000, 1],
        [8175.67000000, 2],
        [8175.66000000, 0],
        [8175.65000000, 1],
        [8175.64000000, 1],
      ],
      a: [
        [8175.68100000, 1],
        [8175.70000000, 2],
        [8175.71000000, 0],
        [8175.72000000, 1],
        [8175.73000000, 1],
      ],
    };

    assert.equal(binance.validate(data, 1), 0);
    binance.updateOrderBook(data);
    assert.deepStrictEqual(binance.bids, [
      [8175.69000000, 1],
      [8175.68000000, 1],
      [8175.67000000, 2],
      [8175.65000000, 1],
      [8175.64000000, 1],
    ]);
    assert.deepStrictEqual(binance.asks, [
      [8175.68100000, 1],
      [8175.69000000, 1],
      [8175.70000000, 2],
      [8175.72000000, 1],
      [8175.73000000, 1],
    ]);

    assert.equal(binance.validate({U: 112, u:113}, 1), 6);

    // assert.equal(binance.getPrice('buy', 1), 6);
    assert.equal(binance.getPrice('buy', 2), 8175.685);
    assert.equal(binance.getPrice('sell', 2), 8175.6855);

    assert.equal(binance.getPrice('buy', 10), 8175.66666667);
    assert.equal(binance.getPrice('sell', 10), 8175.7035);
  });
});
