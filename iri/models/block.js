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

  /* Create Block content */
  this.content_ = content

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
 * @return {String} Content of this Block
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
  this.content_ = content
}

/**
 * Get the Block branch
 * @return {String} branch of this Block
 */
Block.prototype.getBranch = function()
{
  return this.branch_
}

/**
 * Set the Block branch
 * @param {String} name branch of this Block
 */
Block.prototype.setBranch = function(name)
{
  this.branch_ = name
}

/**
 * Get the Block trunk
 * @return {String} trunk of this Block
 */
Block.prototype.getTrunk = function()
{
  return this.trunk_
}

/**
 * Set the Block trunk
 * @param {String} name Trunk of this Block
 */
Block.prototype.setTrunk = function(name)
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

/**
 * Populate Block from JSON
 * @param {String} json JSON string of Block object
 */
Block.prototype.populateFromJson = function(json)
{
  parsed = JSON.parse(json)
  this.name_ = parsed.name
  this.content_ = parsed.content
  this.branch_ = parsed.branch
  this.trunk_ = parsed.trunk
  this.hash_ = parsed.hash_
}
