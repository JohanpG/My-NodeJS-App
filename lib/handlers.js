/*
* library for request handlers
*
*/
//Dependecies
var _data = require('./data');
var helpers = require('./helpers');
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
    callback(405,{'name': 'method not supported'});

  }
};
handlers._users={};
//Users post
//Required data: first name, last name, phone, password, tosAgreement
//Optiona data: none
handlers._users.post = function(data,callback){
  //check required files
  var firstName= typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length>0? data.payload.firstName.trim() : false;
  var lastName= typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length>0? data.payload.lastName.trim() : false;
  var phone= typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10? data.payload.phone.trim() : false;
  var password= typeof(data.payload.password)=='string' && data.payload.password.trim().length>8? data.payload.password.trim() : false;
  var tosAgreement= typeof(data.payload.tosAgreement)=='boolean' && data.payload.tosAgreement? data.payload.tosAgreement : false;
  if(firstName && lastName && phone && password && tosAgreement){
    //Make sure that the use does not exist yet.
    _data.read('users', phone,function(err,data){
      if(err){
        //Hash the password
        var hashedPassword = helpers.hash(password);
        if(hashedPassword){
          //Create user Object
          var userObject= {
            'firstName':firstName,
            'lastName':lastName,
            'phone':phone,
            'hashedPassword':hashedPassword,
            'tosAgreement':tosAgreement,
          };
          //Store the user
          _data.create('users', phone,userObject,function(err){
            if(!err){

              callback(200,{'Sucess':'User created sucessfully'});
            }else{
              console.log('this was the create error: ',err);
              callback(400,{'Error':'Could not create new user'});
            }
          });

        }else{
          callback(500,{'Error':'Password could not be hashed'});
        }

      }
      else{
        callback(400,{'Error':'A user with this phone number already exist'});
        console.log('this was the read  error: ',err,' And this was the data: ', data);
      }
    });
  }else{
    callback(400,{'Error':'Missing require fields'});
  }
};
//Users get
//Require data Phone
//optional data none
//@TODO: ONLY LET AN AUTHENTICATE USER TO ACESS THEIR OBJECT NOT TO ACESS ANY OTHER.
handlers._users.get = function(data,callback){
  //CHECK THAT THE PHONE NUMBER IS VALID.
  var phone= typeof(data.queryStringObject.phone)=='string' && data.queryStringObject.phone.trim().length==10? data.queryStringObject.phone.trim() : false;
  if(phone)
  {
    _data.read('users', phone,function(err,data){
      if(!err && data){
        //removed hashed password
        delete data.hashedPassword;
        callback(200,data);
      }else{
          callback(404,{'Error':'User with this phone does not exist'});
      }
    });
  }else{
    callback(400,{'Error':'Missing require field'});
  }
};
//Users put
//REquire data : PHONE
//Optiona data: Everything else
//At least one must be specified
//@TODO only allow an autheticated user to edit is own data
handlers._users.put = function(data,callback){
  //CHECK THAT THE PHONE NUMBER IS VALID.
  var phone= typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10? data.payload.phone.trim() : false;
  var firstName= typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length>0? data.payload.firstName.trim() : false;
  var lastName= typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length>0? data.payload.lastName.trim() : false;
  var password= typeof(data.payload.password)=='string' && data.payload.password.trim().length>8? data.payload.password.trim() : false;

  //Check optional fields
  if(phone && (firstName || lastName || phone || password || tosAgreement))
  {
    _data.read('users', phone,function(err,userData){
      if(!err && data){
        //Update the fiels necesary
        if(firstName){
          userData.firstName = firstName;
        }
        if(lastName){
          userData.lastName = lastName;
        }
        if(password){
          userData.hashedPassword =helpers.hash(password);
        }
        //Store new updates to disk
        _data.update('users', phone,userData,function(err){
          if(!err){

            callback(200,{'Sucess':'User update sucessfully'});
          }else{
            console.log('this was the create error: ',err);
            callback(500,{'Error':'Could not update the user'});
          }
        });
      }else {
        callback(404,{'Error':'User with this phone does not exist'});
      }
    });

  }else {
    callback(400,{'Error':'Missing require field Phone or at least one optional field'});

  }
};
//Users delete
//Users get
//Require data Phone
//optional data none
//@TODO: ONLY LET AN AUTHENTICATE USER TO delete THEIR OBJECT NOT TO ACESS ANY OTHER.
handlers._users.delete = function(data,callback){
  // Check that phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    // Lookup the user
    _data.read('users',phone,function(err,data){
      if(!err && data){
        _data.delete('users',phone,function(err){
          if(!err){
            callback(200,{'Sucess' : 'User delete sucessfully.'});
          } else {
            callback(500,{'Error' : 'Could not delete the specified user'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


//Export the module
module.exports=handlers;
