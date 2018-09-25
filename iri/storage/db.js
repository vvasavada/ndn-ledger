var RocksDb = require('rocksdb')

/* This class is responsible for creating RocksDB database to store information about blocks on disk.
 * @constructor
 */

var Database = function Database()
{
  /* Create RocksDb instance 
   * The key namespace will be:
   * 'c' + block_hash for content column family
   * 'a' + block_hash for approvee column family
   * 'w' + block_hash for weight column family
   * */
  this.db_ = new RocksDb('./database');
}

/** I/O error callback for db operations
 * @param {String} err Error to log
 */
ioErrCb = function(err)
{
  if (err) return console.log('I/O error', err);
}

/** Get error callback for db operations
 * @param {String} err Error to log
 * @param {String} value
 */
getErrCb = function(err, value)
{
  if (err){
    if (err.notFound){
      return
    }

    return ioErrCb(err);
  }
}

/**
 * Put content of block in database
 * @param {String} hash A block hash
 * @param {String} content A block contents
 */
Database.prototype.putContent = function(hash, content)
{
  this.db_.put('c' + hash, content, function(err){
    return ioErrCb(err);
  });
}

/**
 * Get content of block from database
 * @param {String} hash A block hash
 * @return {String} Block contents
 */
Database.prototype.getContent = function(hash)
{
  this.db_.get('c' + hash, function(err, value){
    return getErrCb(err, value);
  });
}

/**
 * Put approvee list of block in database
 * @param {String} hash A block hash
 * @param {Array} approvees The block approvees
 */
Database.prototype.putApprovees = function(hash, approvees)
{
  this.db_.put('a' + hash, approvees, function(err) {
    return ioErrCb(err);
  });
}

/**
 * Get approvees of block from database
 * @param {String} hash A block hash
 * @return {String} Block approvees
 */
Database.prototype.getApprovees = function(hash)
{
  this.db_.get('a' + hash, function(err, value){
    return getErrCb(err, value);
  });
}

/**
 * Put weight of block in database
 * @param {String} hash A block hash
 * @param {Number} weight The weight of a block
 */
Database.prototype.putWeight = function(hash, weight)
{
  this.db_.put('w' + hash, weight, function(err) {
    return ioErrCb(err);
  });
}

/**
 * Get weight of block in database
 * @param {String} hash A block hash
 * @return {String} Block weight
 */
Database.prototype.getWeight = function(hash)
{
  this.db_.get('w' + hash, function(err, value){
    return getErrCb(err, value);
  });
}

db = Database()

exports.db = db
