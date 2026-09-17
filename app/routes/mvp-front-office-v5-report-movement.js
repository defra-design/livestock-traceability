const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v5/report-movement'

function returnToCheck(req, res, normalPath) {
  if (req.session.data['change'] === 'true') {
    delete req.session.data['change']
    return res.redirect(`${BASE}/check-movement-details`)
  }
  res.redirect(normalPath)
}

router.post(`${BASE}/movement-type`, (req, res) => {
  const type = req.session.data['movement-type']

  if (!type) {
    return res.render('mvp-front-office/v5/report-movement/movement-type', {
      errors: { 'movement-type': 'Select if this is an on or off movement' }
    })
  }

  returnToCheck(req, res, `${BASE}/movement-date`)
})

router.post(`${BASE}/movement-date`, (req, res) => {
  const data = req.session.data

  if (!data['movement-date-day'] || !data['movement-date-month'] || !data['movement-date-year']) {
    return res.render('mvp-front-office/v5/report-movement/movement-date', {
      errors: { 'movement-date': 'Enter the date of the movement' }
    })
  }

  returnToCheck(req, res, `${BASE}/ear-tag-numbers`)
})

router.post(`${BASE}/ear-tag-numbers`, (req, res) => {
  const data = req.session.data

  if (!data['movement-ear-tags'] || !data['movement-ear-tags'].trim()) {
    return res.render('mvp-front-office/v5/report-movement/ear-tag-numbers', {
      errors: { 'movement-ear-tags': 'Enter at least one ear tag number' }
    })
  }

  returnToCheck(req, res, `${BASE}/check-movement-details`)
})

router.post(`${BASE}/check-movement-details`, (req, res) => {
  res.redirect(`${BASE}/submit`)
})

router.post(`${BASE}/submit`, (req, res) => {
  res.redirect(`${BASE}/confirmation`)
})

router.post(`${BASE}/confirmation`, (req, res) => {
  res.redirect('/mvp-front-office/v5/my-holdings/report-cattle-movement')
})

module.exports = router
