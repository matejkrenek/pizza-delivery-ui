/*
 * Helpers for repeating tasks
 *
 */

// Dependencies
var helpers = {};
var https = require('https');
var querystring = require('querystring');
var config = require('./config');
var https = require('https');
var fs = require('fs');
var path = require('path');
const { type } = require('os');

// Create a random string for token or for id
helpers.createRandomString = function(stringLength){
    stringLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength : false;

    if(stringLength){
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var string = ''
        for(i = 1; i <= stringLength; i++){
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            string += randomCharacter;
        }
        return string;
    } else{
        return false;
    }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try{
      var obj = JSON.parse(str);
      return obj;
    } catch(e){
      return {};
    }
};

helpers.makePayment = function(data, callback) {

  var payload = {
    amount: data.amount * 100,
    currency: data.currency,
    source: data.source,
    description: data.description
  };

  var stringPayload = querystring.stringify(payload);

  var requestDetails = {
    protocol: "https:",
    hostname: "api.stripe.com",
    port: 443,
    method: "POST",
    path: "/v1/charges",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
      Authorization: `Bearer ${config.stripe.secretKey}`
    }
  };

  // Instantiate the request object
  var req = https.request(requestDetails, res => {
    // Grab the status of the sent request
    var status = res.statusCode;
    // Callback successfully if the request went through
    if (status === 200 || status === 201) {
      callback(false);
    } else {
      callback('Status code returned was ' + status);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', err => {
    callback(err);
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();

};

// Send email
helpers.sendEmail = function(data, callback){
  var payload = {
    "from": config.mailgun.from,
    "to": data.to,
    "subject": data.subject,
    "text": data.text,
  }

  var stringPayload = querystring.stringify(payload)

  var requestDetails = {
    auth: "api:" + config.mailgun.apiKey,
    protocol: 'https:',
    hostname: 'api.mailgun.net',
    method: "POST",
    path: "/v3/" + config.mailgun.domain_name + "/messages",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload)
    } 

  };
  // Instantiate the request object
  var req = https.request(requestDetails, res => {
    // Grab the status of the sent request
    var status = res.statusCode;
    // Callback successfully if the request went through
    if (status === 200 || status === 201) {
      callback(false);
    } else {
      callback('Status code returned was ' + status);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', err => {
    callback(err);
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
    
};

// Get a string content of a template
helpers.getTemplate = function(templateName, data, callback){
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;

  if(templateName){
    var templatesDir = path.join(__dirname, '/../templates/')
    fs.readFile(templatesDir+templateName+'.html', 'utf-8', function(err, str){
      if(!err && str && str.length > -1){
        var finalString = helpers.interpolate(str, data)
        callback(false, finalString)
      } else{
        callback('No template could be found')
      }
    })

  } else{
    callback('A valid template name was not specified')
  }
};

// Add universal template
helpers.getUniversalTemplates = function(str, data, callback){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  helpers.getTemplate('__header', data, function(err, headerStr){
    if(!err && headerStr){
      helpers.getTemplate('__footer', data, function(err, footerStr){
        if(!err && footerStr){
          var fullString = headerStr+str+footerStr;
          callback(false, fullString);
        } else{
          callback('Could not find the footer template')
        }
      })
    } else{
      callback('Could not find the header template')
    }
  })
};

// Interpolate
helpers.interpolate = function(str, data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add templateGlobals to the data object and add "global." in front of them
  for(var keyName in config.templateGlobals){
    if(config.templateGlobals.hasOwnProperty(keyName)){
      data['global.'+keyName] = config.templateGlobals[keyName]
    }
  }
    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for(var key in data){
      if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
         var replace = data[key];
         var find = '{'+key+'}';
         str = str.replace(find,replace);
      }
   }
   return str;
};

// export module
module.exports = helpers;