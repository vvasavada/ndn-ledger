var multilevel = require('multilevel')
var level = require('level')
var net = require('net')

const {promisify} = require('util')

/* This class is responsible for creating LevelDB database to store information about blocks on disk.
 * @constructor
 */

var Database = function()
{
  /* Create LevelDb instance 
   * The key namespace will be:
   * 'e' + block_hash for entire block column family
   * 'a' + block_hash for approver column family
   * 'w' + block_hash for weight column family
   * 'b' + block_hash for branch column family
   * 't' + block_hash for trunk column family
   * 'startup' for startup column family
   * */
  dbNoPromise = multilevel.client();
  var server = net.connect(3000);
  server.pipe(dbNoPromise.createRpcStream()).pipe(server);
 
  this.db_ = { get: promisify(dbNoPromise.get.bind(dbNoPromise)), 
               put: promisify(dbNoPromise.put.bind(dbNoPromise)),
               close: dbNoPromise.close.bind(dbNoPromise),
               createReadStream: dbNoPromise.createReadStream.bind(dbNoPromise)}
}

/**
 * Put content of block in database
 * @param {String} hash A block hash
 * @param {String} block A block
 */
Database.prototype.putBlock = function(hash, block)
{
  this.db_.put('e' + hash, block, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get content of block from database
 * @param {String} hash A block hash
 * @return {Promise} Block
 */
Database.prototype.getBlock = function(hash)
{
  return this.db_.get('e' + hash)
}

/**
 * Put approver list of block in database
 * @param {String} hash A block hash
 * @param {Array} approvers The block approvers
 */
Database.prototype.putApprovers = function(hash, approvers)
{
  this.db_.put('a' + hash, approvers, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get approvers of block from database
 * @param {String} hash A block hash
 * @return {Promise} Block approvers
 */
Database.prototype.getApprovers = function(hash)
{
  return this.db_.get('a' + hash)
}

/**
 * Put weight of block in database
 * @param {String} hash A block hash
 * @param {Number} weight The weight of a block
 */
Database.prototype.putWeight = function(hash, weight)
{
  this.db_.put('w' + hash, weight, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get weight of block in database
 * @param {String} hash A block hash
 * @return {Promise} Block weight
 */
Database.prototype.getWeight = function(hash)
{
  return this.db_.get('w' + hash)
}

/**
 * Put branch of block in database
 * @param {String} hash A block hash
 * @param {String} branch The branch of a block
 */
Database.prototype.putBranch = function(hash, branch)
{
  this.db_.put('b' + hash, branch, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get branch of block in database
 * @param {String} hash A block hash
 * @return {Promise} Block branch
 */
Database.prototype.getBranch = function(hash)
{
  return this.db_.get('b' + hash)
}

/**
 * Put trunk of block in database
 * @param {String} hash A block hash
 * @param {String} trunk The trunk of a block
 */
Database.prototype.putTrunk = function(hash, trunk)
{
  this.db_.put('t' + hash, trunk, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get trunk of block in database
 * @param {String} hash A block hash
 * @return {Promise} Block trunk
 */
Database.prototype.getTrunk = function(hash)
{
  return this.db_.get('t' + hash)
}

/**
 * Put startup details in database
 * @param {Array} details Startup details to be put in Database
 */
Database.prototype.putStartupDetails = function(details)
{
  this.db_.put('startup', details, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get startup details from database
 * @return {Promise} Startup details
 */
Database.prototype.getStartupDetails = function()
{
  return this.db_.get('startup')
}

/**
 * Close the Database connection
 */
Database.prototype.close = function()
{
  this.db_.close();
}

/**
 * Create read stream
 */
Database.prototype.createReadStream = function()
{
  return this.db_.createReadStream();
}

exports.Database = Database
