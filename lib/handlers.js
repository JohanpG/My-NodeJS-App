/*
* library for request handlers
*
*/
//Dependecies
var _data = require('./data');
var helpers = require('./helpers');
var config= require('../config');
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
    //get token from the headers
    var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
    console.log('this was the token provided: ',token);
    //verify toker is valid
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        console.log('insideee func: ',token);
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
        callback(403,{'Error':'Missign required token in header or token is invalid'});
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
    //get token from the headers
    var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
    //verify toker is valid
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        _data.read('users', phone,function(err,userData){
          if(!err && userData){
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

      }else{
        callback(403,{'Error':'Missign required token in header or token is invalid'});
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
    //get token from the headers
    var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
    //verify toker is valid
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',phone,function(err,userData){
          if(!err && userData){
            _data.delete('users',phone,function(err){
              if(!err){
                //Delete each of the check asociated with the user.
                var userChecks = typeof(userData.checks)== 'object' && userData.checks instanceof Array? userData.checks : [];
                var checksToDelete = userChecks.length;
                if(checksToDelete>0){
                  var checksDeleted=0;
                  var deletionErrors =false;
                  //Loop for each check to delete
                  userChecks.forEach(function(checkId){
                    _data.delete('checks',checkId,function(err){
                      if(err){
                        deletionErrors = true;
                      }
                        checksDeleted ++;
                        if(checksDeleted==checksToDelete){
                          if(!deletionErrors){
                              callback(200,{'Sucess' : 'User delete sucessfully.'});
                          }else{
                            callback(500,{'Error' : 'Erros encounterd when attempting to delete all of th eusers checks'});
                          }
                        }
                      });
                  });
              }
              else {
                  callback(200,{'Sucess' : 'User delete sucessfully.'});
                }
            } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });

      }else{
        callback(403,{'Error':'Missign required token in header or token is invalid'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};
//tokens
handlers.tokens = function(data,callback){
  //List out aceptable methods
  var acceptableMethods= ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method)> -1 ){
    handlers._tokens[data.method](data,callback);
  }else {
    //Callback http status decode, and a payloadObject
    callback(405,{'name': 'method not supported'});

  }
};


//Coontaidenr for the sub methods
handlers._tokens={};
//tokens - post
// Require phopne and Password
//Optianl data: noone
handlers._tokens.post = function(data,callback){
  var phone= typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10? data.payload.phone.trim() : false;
  var password= typeof(data.payload.password)=='string' && data.payload.password.trim().length>8? data.payload.password.trim() : false;
  if( phone && password ){
    // Lookup the user
    _data.read('users',phone,function(err,userData){
      if(!err && userData){
        // Hash the sent password
        var hashedPassword = helpers.hash(password);
        if(hashedPassword ==userData.hashedPassword ){
          //Ifa valid create a new token with a random name , set expiration to 1 hour in the future.
          var tokenId= helpers.createRandomString(20);
          var expires= Date.now() +1000 * 60 * 60;
          var tokenObject={
            'phone':phone,
            'id':tokenId,
            'expires':expires
          };

          //Store the tokens
          _data.create('tokens', tokenId,tokenObject,function(err){
            if(!err){

              callback(200,tokenObject);
            }else{
              console.log('this was the create error: ',err);
              callback(500,{'Error':'Could not create new token'});
            }
          });

        }else{
          callback(400,{'Error':'Password did not match the specified user stored password'});
        }
      }else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }
    });
  }
  else{
      callback(400,{'Error' : 'Missing required field'})
    }
};
//tokens - get
//Required; id
handlers._tokens.get = function(data,callback){
  //CHECK THAT THE PHONE NUMBER IS VALID.
  var id= typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length==20? data.queryStringObject.id.trim() : false;
  if(id)
  {
    _data.read('tokens', id,function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      }else{
          callback(404,{'Error':'User with this phone does not exist'});
      }
    });
  }else{
    callback(400,{'Error':'Missing require field'});
  }
  };
//tokens - put
//Required: id ,extend boolean
//OIptiona data : none
handlers._tokens.put = function(data,callback){
  //CHECK THAT THE PHONE NUMBER IS VALID.
  var id= typeof(data.payload.id)=='string' && data.payload.id.trim().length==20? data.payload.id.trim() : false;
  var extend= typeof(data.payload.extend)=='boolean' && data.payload.extend ? data.payload.extend : false;

  //Check optional fields
  if(id && extend )
  {
    _data.read('tokens', id,function(err,tokenData){
      if(!err && tokenData){
        //check the token isnt already expire
        if(tokenData.expires>  Date.now()){
          //Update the fiels necesary
          tokenData.expires= Date.now() +1000 * 60 * 60;
          //Store new updates to disk
          _data.update('tokens', id,tokenData,function(err){
            if(!err){

              callback(200,{'Sucess':'Token update sucessfully'});
            }else{
              console.log('this was the create error: ',err);
              callback(500,{'Error':'Could not update the Token'});
            }
          });

        }else{
          callback(404,{'Error':'Token already expired'});
        }

      }else {
        callback(404,{'Error':'Token with this id does not exist'});
      }
    });

  }else {
    callback(400,{'Error':'Missing require field id'});

  }
};

