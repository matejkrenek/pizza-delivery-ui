/*
* Primary files
* 
*/


// Dependencies
var server = require('./lib/server');
var cli = require('./lib/cli')

var app = {};


app.init = function(){
    server.init();

    // Start the CLI with delay
    setTimeout(function(){
        cli.init();
    }, 50)
};

app.init();


// Export module
module.exports = app;


