// Copied into every user's session and saved on most requests, so keep this
// small - only data a user can change during a journey. Large read-only
// datasets go in reference-data.js instead.

const delegatesSingleCph = require('./table-data/delegates-single-cph.json');

module.exports = {
  delegates: [
    { email: 'delegate@example.com', holdings: ['44/081/0001', '44/081/0002'] }
  ],
  delegatesSingleCph : delegatesSingleCph,
  singleCph: '23/456/0001'
}
