const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/livestock-usability/v1/animal-select', (req, res) => {
  res.redirect('/livestock-usability/v1/quantity')
})

router.post('/livestock-usability/v1/quantity', (req, res) => {
  const quantity = req.session.data['quantity']
  if (quantity === 'more-than-100') {
    res.redirect('/livestock-usability/v1/upload')
  } else {
    res.redirect('/livestock-usability/v1/tag-entry')
  }
})

router.post('/livestock-usability/v1/upload', (req, res) => {
  res.redirect('/livestock-usability/v1/tag-list')
})

router.post('/livestock-usability/v1/tag-entry', (req, res) => {
  res.redirect('/livestock-usability/v1/tag-list')
})

router.post('/livestock-usability/v1/tag-list', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v1/tag-entry')
  } else {
    res.redirect('/livestock-usability/v1/confirmation')
  }
})

router.post('/livestock-usability/v1/calf-details', (req, res) => {
  res.redirect('/livestock-usability/v1/breed')
})

router.post('/livestock-usability/v1/genetic-details', (req, res) => {
  res.redirect('/livestock-usability/v1/check-calf-details')
})

router.post('/livestock-usability/v1/check-calf-details', (req, res) => {
  res.redirect('/livestock-usability/v1/tag-list-complete')
})

router.post('/livestock-usability/v1/tag-list-complete', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v1/tag-entry')
  } else {
    res.redirect('/livestock-usability/v1/submit')
  }
})

router.post('/livestock-usability/v1/submit', (req, res) => {
  res.redirect('/livestock-usability/v1/confirmation')
})

router.post('/livestock-usability/v1/embryo-transfer', (req, res) => {
  const embryoTransfer = req.session.data['embryo-transfer']
  if (embryoTransfer === 'yes') {
    res.redirect('/livestock-usability/v1/surrogate-dam')
  } else {
    res.redirect('/livestock-usability/v1/genetic-dam')
  }
})

router.post('/livestock-usability/v1/surrogate-dam', (req, res) => {
  res.redirect('/livestock-usability/v1/genetic-dam')
})

router.post('/livestock-usability/v1/genetic-dam', (req, res) => {
  res.redirect('/livestock-usability/v1/sire-number')
})

router.post('/livestock-usability/v1/sire-number', (req, res) => {
  res.redirect('/livestock-usability/v1/breed')
})

router.post('/livestock-usability/v1/breed', (req, res) => {
  res.redirect('/livestock-usability/v1/genetic-details')
})

router.post('/livestock-usability/v1/animal-number', (req, res) => {
  res.redirect('/livestock-usability/v1/sex')
})

router.post('/livestock-usability/v1/sex', (req, res) => {
  res.redirect('/livestock-usability/v1/check-your-answers')
})

router.post('/livestock-usability/v1/check-your-answers', (req, res) => {
  res.redirect('/livestock-usability/v1/confirmation')
})

router.post('/livestock-usability/v1/confirmation', (req, res) => {
  res.redirect('/livestock-usability/v1/start')
})

module.exports = router
