
# How To Start
1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
3. Install your dependencies

    ```
    npm install
    ```
4. Run

    ```
    npm run start
    ```

5. Test 

    ```
    npm run test
    ```

# Problem
Binance Websocket Docs: https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md

Websocket Endpoint: https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#diff-depth-stream

How to maintain a local order book: https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly

Your task is to subscribe to the aforementioned Binance endpoint at 100ms frequency for the symbol "BTCUSDT". The order book should be a  data structure being a collection of total quantity and price per price level sorted by price.  The best bid price is the highest price on the buy side.  The best ask price is the lowest price on the sell side.

Once you have a local order book data structure being updated correctly via the websocket, you will need to create a function "getPrice(side, quantity)" that will calculate the weighted average price. You can do this by stepping through the order book from best price to worst price until you have filled the required quantity. Then you can return the average trade price for the order.

Finally the program should output the values for getPrice("buy",100) and getPrice("sell",100) to the console every time the values change.
