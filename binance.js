const request = require('request-promise');
const fs = require('fs');

const log = (file, message) => {
    setTimeout(() => {
        const current = new Date();
        const strCurrent = `${current.getFullYear()}.${(current.getMonth() + 1).toString().padStart(2, '0')}.${current.getDate().toString().padStart(2, '0')} ${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}:${current.getSeconds().toString().padStart(2, '0')}`;
        // const file = fs.createWriteStream('./big.file');
        fs.appendFile(`./logs/${file}.txt`, `${strCurrent}: ${message}\n`, (err) => {
            if(err) console.log('Error in logging');
        });

    }, 0);
};
const logCheck = (file, {side, avg, orders, updateId}) => {
    setTimeout(() => {
        const message = `\nUpdate Id: ${updateId}\n` +
                        `Avg(${side}): ${avg}\n` +
                        JSON.stringify(orders);

        // const file = fs.createWriteStream('./big.file');
        fs.appendFile(`./logs/${file}-check.txt`, `${message}\n`, (err) => {
            if(err) console.log('Error in logging check');
        });

    }, 0);
};


const round = (value, decimals=8) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
};

class Binance {
    constructor(symbol, orderBook, check) {
        this.symbol = symbol;
        this.lastUpdateId = orderBook.lastUpdateId;
        this.bids = orderBook.bids;
        this.asks = orderBook.asks;

        this.first = 1;
        this.previousFinalUpdate = null;

        const current = new Date();
        this._logFileName = `${current.getFullYear()}.${(current.getMonth() + 1).toString().padStart(2, '0')}.${current.getDate().toString().padStart(2, '0')} ${current.getHours().toString().padStart(2, '0')}${current.getMinutes().toString().padStart(2, '0')}`;
        this.check = check;
    }

    static async getSnapShot(symbol) {
        return await request({
            method: 'GET',
            url: `https://www.binance.com/api/v1/depth?symbol=${symbol.toUpperCase()}&limit=1000`,
            json: true,
        });
    }

    validate(data, skipLog=0) {
        const {lastUpdateId, previousFinalUpdate, first} = this;
        const {u: finalUpdate, U: firstUpdate,} = data;
        let rule=0;

        // console.log('firstUpdate: ', firstUpdate);
        // console.log('finalUpdate: ', finalUpdate);
        // console.log('lastUpdateId: ', lastUpdateId);
        if(finalUpdate <= lastUpdateId) {
            rule=4;
        }

        // console.log('condition: ', (!(firstUpdate <= lastUpdateId+1 && finalUpdate >= lastUpdateId+1)));
        if(!rule && first) {
            this.first = 0;
            if (!(firstUpdate <= lastUpdateId + 1 &&  lastUpdateId + 1 <= finalUpdate))
                rule = 5;
        }

        if(previousFinalUpdate && !rule && firstUpdate !== previousFinalUpdate + 1) {
            rule = 6;
        }

        if(rule) {
            let message = `Invalid for #${rule}\n`;
            switch(rule) {
                case 4:
                    message += `finalUpdate: ${finalUpdate}\n`;
                    message += `lastUpdateId: ${lastUpdateId}\n`;
                    break;

                case 5:
                    message += `firstUpdate: ${firstUpdate}\n`;
                    message += `finalUpdate: ${finalUpdate}\n`;
                    message += `lastUpdateId: ${lastUpdateId}\n`;
                    break;

                case 6:
                    message += `firstUpdate: ${firstUpdate}\n`;
                    message += `previousFinalUpdate: ${previousFinalUpdate}\n`;
                    break;
            }

            if(!skipLog) log(this._logFileName, message);
        }

        return rule;
    }

    updateOrderBook(data) {
        const {U: firstUpdate, u: finalUpdate, b: newBids, a: newAsks} = data;
        const {bids, asks} = this;

        if(!this.previousFinalUpdate)
            this.previousFinalUpdate = firstUpdate-1;

        if(this.first) this.first = 0;

        //<editor-fold desc="Bids">
        for(let i=0; i<newBids.length; i++) {
            const newBid = newBids[i];

            if(!bids.length) bids.push(newBid);
            else {
                for (let ii = 0; ii < bids.length; ii++) {
                    const bid = bids[ii];

                    if (+newBid[0] === +bid[0]) {
                        if (+newBid[1]) bid[1] = newBid[1];
                        else {
                            bids.splice(ii, 1);
                        }
                        break;
                    } else if (+newBid[1]) {
                        if (+newBid[0] >+ bid[0]) {
                            //insert before
                            bids.splice(ii, 0, newBid);
                            break;
                        } else if (ii === bids.length - 1) {
                            //insert at last if has quantity
                            bids.push(newBid);
                        }
                    }
                }
            }
        }
        //</editor-fold>
        
        //<editor-fold desc="Asks">
        for(let i=0; i<newAsks.length; i++) {
            const newAsk = newAsks[i];

            if(!asks.length) asks.push(newAsk);
            else {
                for (let ii = 0; ii < asks.length; ii++) {
                    const ask = asks[ii];

                    if (+newAsk[0] === +ask[0]) {
                        if (+newAsk[1]) ask[1] = newAsk[1];
                        else {
                            asks.splice(ii, 1);
                        }
                        break;
                    } else if (+newAsk[1]) {
                        if (+newAsk[0] < +ask[0]) {
                            //insert before
                            asks.splice(ii, 0, newAsk);
                            break;
                        } else if (ii === asks.length - 1) {
                            //insert at last if has quantity
                            asks.push(newAsk);
                        }
                    }
                }
            }
        }
        //</editor-fold>

        this.previousFinalUpdate = finalUpdate;
    }

    getPrice(side, quantity) {
        const {bids, asks} = this;
        let qty = quantity;
        let sum = 0;
        const orders = [];
        if(side === 'buy') orders.push(...bids);
        if(side === 'sell') orders.push(...asks);

        if(!orders.length) return 0;

        for(let i=0; i<orders.length && qty; i++) {
            const order = orders[i];

            if(order[1] >= qty) {
                sum += round(order[0] * qty);
                qty = 0;
            }
            else {
                sum += round(order[0] * order[1]);
                qty  = round(qty - order[1]);
            }
        }

        const avg = round(sum/(quantity-qty));

        if(this.check) logCheck(this._logFileName, {side, avg, orders, updateId: this.previousFinalUpdate});

        return avg;
    }
}

module.exports = Binance;