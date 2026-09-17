const livestock = require('./table-data/livestock.json');
const livestockSameHerd = require('./table-data/livestock-same-herd.json');
const holdings = require('./table-data/holdings.json');
const holdingsSingleCph = require('./table-data/holdings-single-cph.json');
const delegatesSingleCph = require('./table-data/delegates-single-cph.json');
const holdings_v2 = require('./table-data/versions/v2/holdings.json');
const users_v2 = require('./table-data/versions/v2/users.json');
const events_livestock = require('./table-data/events-livestock.json');
const oakfield_livestock = require('./table-data/livestock-oakfield-cattle-register.json');
const pendingValidation = require('./table-data/pending-validation.json');

module.exports = {
  delegates: [
    { email: 'delegate@example.com', holdings: ['44/081/0001', '44/081/0002'] }
  ],
  livestock : livestock,
  livestockSameHerd : livestockSameHerd,
  holdings : holdings,
  holdings_v2 : holdings_v2,
  users_v2 : users_v2,
  events_livestock : events_livestock,
  holdingsSingleCph : holdingsSingleCph,
  delegatesSingleCph : delegatesSingleCph,
  oakfieldLivestock : oakfield_livestock,
  pendingValidation : pendingValidation,
  singleCph: '23/456/0001'
}
