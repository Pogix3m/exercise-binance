const WebSocket = require('ws');
const fs = require('fs');

const Binance = require('./binance');

let check=false;
process.argv.forEach(function (val, index,) {
    if(val === '--check')
        check = true;
});

const reset = async(symbol) => {
    try {
        const snapshot = await Binance.getSnapShot(symbol);
        return new Binance(symbol, snapshot, check);
    }
    catch(e) {
        console.log('Reset Error');
    }
};

(async () => {
    const symbol = 'BTCUSDT';


    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth`);
    // ws.on('open', function open() {
    //     ws.send('something');
    // });

    let binance;// = await reset(symbol);
    ws.on('message', async(binanceData) => {
        const data = JSON.parse(binanceData);

        if(!binance) {
            binance = await reset(symbol);
            return;
        }

        const rule = binance.validate(data);
        if(rule === 5 || rule === 6) {
            binance = await reset(symbol);
            return;
        }

        binance.updateOrderBook(data);

        console.log(`\nFinal Update ID: ${data.u}`);
        console.log('Avg. Buy : ', binance.getPrice('buy', 100).toFixed(8));
        console.log('Avg. Sell: ', binance.getPrice('sell', 100).toFixed(8));
    });
})();
