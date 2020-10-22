/*
* Primary files
* 
*/


// Dependencies
var server = require('./lib/server');

var app = {};


app.init = function(){
    server.init();
};

app.init();


// Export module
module.exports = app;


