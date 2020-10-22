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
    'from': "postmaster@sandbox30026a628c074af19c25dcbea9c75a2a.mailgun.org",
    'apiKey': "cb591c4911ff50aa7a7e56f4e38021cd-2fbe671d-a4bbae91",
    'domain_name': "sandbox30026a628c074af19c25dcbea9c75a2a.mailgun.org"
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
    'from': "postmaster@sandbox30026a628c074af19c25dcbea9c75a2a.mailgun.org",
    'apiKey': "cb591c4911ff50aa7a7e56f4e38021cd-2fbe671d-a4bbae91",
    'domain_name': "sandbox30026a628c074af19c25dcbea9c75a2a.mailgun.org"
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
