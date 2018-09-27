var Crypto = require('crypto')

/**
 * Tips
 */
tips = []

/**
 * Genesis Block Hash 
 */
genesisHash =  Crypto.createHash('sha256').update('genesisBlockOfTangle').digest('hex')

module.exports = {
  genesisHash,

  tips
}
