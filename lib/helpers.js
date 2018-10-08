/*
* library for the helpers for various tasks
*
*/
//Dependecies
var crypto = require('crypto');
var config= require('../config');
var querystring = require('querystring');
var https = require('https');

//Container for the helpers
var helpers={};
// create a SHA256 Hash
helpers.hash= function(str){
  if(typeof(str)=='string' && str.length>0){
    var hash= crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
    return hash;
  }else{
    return false;
  }
};
//Parse a JSON to object or reply false
helpers.parseJsonToObject= function(str){
  try{
    var obj=JSON.parse(str);
    return obj;
  }catch(e){
    return {};

  }
};

//Create a random string
helpers.createRandomString= function(strLength){
  strLength= typeof(strLength) =='number' && strLength > 0? strLength: false;
  if(strLength){
    //define all the posible characters that can be in a stringify
    var possibleCharacters= 'abcdefghijklmnopqrstuvwxyz0123456789';
    //Start eh final string
    var str= '';
    for(i=1; i<=strLength; i++){
      //Get a ramndon character from the possibel cahracters listed
      var randomCharacter= possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length ));
      //Asppend character to output string
      str += randomCharacter;
    }
    return str;
  }else{
    return false;
  }
};
//Send and SMS VIA Twilio
helpers.sendTwilioSms= function functionName(phone,msg, callback) {
  //VALDIATE INPUTS
  phone= typeof(phone) =='string' && phone.trim().length == 10? phone.trim(): false;
  msg= typeof(msg) =='string' && msg.trim().length <= 1600? msg.trim(): false;
  if(phone && msg){
    //Configure the request payload
    var payoad= {
      'From': config.twilio.fromPhone,
      'To':'+1'+phone,
      'Body': msg
    }
    //stringisy the payload
    var stringPayload = querystring.stringify(payoad);
    //Create the request details
    var requestDetails = {
      'protocol':'https:',
      'hostname':'api.twilio.com',
      'method':'POST',
      'path':'/2010-04-01/Accounts/' +config.twilio.accountSid+'/Messages.json',
      'headers':{
        'Content-Type':'Application/x-www-form-urlencoded',
        'Content-Length':Buffer.byteLength(stringPayload)
      }
    };
    console.log('this was the requestDetails: ',requestDetails);
    //nstatiate the request OBJECT
    var req= https.request(requestDetails,function(res){
      //Grab the status of the sent request
      var status= res.statusCode;
      //Callback sucessfully when it when through
      if(status==200 || status==201 ){
        callback(false)

      }else{
        callback('Status code returned was' + status);

      }
    });
    //Bind to the error message so it doesnt get rhrown
    req.on('error',function(e){
      callback(e);
    });
    //Add the payloads
    req.write(stringPayload);
    //end the request
    req.end();


  }else{
    callback('Given parameters missing or invalid');
  }
};



//Export module callback
module.exports= helpers;
