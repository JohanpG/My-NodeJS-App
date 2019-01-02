/*
* Primary file for my api
*
*/
// Dependecies
var server = require('./lib/server');
var workers = require('./lib/workers');
// Declare the application
var app = {};

//Init function
app.init = function(){
  // start hte server
  server.init();
  // start eh workers
  //workers.init();
};


// Execute
app.init();

//Export module callback
module.exports= app;
