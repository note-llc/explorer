var request = require('request');

var base_url = 'https://api.unnamed.exchange/v1/Public/';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + 'Ticker?market=' + coin.toLowerCase() + '_' + exchange.toLowerCase();
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null);
      } else {
        summary['bid'] = parseFloat(body['ticker']['buy']).toFixed(8);
        summary['ask'] = parseFloat(body['ticker']['sell']).toFixed(8);
        summary['volume'] = parseFloat(body['volume']).toFixed(8);
        summary['volume_btc'] = parseFloat(body['ticker']['quotevol']).toFixed(8);
        summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
        summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
        summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
        summary['change'] = parseFloat(body['change']).toFixed(2);
      }
    }
  });
}

// Does the format of the response matter?
function get_trades(coin, exchange, cb) {
  var req_url = base_url + "TradeHistory?market=" + coin.toLowerCase() + "_" + exchange.toLowerCase() + "&limit=50&order_by=desc";
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      return cb (null, body);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + 'depth?market=' + coin.toLowerCase() + exchange.toLowerCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, [], [])
    } else {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['bids'].length > 0){
        for (var i = 0; i < orders['bids'].length; i++) {
          var order = {
            amount: parseFloat(orders.bids[i][1]).toFixed(8),
            price: parseFloat(orders.bids[i][0]).toFixed(8),
            //  total: parseFloat(orders.bids[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.bids[i][1]).toFixed(8) * parseFloat(orders.bids[i][0])).toFixed(8)
          }
          buys.push(order);
        }
      } else {}
      if (orders['asks'].length > 0) {
        for (var x = 0; x < orders['asks'].length; x++) {
          var order = {
            amount: parseFloat(orders.asks[x][1]).toFixed(8),
            price: parseFloat(orders.asks[x][0]).toFixed(8),
            //    total: parseFloat(orders.asks[x].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.asks[x][1]).toFixed(8) * parseFloat(orders.asks[x][0])).toFixed(8)
          }
          sells.push(order);
        }
      } else {}
      var sells = sells.reverse();
      return cb(null, buys, sells);
    }
  });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_orders(coin, exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
