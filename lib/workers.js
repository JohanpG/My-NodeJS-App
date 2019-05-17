/*
* Workers related task
*
*/

//Dependencies
var path = require ('path');
var fs = require('fs');
var _data = require('./data');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');

// Initialize Object
var workers = {};

//Funciton to gather all checks get their data and send to a validator
workers.gatherAllChecks = function(){
  // Get all the existing checks
  _data.list('checks',function(err,checks){
    if(!err && checks && checks.length > 0){
      checks.forEach(function(checkName){
        _data.read('checks', checkName,function(err,originalCheckData){
          if(!err && originalCheckData){
            //pass the data to the check valdiator and let that funtion continueor log errors as needed
            workers.validateCheckData(originalCheckData);

      } else{
        console.log("Error: Reading the check: " + checkName);
      }
    });
  });

    } else {
      console.log("Error: Could not find any checks to process");
    }
  });
};


//Function to validate the check DATA
workers.validateCheckData = function(originalCheckData){
  originalCheckData = typeof(originalCheckData)== 'object'&& originalCheckData != null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id)=='string'  && originalCheckData.id.trim().length ==20 ? originalCheckData.id : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone)=='string'  && originalCheckData.userPhone.trim().length ==10 ? originalCheckData.userPhone : false;
  originalCheckData.protocol= typeof(originalCheckData.protocol)=='string' && ['https','http'].indexOf(originalCheckData.protocol) >- 1? originalCheckData.protocol.trim() : false;
  originalCheckData.url= typeof(originalCheckData.url)=='string' && originalCheckData.url.trim().length>0? originalCheckData.url.trim() : false;
  originalCheckData.method= typeof(originalCheckData.method)=='string' && ['post','get','put','delete'].indexOf(originalCheckData.method) >- 1? originalCheckData.method.trim() : false;
  originalCheckData.sucessCodes = typeof(originalCheckData.sucessCodes)=='object' && originalCheckData.sucessCodes instanceof Array &&  originalCheckData.sucessCodes.length>0? originalCheckData.sucessCodes:false;
  originalCheckData.timeOutSeconds= typeof(originalCheckData.timeOutSeconds)=='number' && originalCheckData.timeOutSeconds % 1 ===0 && originalCheckData.timeOutSeconds >=1  &&  originalCheckData.timeOutSeconds<=5? originalCheckData.timeOutSeconds : false;
  //Set the keys that might not be set if the workers have never seen this check before
  originalCheckData.state =typeof(originalCheckData.state)=='string' && ['up','down'].indexOf(originalCheckData.state) >- 1? originalCheckData.state.trim() : 'down';
  originalCheckData.lastChecked= typeof(originalCheckData.lastChecked)=='number' && originalCheckData.lastChecked >=0?  originalCheckData.lastChecked : false;
  //If all the checks pass, pass the data along to the next step of the process
  if(originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.sucessCodes &&
    originalCheckData.timeOutSeconds
  ){
    workers.performCheck(originalCheckData);

  } else {
    console.log("Error: One of the checks is not properly formatted" + originalCheckData.id + originalCheckData.userPhone + originalCheckData.protocol + originalCheckData.url + originalCheckData.method +originalCheckData.sucessCodes +originalCheckData.timeOutSeconds);
  }
};

