const livestock = require('./table-data/livestock.json');
const livestockSameHerd = require('./table-data/livestock-same-herd.json');
const holdings = require('./table-data/holdings.json');
const holdingsSingleCph = require('./table-data/holdings-single-cph.json');

module.exports = {
  delegates: [
    { email: 'delegate@example.com', holdings: ['44/081/0001', '44/081/0002'] }
  ],
  livestock : livestock,
  livestockSameHerd : livestockSameHerd,
  holdings : holdings,
  holdingsSingleCph : holdingsSingleCph,
  singleCph: '23/456/0001'
}
