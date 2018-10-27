var Crypto = require('crypto')

/* This class is responsible to create data content for the Block
 * The constructor takes in prefix and content
 * @constructor
 * @param {String} content The actual content of a Block
 */

var DataContent = function DataContent(content)
{
  /* DataContent contains following information:
   * Branch block  | Block being approved
   * Trunk block | Block being approved
   * Content  | Actual block content
   * */

  /* Create Block content */
  this.content_ = content

  /* branch and trunk are initially null
   * Tangle.attach() runs tip selection and sets them
   */
  this.branch_ = null
  this.trunk_ = null
}

exports.DataContent = DataContent

/**
 * Get the Block content
 * @return {String} Actual content of this Block
 */
DataContent.prototype.getContent = function()
{
  return this.content_
}

/**
 * Set the actual Block content
 * @param {String} Actual content to be set for this Block
 */
DataContent.prototype.setContent = function(content)
{
  this.content_ = content
}

/**
 * Get the Block branch
 * @return {String} branch of this Block
 */
DataContent.prototype.getBranch = function()
{
  return this.branch_
}

/**
 * Set the Block branch
 * @param {String} name branch of this Block
 */
DataContent.prototype.setBranch = function(name)
{
  this.branch_ = name
}

/**
 * Get the Block trunk
 * @return {String} trunk of this Block
 */
DataContent.prototype.getTrunk = function()
{
  return this.trunk_
}

/**
 * Set the Block trunk
 * @param {String} name Trunk of this Block
 */
DataContent.prototype.setTrunk = function(name)
{
  this.trunk_ = name
}

/**
 * Populate DataContent from JSON
 * @param {String} json JSON string of DataContent object
 */
DataContent.prototype.populateFromJson = function(json)
{
  parsed = JSON.parse(json)
  this.content_ = parsed.content_
  this.branch_ = parsed.branch_
  this.trunk_ = parsed.trunk_
}
