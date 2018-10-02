/*
* library for the helpers for various tasks
*
*/
//Dependecies
var crypto = require('crypto');
var config= require('../config');

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


//Export module callback
module.exports= helpers;
