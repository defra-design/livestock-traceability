// Large, read-only datasets shared by every journey.
//
// These are deliberately NOT in session-data-defaults.js. Everything in there
// is copied into every user's session file, which is read and written on most
// requests - with this data in, each session was ~75KB+ and the prototype
// slowed down and eventually fell over with lots of concurrent users.
//
// app/routes.js attaches these to req.session.data (and to `data` in views) on
// every request, so routes and templates read them exactly as before - for
// example req.session.data.livestockSameHerd - but they're never saved into
// the session.
//
// Every user shares the same copy, so don't change these objects in place.
// Data a user can change (for example delegates) belongs in
// session-data-defaults.js instead.

const livestock = require('./table-data/livestock.json');
const livestockSameHerd = require('./table-data/livestock-same-herd.json');
const holdings = require('./table-data/holdings.json');
const holdingsSingleCph = require('./table-data/holdings-single-cph.json');
//const holdings_v2 = require('./table-data/versions/v2/holdings.json');
//const holdings_v3 = require('./table-data/versions/v3/holdings.json');
const users_v2 = require('./table-data/versions/v2/users.json');
const events_livestock = require('./table-data/events-livestock.json');
//const events_livestock_v2 = require('./table-data/events-livestock-v2.json');
//const events_livestock_v3 = require('./table-data/versions/v3/events-livestock.json');
//const oakfield_livestock = require('./table-data/livestock-oakfield-cattle-register.json');
const pendingValidation = require('./table-data/pending-validation.json');

module.exports = {
  livestock : livestock,
  livestockSameHerd : livestockSameHerd,
  holdings : holdings,
//  holdings_v2 : holdings_v2,
//  holdings_v3 : holdings_v3,
  users_v2 : users_v2,
  events_livestock : events_livestock,
//  events_v2 : events_livestock_v2,
//  events_v3 : events_livestock_v3,
  holdingsSingleCph : holdingsSingleCph,
//  oakfieldLivestock : oakfield_livestock,
  pendingValidation : pendingValidation
}
