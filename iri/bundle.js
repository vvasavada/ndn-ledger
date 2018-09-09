var FileReader = require('filereader')
var Blob = require('..').ndnjs.Blob
var Crypto = require('crypto')

/* This class is responsible to create bundle (blocks) to be attached to Tangle.
 * The constructor takes the interest and data pair.
 * @constructor
 * @param {Interest} interest An object of Interest to be attached to a bundle
 * @param {Data} data An object of Data paired with interest to be attached to a bundle
 */

var Bundle = function Bundle(interest, data)
{
  if (!(interest && data)) {
    throw new Error("Requires both interet and data. One or more missing.");
  }

  console.log("Creating bundle for Interest/Data: " + interest.getName())

  /* Bundle contains following information:
   * Bundle hash  | Unique hash identifying this bundle
   * Branch bundle  | Bundle being approved
   * Trunk bundle | Bundle bring approved
   * Content  | Interest/Data name followed by Data content
   * */

  interestNameUri = interest.getName().toUri()

  /* Create Bundle content Blob */
  this.content_ = new Blob(interestNameUri + ";" + data.getContent().buf().toString())

  /* Create Bundle Hash
   * Bundle hash is created by taking SHA256 hash of
   * Interest/Data name and current timestamp
   */
  this.hash_ =  Crypto.createHash('sha256').update(interestNameUri +
                                                   new Date().toISOString());
}

exports.Bundle = Bundle

/**
 * Get the Bundle hash
 * @return {Hash} SHA256 hash of this Bundle
 */
Bundle.prototype.getHash = function()
{
  return this.hash_;
};

/**
 * Get the Bundle content
 * @return {Blob} Content of this Bundle
 */
Bundle.prototype.getContent = function()
{
  return this.content_
}
