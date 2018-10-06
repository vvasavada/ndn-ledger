var Blob = require('../..').ndnjs.Blob
var Crypto = require('crypto')

/* This class is responsible to create block to be attached to Tangle.
 * The constructor takes the interest and data pair.
 * @constructor
 * @param {Interest} interest An object of Interest to be attached to a block
 * @param {Data} data An object of Data paired with interest to be attached to a block
 */

var Block = function Block(prefix, content, genesis=false)
{
  /* Block contains following information:
   * Block name | /producer/hash
   * Block hash  | Unique hash identifying this block
   * Branch block  | Block being approved
   * Trunk block | Block being approved
   * Content  | Interest/Data name followed by Data content
   * */

  /* Create Block content Blob */
  this.content_ = new Blob(content)

  /* Create Block Hash
   * Block hash is created by taking SHA256 hash of
   * Interest/Data name and current timestamp
   */
  if (!(genesis)){
    this.hash_ =  Crypto.createHash('sha256').update(content + 
      new Date().toISOString()).digest('hex');
  } else {
    this.hash_ = Crypto.createHash('sha256').update(content).digest('hex')
  }

  console.log("Created block: " + this.hash_)

  /* branch and trunk are initially null
   * Tangle.attach() runs tip selection and sets them
   */
  this.branch_ = null
  this.trunk_ = null

  /* Assign this block a name */
  this.name_ = "/" + prefix + "/" + this.hash_ 
}

exports.Block = Block

/**
 * Get the Block hash
 * @return {String} SHA256 hash of this Block
 */
Block.prototype.getHash = function()
{
  return this.hash_;
};

/**
 * Set the Block hash
 * @param {String} SHA256 hash to be set for this Block
 */
Block.prototype.setHash = function(hash)
{
  this.hash_ = hash
}

/**
 * Get the Block content
 * @return {Blob} Content of this Block
 */
Block.prototype.getContent = function()
{
  return this.content_
}

/**
 * Set the Block content
 * @param {String} Content to be set for this Block
 */
Block.prototype.setContent = function(content)
{
  blob = new Blob(content);
  this.content_ = blob
}

/**
 * Get the Block branch
 * @return {String} branch of this Block
 */
Block.prototype.getBranchHash = function()
{
  return this.branch_
}

/**
 * Set the Block branch
 * @param {String} name branch of this Block
 */
Block.prototype.setBranchHash = function(name)
{
  this.branch_ = name
}

/**
 * Get the Block trunk
 * @return {String} trunk of this Block
 */
Block.prototype.getTrunkHash = function()
{
  return this.trunk_
}

/**
 * Set the Block trunk
 * @param {String} name Trunk of this Block
 */
Block.prototype.setTrunkHash = function(name)
{
  this.trunk_ = name
}

/**
 * Get the Block name
 * @return {String} name of the Block
 */
Block.prototype.getName = function()
{
  return this.name_
}
