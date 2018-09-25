var Blob = require('../..').ndnjs.Blob
var Crypto = require('crypto')

/* This class is responsible to create block to be attached to Tangle.
 * The constructor takes the interest and data pair.
 * @constructor
 * @param {Interest} interest An object of Interest to be attached to a block
 * @param {Data} data An object of Data paired with interest to be attached to a block
 */

var Block = function Block(interest, data)
{
  if (!(interest && data)) {
    throw new Error("Requires both interet and data. One or more missing.");
  }

  console.log("Creating block for Interest/Data: " + interest.getName())

  /* Block contains following information:
   * Block hash  | Unique hash identifying this block
   * Branch block  | Block being approved
   * Trunk block | Block bring approved
   * Content  | Interest/Data name followed by Data content
   * */

  interestNameUri = interest.getName().toUri()

  /* Create Block content Blob */
  this.content_ = new Blob(interestNameUri + ";" + data.getContent().buf().toString())

  /* Create Block Hash
   * Block hash is created by taking SHA256 hash of
   * Interest/Data name and current timestamp
   */
  this.hash_ =  Crypto.createHash('sha256').update(interestNameUri +
                                                   new Date().toISOString());
}

exports.Block = Block

/**
 * Get the Block hash
 * @return {Hash} SHA256 hash of this Block
 */
Block.prototype.getHash = function()
{
  return this.hash_;
};

/**
 * Get the Block content
 * @return {Blob} Content of this Block
 */
Block.prototype.getContent = function()
{
  return this.content_
}