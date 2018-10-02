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
  'hashingSecret':'thisIsASecret'
};
//Prudciton object
enviroments.production={
  'httpPort':5000,
  'httpsPort':5001,
  'envName': 'production',
  'hashingSecret':'thisIsAlsoASecret'

};

//Determine which enviroment was passed in the command line and passed it back
var currentEnviroment = typeof(process.env.NODE_ENV)=='string'? process.env.NODE_ENV.toLowerCase():'';
// get the actual existing evnrioment to return
var enviromentToExport = typeof(enviroments[currentEnviroment])=='object'? enviroments[currentEnviroment]:enviroments.staging;
//Modulos to exports
module.exports= enviromentToExport;
