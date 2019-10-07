const WebSocket = require('ws');

const Binance = require('./binance');
const enumSides = require('./enum-sides');

/**
 * Resets order book
 * @param symbol
 * @returns {Promise<Binance>}
 */
const reset = async(symbol) => {
    try {
        const snapshot = await Binance.getSnapShot(symbol);
        return new Binance(symbol, snapshot);
    }
    catch(e) {
        console.log('Reset Error: ', e.message);
    }
};

(async () => {
    const symbol = 'BTCUSDT';

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);
    // ws.on('open', function open() {
    //     ws.send('something');
    // });

    let binance, avgBuy, avgSell;
    ws.on('message', async(binanceData) => {
        const data = JSON.parse(binanceData);

        //get initial order book
        if(!binance) {
            binance = await reset(symbol);
            return;
        }

        const rule = binance.validate(data);
        if(rule) {
            if(rule === 5 || rule === 6) binance = await reset(symbol);
            return;
        }

        binance.updateOrderBook(data);


        //<editor-fold desc="Output">
        const newAvgBuy = binance.getPrice(enumSides.buy, 100);
        const newAvgSell = binance.getPrice(enumSides.sell, 100);
        const isNewAvgBuy = newAvgBuy !== avgBuy;
        const isNewAvgSell = newAvgSell !== avgSell;

        if(isNewAvgBuy || isNewAvgSell) {
            if(isNewAvgBuy) {
                console.log(`Avg Buy  : ${newAvgBuy.toFixed(8)}`);
                avgBuy = newAvgBuy;
            }
            if(isNewAvgSell) {
                console.log(`Avg Sell : ${newAvgSell.toFixed(8)}`);
                avgSell = newAvgSell;
            }

            /**************************/

            //<editor-fold desc="Aesthetics">
            // console.log(`\nLatest Update ID: ${data.u}`);
            // console.log(`Avg Buy  : ${newAvgBuy.toFixed(8)} ${isNewAvgBuy ? '(updated)':''}`);
            // console.log(`Avg Sell : ${newAvgSell.toFixed(8)} ${isNewAvgSell ? '(updated)':''}`);
            // if(isNewAvgBuy) avgBuy = newAvgBuy;
            // if(isNewAvgSell) avgSell = newAvgSell;
            //</editor-fold>
        }
        //</editor-fold>
    });
})();
