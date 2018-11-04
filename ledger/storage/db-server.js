var multilevel = require('multilevel');
var net = require('net');
var level = require('level');
var fs = require('fs');
var path = require('path');

var dirpath = __dirname + '/database';
var targetFiles;
var dbExists = false;
if(fs.existsSync(dirpath)){
  var extensions = ['.log', '.ldb']
  files = fs.readdirSync(dirpath);
  targetFiles = files.filter(function(file){
    return extensions.includes(path.extname(file).toLowerCase());
  });

  targetFiles.forEach(function(file){
    if (fs.statSync(dirpath + "/" + file).size){
      dbExists = true;
    }
  });
}

exports.dbExists = dbExists;

if (require.main === module){
  var db = level('database');
  net.createServer(function (con) {
    var stream = con.pipe(multilevel.server(db));
    con.on('error', function(err){
      console.log(err);
    });
    stream.pipe(con);
    stream.on('error', function(err){
      console.log(err);
    });
  }).listen(3000);
}


