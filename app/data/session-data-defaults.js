const livestock = require('./table-data/livestock.json');
const holdings = require('./table-data/holdings.json');

module.exports = {
  delegates: [
    { email: 'delegate@example.com', holdings: ['44/081/0001', '44/081/0002'] }
  ],
  livestock : livestock,
  holdings : holdings,
  singleCph: '23/456/0001'
}