//Perform the check send the original check data and the outcome of the check process
workers.performCheck = function(originalCheckData){
  //Prepare the initial check outcome
  var checkOutcome = {
    'error': false,
    'responseCode': false
  };
  // Mark that hte outcome has not been sent yet
  var outcomeSent= false;
  // Parse the hostname and the path out of the original DATA
  var parsedUrl= url.parse(originalCheckData.protocol + '://' + originalCheckData.url ,true); //True to parse the query string, set the parse url query (string module).
  var hostname= parsedUrl.hostname;
  var path= parsedUrl.path;
  //Construct the Request
  var requestDetails = {
    'protocal': originalCheckData.protocol + ':',
    'hostname': hostname,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeOutSeconds * 1000
  };

  //Instanciate the request object using the hhtp modules
  var _moduleToUse =  originalCheckData.protocol == 'http'? http : https;
  var req = _moduleToUse.request(requestDetails,function(res){
    //grab the status of the sent request
    var status = res.statusCode;
    console.log('Status of the request: ' + status);
    //Update the check utcome and pass the data along
    checkOutcome.responseCode = status;
    if(!outcomeSent){
      workers.checkOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
  //Bind to the error event so it doesnt get thrown
  req.on('error',function(e){
    //Update the check utcome and pass the data along
    checkOutcome.error = {
      'error' : true,
      'value': e
    };
    if(!outcomeSent){
      workers.checkOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
  //Bind to the timeout
  req.on('timeout',function(e){
    //Update the check utcome and pass the data along
    checkOutcome.error = {
      'error' :true,
      'value': 'timeout'
    };
    if(!outcomeSent){
      workers.checkOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
  //End the request
  req.end();
};

//Process the check outcome and update the check data s needed and trigger an alert ot hte user if needed
//Special logic to acommodating a check that has never been updated before
workers.checkOutcome = function(originalCheckData,checkOutcome){
  //Decide if the check is considered up or down in the current state
  var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.sucessCodes.indexOf(checkOutcome.responseCode)>-1? 'up' :'down';
  //decide in an alart is warranted
  var alarmWarranted = originalCheckData.lastChecked && originalCheckData.state !== state? true:false;
  var timeOfCheck = Date.now();
  //Update the check DATA
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;
  //Log the out come od the check
  workers.log(originalCheckData,checkOutcome,state, alarmWarranted,timeOfCheck);
  //Save the updates
  _data.update('checks', newCheckData.id,newCheckData,function(err){
    if(!err){
      if(alarmWarranted){
        workers.alarmUserToStatusChange(newCheckData);
      } else{
        console.log('Check outcome has not change not alarm needed');
      }
    }else{
      console.log('this was the create error: ',err);
    }
  });
};

//Allert the user that the status has change
workers.alarmUserToStatusChange = function(newCheckData){
  var msg = 'Alert your check for: ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + ':// ' + newCheckData.url + ' is currently ' +  newCheckData.state;
  console.log('Warning: Message To user :',msg);
  //Send the sms alert
  helpers.sendTwilioSms(newCheckData.userPhone,msg,function(err){
    if(!err){
      console.log('Sucess: User alerted :',msg);
    }else{
      console.log('Error: Could not sent SMS lart to user that has state change this was the error',err);
    }

  });

};
//Worker that logs str to a file
workers.log= function(originalCheckData,checkOutcome,state, alarmWarranted,timeOfCheck){
  var logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state':state,
    'alert': alarmWarranted,
    'time': timeOfCheck
   };
   //conver object to string
   var logString= JSON.stringify(logData);
   //Determine the name of th elog newFile
   var logFileName = originalCheckData.id;
   //Append data to log
   _logs.append(logFileName,logString,function(err){
     if(!err){
       console.log('Logging to file succeded');
     }else{
       console.log('Loging to file failed');
     }
   });
};

// Wroker to loop all the checks every minute
workers.loop = function(){
  setInterval(function(){
      workers.gatherAllChecks();

  },1000*5);
};

workers.rotateLogs = function(){
  //Listing all non compressed files
  _logs.list(false, function(err,logs){
    if(!err && logs && logs.length >0){
      logs.forEach(function(logName){
        //Compress the data to a diferent files
        var logId= logName.replace('.log','');
        var newFileId = logId +'-'+Date.now();
        _logs.compress(logId, newFileId, function(err){
          if(!err){
            //Truncate the file
            _logs.truncate(logId,function(err){
              if(!err){
                console.log('Sucess truncating the file');
              }else{
                console.log('Truncating the file failed',err);
              }
            });
          }else{
            console.log('Compress the file failed',err);
          }
        });
      });

    }

  });
};

//Timer to Execute the log rotaiton Once per day
workers.logRotationLoop = function(){
  setInterval(function(){
      workers.rotateLogs();
  },1000*60*60*24);
};


//Init function
workers.init = function(){
  //Execute all the checks
  workers.gatherAllChecks();
  //Call a loop to all the check continue being executed
  workers.loop();
  // Rotate logs compress all the logs inmediately
  workers.rotateLogs();
  //Call compresion loop, so logs will be compressed later on
  workers.logRotationLoop();

};

//Export module callback
module.exports= workers;
