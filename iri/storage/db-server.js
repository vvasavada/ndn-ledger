var multilevel = require('multilevel');
var net = require('net');
var level = require('level');
var fs = require('fs');
var path = require('path');

var dirpath = __dirname + '/database';
var targetFiles;
var dbExists = false;
if(fs.existsSync(dirpath)){
  var extension = '.log'
  files = fs.readdirSync(dirpath);
  targetFiles = files.filter(function(file){
    return path.extname(file).toLowerCase() === extension;
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
    con.pipe(multilevel.server(db)).pipe(con);
  }).listen(3000);
}


