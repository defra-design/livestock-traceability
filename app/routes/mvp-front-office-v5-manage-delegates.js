const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v5/manage-delegates'
const LIST_PAGE = '/mvp-front-office/v5/my-holdings/manage-delegates'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getHolding(req) {
  const holdingsData = req.session.data.holdingsSingleCph
  const holdingId = req.session.data['holding-id'] || 'holding-001'
  return holdingsData.holdings.find((h) => h.id === holdingId) || holdingsData.holdings[0]
}

function getDelegates(req) {
  return req.session.data.delegatesSingleCph.delegates
}

// Always replace with a new array/object rather than mutating in place -
// delegatesSingleCph starts out as the same object reference shared by every
// session (and by the "Clear data" default), so mutating it directly would
// corrupt the default for everyone until the server restarts.
function setDelegates(req, delegates) {
  req.session.data.delegatesSingleCph = { delegates }
}

function formatDateLong(date) {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function returnToCheck(req, res, normalPath) {
  if (req.session.data['change'] === 'true') {
    delete req.session.data['change']
    return res.redirect(`${BASE}/check-details`)
  }
  res.redirect(normalPath)
}

router.get(`${BASE}/view/:id`, (req, res) => {
  const delegate = getDelegates(req).find((d) => d.id === req.params.id)

  if (!delegate) {
    return res.status(404).send('Delegate not found')
  }

  req.session.data['delegate-id'] = delegate.id
  req.session.data['delegate-email'] = delegate.email
  req.session.data['delegate-role'] = delegate.role

  res.redirect(`${BASE}/check-details`)
})

router.get(`${BASE}/add-email`, (req, res) => {
  if (req.query.change !== 'true') {
    delete req.session.data['delegate-id']
    delete req.session.data['delegate-email']
    delete req.session.data['delegate-role']
  }

  res.render('mvp-front-office/v5/manage-delegates/add-email')
})

router.post(`${BASE}/add-email`, (req, res) => {
  const email = req.session.data['delegate-email']

  if (!email || !email.trim()) {
    return res.render('mvp-front-office/v5/manage-delegates/add-email', {
      errors: { 'delegate-email': "Enter your delegate's email address" }
    })
  }

  returnToCheck(req, res, `${BASE}/add-role`)
})

router.get(`${BASE}/add-role`, (req, res) => {
  res.render('mvp-front-office/v5/manage-delegates/add-role')
})

router.post(`${BASE}/add-role`, (req, res) => {
  if (!req.session.data['delegate-role']) {
    return res.render('mvp-front-office/v5/manage-delegates/add-role', {
      errors: { 'delegate-role': "Select your delegate's role" }
    })
  }

  returnToCheck(req, res, `${BASE}/before-you-send`)
})

router.get(`${BASE}/before-you-send`, (req, res) => {
  res.render('mvp-front-office/v5/manage-delegates/before-you-send')
})

router.post(`${BASE}/before-you-send`, (req, res) => {
  res.redirect(`${BASE}/check-details`)
})

router.get(`${BASE}/check-details`, (req, res) => {
  const holding = getHolding(req)
  const isUpdate = Boolean(req.session.data['delegate-id'])
  res.render('mvp-front-office/v5/manage-delegates/check-details', { holding, isUpdate })
})

router.post(`${BASE}/check-details`, (req, res) => {
  const data = req.session.data
  const delegates = getDelegates(req)

  if (data['delegate-id']) {
    // Existing delegate - apply any edits made via the "Change" links.
    // This is an update, not a new invitation, so there's nothing to
    // confirm - just save and return to the list.
    setDelegates(req, delegates.map((d) => (
      d.id === data['delegate-id']
        ? { ...d, email: data['delegate-email'], role: data['delegate-role'] }
        : d
    )))

    delete data['delegate-id']
    delete data['delegate-email']
    delete data['delegate-role']

    return res.redirect(LIST_PAGE)
  }

  // New delegate invite - add it to this session's copy of the list, then
  // show the "Invite sent" confirmation
  const newDelegate = {
    id: `delegate-${Date.now()}`,
    email: data['delegate-email'],
    role: data['delegate-role'],
    dateAdded: formatDateLong(new Date())
  }
  setDelegates(req, [...delegates, newDelegate])

  res.redirect(`${BASE}/confirmation`)
})

router.get(`${BASE}/confirmation`, (req, res) => {
  res.render('mvp-front-office/v5/manage-delegates/confirmation')
})

router.post(`${BASE}/confirmation`, (req, res) => {
  delete req.session.data['delegate-id']
  delete req.session.data['delegate-email']
  delete req.session.data['delegate-role']
  res.redirect(LIST_PAGE)
})

router.get(`${BASE}/remove-delegate`, (req, res) => {
  res.render('mvp-front-office/v5/manage-delegates/remove-delegate')
})

router.post(`${BASE}/remove-delegate`, (req, res) => {
  const data = req.session.data

  if (data['delegate-id']) {
    // An existing delegate - actually remove it from this session's list
    setDelegates(req, getDelegates(req).filter((d) => d.id !== data['delegate-id']))
  }
  // Otherwise this was an invite still in progress - nothing to remove from
  // the list yet, just drop the in-flight wizard data below

  delete data['delegate-id']
  delete data['delegate-email']
  delete data['delegate-role']
  res.redirect(LIST_PAGE)
})

module.exports = router
