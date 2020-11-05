/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'stripe': {
    'secretKey': 'sk_test_51HcVv3LSuYrWubfMMYedTRXYIHmHTGN3lv2nQwxeMSKlyqXDYISx1MzMuFUPb4BGsqx8zRxYT0VTO6BYVLQdJvon00PfXAxhah',
  },
  'mailgun': {
    'from': "postmaster@sandboxee87bae432b64bfbbd584abb102f11f6.mailgun.org",
    'apiKey': "bfbe81436ba4cb2fc4b0576d8733f914-ea44b6dc-fa54f923",
    'domain_name': "sandboxee87bae432b64bfbbd584abb102f11f6.mailgun.org"
  },
  'templateGlobal': {
    'companyName': 'Grandfather\'s Pizza',
    'baseUrl': 'http://localhost:3000/'
  }

};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'stripe': {
    'secretKey': 'sk_test_51HcVv3LSuYrWubfMMYedTRXYIHmHTGN3lv2nQwxeMSKlyqXDYISx1MzMuFUPb4BGsqx8zRxYT0VTO6BYVLQdJvon00PfXAxhah',
  },
  'mailgun': {
    'from': "postmaster@sandboxc9ad461057344d6799d831ac50ed4223.mailgun.org",
    'apiKey': "0650a39137bc6fbb63e4e8dcbb8dc9f1-9b1bf5d3-62fe50be",
    'domain_name': "sandboxc9ad461057344d6799d831ac50ed4223.mailgun.org"
  },
  'templateGlobal': {
    'companyName': 'Grandfather\'s Pizza',
    'baseUrl': 'http://localhost:3000/'
  }

};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;