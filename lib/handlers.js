/*
* library for request handlers
*
*/
//Dependecies
//define the handlers
var handlers= {};
//ping handler
handlers.ping = function(data,callback){
  //Callback http status decode, and a payloadObject
  callback(200);
};

handlers.notFound = function(data,callback){
  //Callback http status decode, and a payloadObject
  callback(404,{'name': 'handler not found'});
};

handlers.users = function(data,callback){
  //List out aceptable methods
  var acceptableMethods= ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method)> -1 ){
    handlers._users[data.method](data,callback);
  }else {
    //Callback http status decode, and a payloadObject
    callback(405,{'name': 'method not supported'})

  }

  ;
};
handlers._users={};
//Users post
//Required data: first name, last name, phone, password, tosAgreement
//Optiona data: none
handlers._users.post = function(data,callback){
  //check required files
  var firstName= typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length>0? data.payload.firstName.trim() : false;
  var lastName= typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length>0? data.payload.lastName.trim() : false;

};
//Users get
handlers._users.post = function(data,callback){
};
//Users put
handlers._users.post = function(data,callback){
};
//Users delete
handlers._users.post = function(data,callback){
};


//Export the module
module.exports=handlers;
