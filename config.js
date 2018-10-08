/*
* Create and export configuration variables
*/

//General container for the enviroment enviroment variables
var enviroments={};
//Crate statging default Object
enviroments.staging={
  'httpPort':3000,
  'httpsPort':3001,
  'envName': 'staging',
  'hashingSecret':'thisIsASecret',
  'maxChecks':5,
  'twilio':{
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
};
//Prudciton object
enviroments.production={
  'httpPort':5000,
  'httpsPort':5001,
  'envName': 'production',
  'hashingSecret':'thisIsAlsoASecret',
  'maxChecks':5,
  'twilio':{
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }

};

//Determine which enviroment was passed in the command line and passed it back
var currentEnviroment = typeof(process.env.NODE_ENV)=='string'? process.env.NODE_ENV.toLowerCase():'';
// get the actual existing evnrioment to return
var enviromentToExport = typeof(enviroments[currentEnviroment])=='object'? enviroments[currentEnviroment]:enviroments.staging;
//Modulos to exports
module.exports= enviromentToExport;
