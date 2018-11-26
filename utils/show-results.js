var Database = require('..').Database;
var DataContent = require('..').DataContent;
var EncodingUtils = require('..').ndnjs.EncodingUtils;
var fs = require('fs');

var edges = []
var table = {}

/* Write LevelDB to CSV format (adjacency matrix) */
var dbToCsv = function()
{
  var db = new Database();
  var readStream = db.createReadStream();
  readStream.on('data', function(data) {
    if (data.key.startsWith('b') || data.key.startsWith('t')){
      var key = data.key.slice(1, 5);
      var val = data.value.split('/')[3].slice(0, 4);
      edges.push([key, val])
    }

    if (data.key.startsWith('e')){
      var key = data.key.slice(1);
      var block = EncodingUtils.decodeHexData(data.value)
      if (block.getName().toUri().split("/")[2] != 'ledger'){
        dataContent = new DataContent();
        dataContent.populateFromJson(block.getContent().toString());
        table[key] = dataContent.getContent();
      }
    }
  });
  readStream.on('end', function() {
    var file = fs.createWriteStream('edges');
    file.on('error', function(err){console.log(err)});
    edges.forEach(function(edge){ file.write(edge.join(',') + '\n'); });
    file.end();

    file = fs.createWriteStream('table.csv');
    file.on('error', function(err){console.log(err)});
    file.write('Time,Device,Watt Hours,Dollar ($),Transaction ID\n');
    for (var key in table) {
      file.write(table[key].split(';').join(',') + ',' + key + '\n');
    }
    file.end();
    var exec = require('child_process').spawn, child;
    child = exec("python", ["plotter.py"]);
    
    child.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
     });
    child.on('exit', function(code){
      fs.unlinkSync('edges');
      process.exit()
    });
  });
}

dbToCsv();
