var Database = require('../..').Database
var Crypto = require('crypto')

/**
 * This class represents Tangle. 
 */

var Tangle = function Tangle()
{
  this.db_ =  new Database()

  /* Attach genesis */
  this.genesisHash_ =  Crypto.createHash('sha256').update('genesisBlockOfTangle').digest('hex')

  this.db_.putContent(this.genesisHash_, '')
  this.db_.putWeight(this.genesisHash_, 1)
  this.db_.putApprovers(this.genesisHash_, [])
  

  /* Initialize tips */
  this.tips_ = [ this.genesisHash_ ]
}

/**
 * Update Approvers
 */
Tangle.prototype.updateApprovers = function(approveeHash, approverHash)
{
  approversFunc = this.db_.getApprovers(approveeHash)
  approversFunc.then(function(approvers){
    approvers = [...approvers]
    approvers.push(approverHash)
    tangle.db_.putApprovers(approveeHash, approvers)
  })
}

/**
 * Update weight
 */
Tangle.prototype.updateWeight = function(hash)
{
  weightFunc = this.db_.getWeight(hash)
  weightFunc.then(function(weight){
    weight = weight + 1
    tangle.db_.putWeight(hash, weight)
  })
}

/**
 * Update weights
 * @param {String} hash Hash of first block in the chain
 */
Tangle.prototype.updateWeights = async function(hash, visited)
{
  visited.push(hash)
  if (hash == this.genesisHash_){
    return
  }
  
  branchCurrent = await this.db_.getBranchHash(hash)
  if (!(branchCurrent in visited)){
    this.updateWeight(branchCurrent)
    this.updateWeights(branchCurrent, visited)
  }

  trunkCurrent = await this.db_.getTrunkHash(hash)
  if (trunkCurrent != branchCurrent && !(trunkCurrent in visited)){
    this.updateWeight(trunkCurrent)
    this.updateWeights(trunkCurrent, visited)
  }
}

/**
 * Tip Selection Algorithm
 * @return {String} Hash of selected tip
 */
tipSelection = function(db, genesisHash, tips)
{
  current = genesisHash
  while (!(tips.includes(current))){
    approvers = db.getApprovers(current)
    weights = []
    for (approver in approvers){
      weights.push(db.getWeight(approver))
    }

    selectedApprover = null

    /* Weighted selection of random number */
    cumWeights = []
    cumWeights[0] = weights[0]
    for (i = 1; i < weights.length; i++){
      cumWeights[i] = weights[i-1] + weights[i]
    }

    min = cumWeights[0]
    max = cumWeights[cumWeights.length - 1]
    randInt = Math.floor(Math.random() * (max - min + 1)) + min;

    bisected = false
    for (i = 0; i < cumWeights.length; i++){
      if (randInt < cumWeights[i]){
        selectedApprover = approvers[i]
        bisected = true
        break;
      }
    }

    if (!(bisected)) {
      selectedApprover = approvers[approvers.length - 1]
    }

    current = selectedApprover
  }

  return current
}

/**
 * Attach block to the Tangle, that is,
 * write it to leveldb
 * @param {Block} block The block to be attached
 */
Tangle.prototype.attach = function(block)
{
  hash = block.getHash()

  this.db_.putContent(hash, block.getContent().buf().toString())
  this.db_.putWeight(hash, 1)
  this.db_.putApprovers(hash, [])

  var branchHash = null
  var trunkHash = null

  /** If block was produced by this node */
  if (!(block.branchHash || block.trunkHash)){
    /**
      * Tip selection
      * We perform MC random walk from genesis to tips
      * Probability of node i being chosen = W_i/W_total
      */
    branchHash = tipSelection(this.db_, this.genesisHash_, this.tips_)
    trunkHash = tipSelection(this.db_, this.genesisHash_, this.tips_)
  } else {
    branchHash = block.branchHash
    trunkHash = block.trunkHash
  }

  /**
    * Update these branch and trunk
    */
  this.updateWeight(branchHash)
  this.updateApprovers(branchHash, hash)

  if (branchHash != trunkHash){
    this.updateWeight(branchHash)
    this.updateApprovers(branchHash, hash)
  }

  this.db_.putBranchHash(hash, branchHash)
  this.db_.putTrunkHash(hash, trunkHash)

}

/**
 * Get block from the Tangle, that is,
 * read it from leveldb
 * @param {String} hash Hash of the block to be fetched
 * @return {Block} The block fetched
 */
Tangle.prototype.fetch = async function(hash)
{
  content = await this.db_.getContent(hash)
  branchHash = await this.db_.getBranchHash(hash)
  trunkHash = await this.db_.getTrunkHash(hash)
  
  return [ content, branchHash, trunkHash ]
}

/**
 * Get Tangle tips
 * @return {Array} Tips
 */
Tangle.prototype.getTips = function()
{
  return this.tips_
}

tangle = new Tangle()
exports.tangle = tangle
