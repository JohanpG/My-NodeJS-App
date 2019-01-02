/*
* server related task
*
*/

//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config= require('../config');
var fs = require('fs');
//var _data = require('./lib/data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require ('path');

// Initialize the server module Object
var server = {};
//Test
helpers.sendTwilioSms('4158375309','Hello',function(err){
  console.log('this was the error',err);
});
/*// @TODO Delete this
_data.create('test', 'newFile',{'foo': 'bar'},function(err){
  console.log('this was the create error: ',err);
});

_data.read('test', 'newFile',function(err,data){
  console.log('this was the read  error: ',err,' And this was the data: ', data);
});
_data.update('test', 'newFile',{'fizz': 'buzz'},function(err){
  console.log('this was the update  error: ',err);
});

_data.delete('test', 'newFile',function(err){
  console.log('this was the delete error: ',err);
});
*/
// Instanciate the HTTP srver
server.httpServer =http.createServer(function(req,res){
server.unifiedServer(req,res);
});

// https options
server.httpsServerOptions= {
  'key':fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert':fs.readFileSync(path.join(__dirname,'../https/certificate.pem')),
};
// Instanciate the HTTPS srver
server.httpsServer =https.createServer(server.httpsServerOptions,function(req,res){
server.unifiedServer(req,res);
});


//All server logic for both the http and https server
server.unifiedServer= function(req,res){
  //get the url and parse it
  var parsedUrl= url.parse(req.url,true); //True to parse the query string, set the parse url query (string module).
  //Get the path from the url
  var path= parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'');
  //get eh query string as an object
  var queryStringObject= parsedUrl.query;
  //Get http method
  var method= req.method.toLowerCase();
  //Get headers as an object
  var headers= req.headers;
  //Get payloads
  var decoder= new StringDecoder('utf-8');
  var buffer='';
  //Event when payload is received in the req
  req.on('data', function(data){
    buffer+=decoder.write(data);
  });
  //Event when the payload ends always is triggeres event if not pyaload.
  req.on('end',function(){
    buffer+=decoder.end();
    //Choose the handler this request should go to if one is not foung ise the not found handlers
    var chosenHandler = typeof(server.router[trimmedPath])!=='undefined'? server.router[trimmedPath]:server.router.notFound;
    //Construct data object to sent to the handler
    var data={
      'trimmedPath': trimmedPath,
      'queryStringObject':queryStringObject,
      'method' : method,
      'headers':headers,
      'payload':helpers.parseJsonToObject(buffer)
    };
    //Route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload){
      //Use the status code defined by the handler or pass 200 as defaults
      statusCode=typeof(statusCode)=='number'? statusCode:200;
      //use the payload called back by the handler or a defaults object
      payload=typeof(payload)=='object'? payload:{};
      //Convert payload to string
       var payloadString = JSON.stringify(payload);
       res.setHeader('Content-Type','application/json');
       //Return the response code
       res.writeHead(statusCode);
       //send the response back as string
       res.end(payloadString);
       //Log the payload reply
       console.log("Returned Payload: ",statusCode, payloadString);
    });
    //log the request
    console.log("Request received on path: " + trimmedPath + " With this method: " + method+ " With this query string parameters: ", queryStringObject);
    //console.log("Request received with this headers", headers);
    console.log("Request received with this payloads", buffer);
  });

};

//Define Request routes
server.router={
  'ping':handlers.ping,
  'users':handlers.users,
  'tokens':handlers.tokens,
  'checks':handlers.checks,
  'notFound':handlers.notFound
};

//Init function
server.init = function(){
  //Start the server, and have it listed on port 3000
  server.httpServer.listen(config.httpPort,function(){
    console.log("The http server is listening on port: "+config.httpPort+" in " + config.envName+" now. ");
  });
  //Start the server, and have it listed on port 3000
  server.httpsServer.listen(config.httpsPort,function(){
    console.log("The http server is listening on port: "+config.httpsPort+" in " + config.envName+" now. ");
  });

};

//Export module callback
module.exports= server;
