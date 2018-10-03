var level = require('level-party')

const {promisify} = require('util')

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
   * 'b' + block_hash for branchHash column family
   * 't' + block_hash for trunkHash column family
   * */
  dbNoPromise = level('database')
  this.db_ = { get: promisify(dbNoPromise.get.bind(dbNoPromise)), 
               put: promisify(dbNoPromise.put.bind(dbNoPromise)) }
}

/**
 * Put content of block in database
 * @param {String} hash A block hash
 * @param {String} content A block contents
 */
Database.prototype.putContent = function(hash, content)
{
  this.db_.put('c' + hash, content, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get content of block from database
 * @param {String} hash A block hash
 * @return {Promise} Block contents
 */
Database.prototype.getContent = function(hash)
{
  return this.db_.get('c' + hash)
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
Database.prototype.getApprovers = async function(hash)
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
 * Put branchHash of block in database
 * @param {String} hash A block hash
 * @param {String} branchHash The branchHash of a block
 */
Database.prototype.putBranchHash = function(hash, branchHash)
{
  this.db_.put('b' + hash, branchHash, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get branchHash of block in database
 * @param {String} hash A block hash
 * @return {Promise} Block branchHash
 */
Database.prototype.getBranchHash = function(hash)
{
  return this.db_.get('b' + hash)
}

/**
 * Put trunkHash of block in database
 * @param {String} hash A block hash
 * @param {String} trunkHash The trunkHash of a block
 */
Database.prototype.putTrunkHash = function(hash, trunkHash)
{
  this.db_.put('t' + hash, trunkHash, { sync: true }, function(err){
    if (err) console.log(err)
  })
}

/**
 * Get trunkHash of block in database
 * @param {String} hash A block hash
 * @return {Promise} Block trunkHash
 */
Database.prototype.getTrunkHash = function(hash)
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

exports.Database = Database