//tokens - delete

//Requide id
//Optional none
handlers._tokens.delete = function(data,callback){
  // Check that phone number is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the user
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200,{'Sucess' : 'Token delete sucessfully.'});
          } else {
            callback(500,{'Error' : 'Could not delete the specified Token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified Token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

//verify if a give token id is valid for a give user
handlers._tokens.verifyToken = function(id, phone, callback){
  if(id && phone ){
    _data.read('tokens', id,function(err,tokenData){
      if(!err && tokenData){
        //Check the user for the token match and theat the token has not expire
        if(tokenData.phone == phone && tokenData.expires>  Date.now()){
          callback(true);
          console.log('this was the token provided is valid: ',id);
        }
        else{
          callback(false);
        }
      }else{
          callback(false);
          console.log('could not read file for token: ',id);
      }
    });

  }
  else{
    callback(false)
    console.log('id or phone missing: ',id , phone);
  }
};

//checks
handlers.checks = function(data,callback){
  //List out aceptable methods
  var acceptableMethods= ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method)> -1 ){
    handlers._checks[data.method](data,callback);
  }else {
    //Callback http status decode, and a payloadObject
    callback(405,{'name': 'method not supported'});

  }
};

//Coontaidenr for the sub methods
handlers._checks={};

//Require: protocol,Url,method,Sucess codes, timeouut, token on header
//Optional none
handlers._checks.post = function(data,callback){
    var protocol= typeof(data.payload.protocol)=='string' && ['https','http'].indexOf(data.payload.protocol) >- 1? data.payload.protocol.trim() : false;
    var url= typeof(data.payload.url)=='string' && data.payload.url.trim().length>0? data.payload.url.trim() : false;
    var method= typeof(data.payload.method)=='string' && ['post','get','put','delete'].indexOf(data.payload.method) >- 1? data.payload.method.trim() : false;
    var sucessCodes = typeof(data.payload.sucessCodes)=='object' && data.payload.sucessCodes instanceof Array &&  data.payload.sucessCodes.length>0? data.payload.sucessCodes:false;
    var timeOutSeconds= typeof(data.payload.timeOutSeconds)=='number' && data.payload.timeOutSeconds % 1 ===0 && data.payload.timeOutSeconds >=1  &&  data.payload.timeOutSeconds<=5? data.payload.timeOutSeconds : false;

    if(protocol && url && method&& sucessCodes && timeOutSeconds){
      //get token from the headers
      var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
      console.log('this was the token provided: ',token);

      _data.read('tokens', token,function(err,tokenData){
        if(!err && tokenData){
          var userPhone= tokenData.phone;
          //verify toker is valid
          handlers._tokens.verifyToken(token,userPhone,function(tokenIsValid){
            if(tokenIsValid){
              //Read user data
              _data.read('users', userPhone,function(err,userData){
                if(!err && userData){
                  var userChecks = typeof(userData.checks)== 'object' && userData.checks instanceof Array? userData.checks : [];
                  //validate that the user has less than the max ammount of _checks per user
                  if(userChecks.length < config.maxChecks){
                    //Create random id for the check
                    var checkId = helpers.createRandomString(20);
                    //Create the check object and include the users phone.
                    var checkObject={
                      'id':checkId,
                      'userPhone':userPhone,
                      'protocol':protocol,
                      'url':url,
                      'method':method,
                      'sucessCodes':sucessCodes,
                      'timeOutSeconds':timeOutSeconds
                    };
                    //Store the checks
                    _data.create('checks',checkId,checkObject ,function(err){
                      if(!err){
                        //Sync and add new check
                        userData.checks = userChecks;
                        userData.checks.push(checkId);
                        //Store new updates to disk
                        _data.update('users', userPhone,userData,function(err){
                          if(!err){
                            callback(200,checkObject);
                          }else{
                            console.log('this was the create error: ',err);
                            callback(500,{'Error':'Could not update the user'});
                          }
                        });
                      }else{
                        console.log('this was the create error: ',err);
                        callback(500,{'Error':'Could not create new check'});
                      }
                    });

                  }
                  else{
                    callback(403,{'Error':'Max number of checks reached ('+config.maxChecks +')'});
                  }
              }else{
                callback(403,{'Error':'User does not exist'});

              }

            });


            }else{
              callback(403,{'Error':'Missign required token in header or token is invalid'});
            }
          });
        }else{
            callback(403,{'Error':'User not authorize'});
        }
      });


    }
    else{
      callback(400,{'Error' : 'Missing required field'})
    }
  };
  //Required Data just the // ID
  //Optional none
  handlers._checks.get = function(data,callback){
    //CHECK THAT THE PHONE NUMBER IS VALID.
    var id= typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length==20? data.queryStringObject.id.trim() : false;
    if(id)
    {
      _data.read('checks', id,function(err,checkData){
        if(!err && checkData){
          //removed hashed password
          var phone= checkData.userPhone;
          //look up the check to get the user
          //get token from the headers
          var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
          console.log('this was the token provided: ',token);
          //verify toker is valid
          handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
            if(tokenIsValid){
              console.log('insideee func: ',token);
              callback(200,checkData);
            }else{
              callback(403,{'Error':'Missign required token in header or token is invalid'});
            }
          });
        }else{
            callback(404,{'Error':'User with this check id does not exist'});
        }
      });

    }else{
      callback(400,{'Error':'Missing require field'});
    }
  };

  //put
  //Require the ID
  //Optional all  but at least one must be provided
  handlers._checks.put = function(data,callback){
    var protocol= typeof(data.payload.protocol)=='string' && ['https','http'].indexOf(data.payload.protocol) >- 1? data.payload.protocol.trim() : false;
    var url= typeof(data.payload.url)=='string' && data.payload.url.trim().length>0? data.payload.url.trim() : false;
    var method= typeof(data.payload.method)=='string' && ['post','get','put','delete'].indexOf(data.payload.method) >- 1? data.payload.method.trim() : false;
    var sucessCodes = typeof(data.payload.sucessCodes)=='object' && data.payload.sucessCodes instanceof Array &&  data.payload.sucessCodes.length>0? data.payload.sucessCodes:false;
    var timeOutSeconds= typeof(data.payload.timeOutSeconds)=='number' && data.payload.timeOutSeconds % 1 ===0 && data.payload.timeOutSeconds >=1  &&  data.payload.timeOutSeconds<=5? data.payload.timeOutSeconds : false;
    var id= typeof(data.payload.id)=='string' && data.payload.id.trim().length==20? data.payload.id.trim() : false;
    if(id &&(protocol || url || method || sucessCodes || timeOutSeconds)){
      _data.read('checks', id,function(err,checkData){
        if(!err && checkData){
          //get phone number
          var phone= checkData.userPhone;
          //look up the check to get the user
          //get token from the headers
          var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
          console.log('this was the token provided: ',token);
          //verify toker is valid
          handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
            if(tokenIsValid){
              console.log('insideee func: ',token);
              //Update the fields necesary
              if(protocol){
                checkData.protocol = protocol;
              }
              if(url){
                checkData.url = url;
              }
              if(method){
                checkData.method =method;
              }
              if(sucessCodes){
                checkData.sucessCodes =sucessCodes;
              }
              if(timeOutSeconds){
                checkData.timeOutSeconds =timeOutSeconds;
              }
              //Store new updates to disk
              _data.update('checks', id,checkData,function(err){
                if(!err){

                  callback(200,{'Sucess':'Check update sucessfully'});
                }else{
                  console.log('this was the create error: ',err);
                  callback(500,{'Error':'Could not update the user'});
                }
              });

            }else{
              callback(403,{'Error':'Missign required token in header or token is invalid'});
            }
          });
        }else{
            callback(404,{'Error':'User with this check id does not exist'});
        }
      });
    }else {
      callback(400,{'Error':'Missing require field id or at least one optional field'});

    }
  };
  //Require ID
  //Optional none
  handlers._checks .delete = function(data,callback){
    // Check that phone number is valid
    var id= typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length==20? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the user
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          //get phone number
          var phone= checkData.userPhone;
          //get token from the headers
          var token = typeof(data.headers.token) == 'string'? data.headers.token:false;
          //verify toker is valid
          handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
            if(tokenIsValid){
                //Delete the check
              _data.delete('checks',id,function(err){
                if(!err){
                  _data.read('users', phone,function(err,userData){
                    if(!err && userData){
                      var userChecks = typeof(userData.checks)== 'object' && userData.checks instanceof Array? userData.checks : [];
                      // Check check position within array
                      var checkPosition =userChecks.indexOf(id);
                      if(checkPosition> -1 ){
                        //Remove check from user
                        userChecks.splice(checkPosition,1);
                        //Reasing _checks
                        userData.checks= userChecks;
                        //Store new updates to disk
                        _data.update('users', phone,userData,function(err){
                          if(!err){

                            callback(200,{'Sucess':'User checks update sucessfully'});
                          }else{
                            console.log('this was the create error: ',err);
                            callback(500,{'Error':'Could not update the user checks'});
                          }
                        });

                      }else {
                        callback(404,{'Error':'User does not have this check'});
                      }

                    }else {
                      callback(404,{'Error':'User with this phone does not exist'});
                    }
                  });
                } else {
                  callback(500,{'Error' : 'Could not delete the specified check'});
                }
              });

            }else{
              callback(403,{'Error':'Missign required token in header or token is invalid'});
            }
          });

        } else {
          callback(400,{'Error' : 'Could not find the specified check.'});
        }
      });

    } else {
      callback(400,{'Error' : 'Missing required field'})
    }
  };

//Export the module
module.exports=handlers;
