var LevelUp = require('levelup')
var LevelDown = require('leveldown')

/* This class is responsible for creating LevelDB database to store information about blocks on disk.
 * @constructor
 */

var Database = function()
{
  /* Create LevelDb instance 
   * The key namespace will be:
   * 'c' + block_hash for content column family
   * 'a' + block_hash for approver column family
   * 'w' + block_hash for weight column family
   * */
  this.db_ = LevelUp(LevelDown('database'));
}

/**
 * Put content of block in database
 * @param {String} hash A block hash
 * @param {String} content A block contents
 */
Database.prototype.putContent = function(hash, content)
{
  this.db_.put('c' + hash, content, { sync: true }, function(err){})
}

/**
 * Get content of block from database
 * @param {String} hash A block hash
 * @return {String} Block contents
 */
Database.prototype.getContent = function(hash)
{
  this.db_.get('c' + hash, function(err, value){
    console.log(value)
  });
}

/**
 * Put approver list of block in database
 * @param {String} hash A block hash
 * @param {Array} approvers The block approvers
 */
Database.prototype.putApprovers = function(hash, approvers)
{
  console.log(approvers)
  this.db_.put('a' + hash, approvers, { sync: true }, function(err){})
}

/**
 * Get approvers of block from database
 * @param {String} hash A block hash
 * @return {Array} Block approvers
 */
Database.prototype.getApprovers = function(hash)
{
  this.db_.get('a' + hash, function(err, value){
    console.log(value.toString())
  })
}

/**
 * Put weight of block in database
 * @param {String} hash A block hash
 * @param {Number} weight The weight of a block
 */
Database.prototype.putWeight = function(hash, weight)
{
  this.db_.put('w' + hash, weight, { sync: true }, function(err){})
}

/**
 * Get weight of block in database
 * @param {String} hash A block hash
 * @return {String} Block weight
 */
Database.prototype.getWeight = function(hash)
{
  this.db_.get('w' + hash, function(err, value){
    console.log(value)
  })
}

exports.Database = Database
