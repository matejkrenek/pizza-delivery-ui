/*
  * Server 
  * 
*/

// Dependencies
var url = require('url');
var http = require('http');
var https = require('https')
var stringDecoder = require('string_decoder').StringDecoder;
var handlers = require('./handlers');
var helpers = require('./helpers');
var config = require('./config')
var fs = require('fs')

var server = {}

server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
})

server.httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    unifiedServer(req, res)
}) 


server.unifiedServer = function(req, res){
    var parsedUrl = url.parse(req.url, true);

    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var method = req.method.toLowerCase();

    var queryStringObject = parsedUrl.query;

    var headers = req.headers;

    var decoder = new stringDecoder('utf-8')
    var buffer = ''

    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        
        var data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryStringObject': queryStringObject,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, function(statusCode, payload, contentType){
            contentType = typeof(contentType) == 'string' ? contentType : 'json'

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            var payloadString = ''

            if(contentType == 'json'){
                res.setHeader('Content-Type', 'application/json')
                payload = typeof(payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload)
            }

            if(contentType == 'html'){
                res.setHeader('Content-Type', 'text/html')
                payloadString = typeof(payload) == 'string' ? payload : ''
            }

            
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    
    });
};


server.router = {
    '': handlers.index,
    'customer/create': handlers.customerCreate,
    'customer/edid': handlers.customerEdit,
    'customer/deleted': handlers.customerDeleted,
    'api/customers': handlers.customers,
    'api/tokens': handlers.tokens,
    'api/menu': handlers.menu,
    'api/shopping-cart': handlers.shoppingCart,
    'api/orders': handlers.orders
}

server.init = function(){

    server.httpServer.listen(config.httpPort, function(){
        console.log("Server is listening on port", +config.httpPort);
    });

    server.httpsServer.listen(config.httpsPort, function(){
        console.log("Server is listening on port", +config.httpsPort);
    });

}


// Export module
module.exports = server;