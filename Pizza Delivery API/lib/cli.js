/*
* CLI-related tasks
* 
*/

// Dependencies
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli')
var events = require('events');
const { listeners } = require('process');
const { type } = require('os');
class _events extends events{};
var e = new _events();
var _data = require('./data')

var cli = {}

e.on('ass', function(str){
    cli.responde.help()
})

e.on('help', function(str){
    cli.responde.help()
})

e.on('quit', function(str){
    cli.responde.quit()
})

e.on('machine state', function(str){
    cli.responde.state()
})

e.on('menu list', function(str){
    cli.responde.menu()
})

e.on('orders', function(str){
    cli.responde.orders()
})

e.on('order info', function(str){
    cli.responde.orderInfo(str)
})

e.on('customers', function(str){
    cli.responde.customers(str)
})

e.on('customer info', function(str){
    cli.responde.customerInfo(str)
})
cli.responde = {}

cli.responde.help = function(){
    var commands = {
        'quit': 'Kill the CLI (and with it the rest of the application)',
        'ass': '(assistent) Show this help page',
        'help': 'Alternative of the "ass" command',
        'machine state': 'Get current basic statistics and information of the machine',
        'menu list': 'Show the whole menu of meals ',
        'orders': 'Show orders placed in last 24 hours',
        'order info --{fileName}': 'Show details of a specified order',
        'customers': 'Show customers registered in last 24 hours',
        'customer info --{customerEmail}': 'Show details of specified customer',
    };

    cli.horizontalLine();
    cli.centerText('CLI ASSISTENT');
    cli.horizontalLine();
    cli.verticalSpace(2);

    for(var key in commands){
        if(commands.hasOwnProperty(key)){
            var value = commands[key];
            var line = '\x1b[33m'+key+'\x1b[0m';
            var padding = 60 - line.length;
            for(i = 0; i < padding; i++){
                line += ' ';
            }

            line+=value
            console.log(line)
            cli.verticalSpace(1);
        }
    }

    cli.verticalSpace(1)
    cli.horizontalLine()
}

cli.responde.quit = function(){
    process.exit(0)
}

cli.responde.menu = function(){
    _data.list('menu', function(err, folderData){
        if(!err && folderData && folderData.length > 0){
            cli.verticalSpace(1)
            folderData.forEach(function(data){
                _data.read('menu', data, function(err, fileData){
                    if(!err && fileData){
                        var line = `\x1b[36m Meal Name:\x1b[0m ${fileData.name} | \x1b[36m Ingredients:\x1b[0m: ${fileData.ingredients} | \x1b[36m Price:\x1b[0m: ${fileData.price} | \x1b[36m Currency:\x1b[0m: ${fileData.currency}`
                        console.log(line)
                        cli.verticalSpace(1)

                    }
                });
            });
        }
    });
};

cli.responde.orders = function(){
    _data.list('orders', function(err, folderData){
        if(!err && folderData && folderData.length > 0){
            cli.verticalSpace(1);
            folderData.forEach(function(data){
                _data.read('orders', data, function(err, fileData){
                    if(!err && fileData){   
                        if(Date.now() < fileData.time + 1000 * 60 * 60 * 24){
                            var line = `\x1b[36m File Name:\x1b[0m ${data} | \x1b[36m Customer's Email:\x1b[0m ${fileData.email} | \x1b[36m Order:\x1b[0m ${fileData.order} | \x1b[36m Price:\x1b[0m ${fileData.price}${fileData.currency}`
                            console.log(line)
                            cli.verticalSpace(1)
                        }
                    }
                })
            })
        }
    })
}

cli.responde.orderInfo = function(str){
    var arr = str.split('--')
    var orderFileName = typeof(arr[1]) == 'string' && arr[1].length > 0 ? arr[1].trim() : false;
    console.log(orderFileName)
    
    if(orderFileName){
        _data.read('orders', orderFileName, function(err, orderData){
            if(!err && orderData){
                cli.verticalSpace(1)
                console.log(orderData)
                cli.verticalSpace(1)
            }
        })
    }
}

cli.responde.customers = function(str){
    _data.list('customers', function(err, folderData){
        if(!err && folderData && folderData.length > 0){
            cli.verticalSpace(1);
            folderData.forEach(function(data){
                _data.read('customers', data, function(err, customerData){
                    if(!err && customerData){   
                        if(Date.now() < customerData.time + 1000 * 60 * 60 * 24){

                            var shopping_cart = typeof(customerData.shopping_cart) == 'object' && customerData.shopping_cart instanceof Array && customerData.shopping_cart.length > 0 ? customerData.shopping_cart : 'empty' 

                            var line = `\x1b[36m Customer Name:\x1b[0m ${customerData.first_name} ${customerData.last_name} | \x1b[36m Customer's Email:\x1b[0m ${customerData.email_address} | \x1b[36m Living Place:\x1b[0m ${customerData.street_address} | \x1b[36m Zip Code:\x1b[0m ${customerData.zip_code} | \x1b[36m Shopping Cart Items Ids:\x1b[0m ${shopping_cart}`
                            console.log(line)
                            cli.verticalSpace(1)
                        }
                    }
                })
            })
        }
    })
}



// Formating functions
cli.horizontalLine = function(){
    var width = process.stdout.columns;

    var line = '';
    for(var i = 0; i < width; i++){
        line+='-'
    }

    console.log(line)
}

cli.verticalSpace = function(spaces){
    spaces = typeof(spaces) == 'number' && spaces > 0 ? spaces : 1;

    for(var i = 0; i < spaces; i++){
        console.log('')
    }
}

cli.centerText = function(text){
    text = typeof(text) == 'string' && text.trim().length > 0 ? text.trim() : false;

    var width = process.stdout.columns;

    var leftPadding = Math.floor((width - text.length) / 2)
    var line = ''
    for(var i = 0; i < leftPadding; i++){
        line+=' '
    }
    line+=text
    console.log(line)
}


cli.processInput = function(str){
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;

    if(str){
        var optionalInputs = [
            'ass',
            'help',
            'quit',
            'machine state',
            'menu list',
            'orders',
            'order info',
            'customers',
            'customer info'
        ];

        var matchFound = false;
        var counter = 0;
        optionalInputs.some(function(input){
            if(str.toLowerCase().indexOf(input) > -1){
                matchFound = true
                
                e.emit(input, str);
                return true
            }
        })

        if(!matchFound){
            console.log('Ups sorry, try it again')
        }


    }
}

cli.init = function(){
    // CLI is running
    console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

    var _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>>> '
    });

    _interface.prompt()

    _interface.on('line', function(str){
        cli.processInput(str);

        _interface.prompt()
    });

    _interface.on('close', function(){
        process.exit(0)
    });
};



module.exports = cli