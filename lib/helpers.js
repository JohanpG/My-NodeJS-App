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


//Export module callback
module.exports= helpers;
