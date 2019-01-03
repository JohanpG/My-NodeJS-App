/*
* library for stroing and editing data
*
*/
//Dependecies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
// Contained for the module to be exported
var lib={};
// Define base directory folder
lib.baseDir=path.join(__dirname,'/../.data/');
//writing date to a afile
lib.create=function(dir,file,data,callback){
  //Open the file for reading
  fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err,fileDescriptor){
    if(!err && fileDescriptor){
      //convert data to string
      var stringData = JSON.stringify(data);

      //Write to file and close it
      fs.writeFile(fileDescriptor,stringData, function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err){
              callback(false);
            }else{
              callback('Error closing new file');
            }
          });
        }else{
          callback('erorr writing to a new file');

        };
      });
    }else{
      callback('could not create new file, it may already exist');
    }
  });

};
//READ DATA FROM A file
lib.read= function(dir,file,callback){
  fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',function(err,data){
    if(!err && data){
      var parsedData = helpers.parseJsonToObject(data);
      callback(false,parsedData);
    }else{
      callback(err,data);
    }

  });
};

//Update existing file with new data
lib.update= function(dir, file, data, callback){
  //open file for reading
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor){
      if(!err && fileDescriptor){
        //convert data to string
        var stringData = JSON.stringify(data);
        //Truncate the data before writing
        fs.truncate(fileDescriptor,function(err){
          if(!err){
            //Write to file and close it
            fs.writeFile(fileDescriptor,stringData, function(err){
              if(!err){
                fs.close(fileDescriptor,function(err){
                  if(!err){
                    callback(false);
                  }else{
                    callback('Error closing existing file');
                  }
                });
              }else{
                callback('Error writing to a existing file');

              }
            });

          }else{
            callback('Error truncating file');

          }

        });
      } else{
        callback('Error opening existing file');

      }
    });
};


//Delete file
lib.delete = function(dir,file,callback){
  //Unlink the file
  fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err){
    if(!err){
      callback(false);
    }else{
      callback('Error deleting ethe file');
    }
  });
};

//list DATA FROM A folder
lib.list= function(dir,callback){
  fs.readdir(lib.baseDir+dir+'/',function(err,data){
    if(!err && data.length > 0){
      var trimmedFileNames = [];
      data.forEach(function(filename){
        trimmedFileNames.push(filename.replace('.json',''));
      });
      callback(false,trimmedFileNames);
    }else{
      callback(err,data);
    }

  });
};



//Export the module
module.exports=lib;
