/*
* Library for storing and rotating logs
*
*/

//Dependencies

var fs = require('fs');
var path = require ('path');
var zlib = require ('zlib');

//Container for th emodule

var lib= {};
// Define base directory folder
lib.baseDir=path.join(__dirname,'/../.logs/');
//Append a string to a file. Creat ethe file if ndoes not existing
lib.append = function(file,str, callback){
  //Open the file for appending
  fs.open(lib.baseDir+file+'.log','a',function(err, fileDescriptor){
    if(!err & fileDescriptor){
      //Append the file and close setInterval(function () {
      fs.appendFile(fileDescriptor,str+'\n', function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err){
              callback(false);
            } else {
              callback('Error closing file that was being appended');
            }
          });
        } else {
          callback('Error apending file');
        }
      });
    }  else {
      callback('Could not open file for appending');
    }
  });

};

lib.list = function(includeCompressedLogs, callback){
  fs.readdir(lib.baseDir, function(err,data){
    if(!err && data && data.length > 0){
      var trimmedFileNames =[];
      data.forEach(function(filename){
        //Add the .log files logName
        if(filename.indexOf('.log')> -1){
          trimmedFileNames.push(filename.replace('.log',''));
        }
        //Add the .gz files
        if(filename.indexOf('.gz.b64') > -1 && includeCompressedLogs){
          trimmedFileNames.push(filename.replace('.gz.b64',''));
        }
      });
      callback(false,trimmedFileNames);
    } else {
      callback('Failed to read log dir',err,data);
    }

  });

};
// COmpress the contect of one log file into a .gz.b64 file within th esame log directory
lib.compress = function(logId, newFileId, callback){
  var sourceFile = logId + '.log';
  var destFile = newFileId + '.gz.b64';
  //read source files
  fs.readFile(lib.baseDir+sourceFile, 'utf8', function(err,inputString){
    if(!err && inputString){
      //Compress the data using gz
      zlib.gzip(inputString,function(err,buffer){
        if(!err && buffer){
          // Send the data to the destination filesfs.
          fs.open(lib.baseDir+destFile+'.wx','a',function(err, fileDescriptor){
            if(!err & fileDescriptor){
              //Write to the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'),function(err){
                if(!err){
                  //Close the file
                  fs.close(fileDescriptor,function(err){
                    if(!err){
                      callback(false);
                    } else {
                      callback('Error closing file that was being compressed',err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }

          });
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};
//Descompress the contents of .gz.b64 into a string variable
lib.decompress = function(fileId, callback){
  var fileName = fileId+ '.gz.b64';
  fs.readFile(lib.baseDir+fileName, 'utf8', function(err,str){
    if(!err && str){
      // decompress the data
      var inputBuffer= Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, function(err,outputBuffer){
        if(!err && outputBuffer ){
          //Call callback
          var str = outputBuffer.toString();
        } else {
          callback(err);
        }

      });
    } else {
      callback(err);
    }

  });

};

//Truncating a log file
lib.truncate= function(logId, callback){
  fs.truncate(lib.baseDir+logId+'.log', 0, function(err){
    if(!err){
      callback(false);
    } else {
      callback(err);
    }
  });

};


//Export the module
//Export module callback
module.exports= lib;
