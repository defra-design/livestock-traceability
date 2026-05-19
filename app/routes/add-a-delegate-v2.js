const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/add-a-delegate-v2/setup', (req, res) => {
  if (!req.session.data['cph-type']) {
    return res.render('add-a-delegate-v2/setup', {
      data: req.session.data,
      errors: [{ text: 'Select how many County Parish Holdings you have', href: '#cph-type' }]
    })
  }
  res.redirect('/add-a-delegate-v2/start')
})

router.post('/add-a-delegate-v2/manage-access', (req, res) => {
  const holdings = req.session.data['manage-access']
  const hasSelection = holdings && (Array.isArray(holdings) ? holdings.length > 0 : true)
  if (!hasSelection) {
    return res.render('add-a-delegate-v2/manage-access', {
      data: req.session.data,
      errors: [{ text: 'Select at least one County Parish Holding Number', href: '#manage-access' }]
    })
  }
  res.redirect('/add-a-delegate-v2/delegate-account-info')
})

router.post('/add-a-delegate-v2/add-delegate', (req, res) => {
  if (!req.session.data['email-address'] || !req.session.data['email-address'].trim()) {
    return res.render('add-a-delegate-v2/add-delegate', {
      data: req.session.data,
      errors: [{ text: 'Enter an email address', href: '#email-address' }]
    })
  }
  const cphType = req.session.data['cph-type']
  if (cphType === 'single') {
    req.session.data['manage-access'] = req.session.data.singleCph
    res.redirect('/add-a-delegate-v2/delegate-account-info')
  } else {
    res.redirect('/add-a-delegate-v2/manage-access')
  }
})

router.post('/add-a-delegate-v2/delegate-account-info', (req, res) => {
  res.redirect('/add-a-delegate-v2/check-details')
})

router.get('/add-a-delegate-v2/manage-delegate', (req, res) => {
  const index = parseInt(req.query.index) || 0
  const delegates = req.session.data.delegates || []
  const delegate = delegates[index] || null
  req.session.data.currentDelegateIndex = index
  req.session.data.currentDelegate = delegate
  req.session.data['manage-access'] = delegate ? delegate.holdings : []
  res.render('add-a-delegate-v2/manage-delegate', { data: req.session.data })
})

router.post('/add-a-delegate-v2/manage-delegate', (req, res) => {
  const index = req.session.data.currentDelegateIndex || 0
  const delegates = req.session.data.delegates || []
  let holdings = req.session.data['manage-access']
  if (!Array.isArray(holdings)) holdings = holdings ? [holdings] : []
  if (holdings.length === 0) {
    return res.render('add-a-delegate-v2/manage-delegate', {
      data: req.session.data,
      errors: [{ text: 'Select at least one County Parish Holding Number', href: '#manage-access' }]
    })
  }
  if (delegates[index]) {
    delegates[index].holdings = holdings
    req.session.data.delegates = delegates
  }
  res.redirect('/add-a-delegate-v2/start')
})

router.post('/add-a-delegate-v2/confirmation', (req, res) => {
  delete req.session.data['email-address']
  delete req.session.data['manage-access']
  res.redirect('/add-a-delegate-v2/start')
})

router.post('/add-a-delegate-v2/remove-delegate', (req, res) => {
  const index = req.session.data.currentDelegateIndex
  let delegates = req.session.data.delegates || []
  if (index !== undefined && index !== null) {
    delegates.splice(index, 1)
    req.session.data.delegates = delegates
  }
  res.redirect('/add-a-delegate-v2/start')
})

router.post('/add-a-delegate-v2/check-details', (req, res) => {
  const delegates = req.session.data.delegates || []
  let holdings = req.session.data['manage-access']
  if (!Array.isArray(holdings)) holdings = holdings ? [holdings] : []
  delegates.push({
    email: req.session.data['email-address'],
    holdings: holdings
  })
  req.session.data.delegates = delegates
  req.session.data.confirmedDelegateEmail = req.session.data['email-address']
  res.redirect('/add-a-delegate-v2/confirmation')
})

module.exports = router
