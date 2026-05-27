const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/livestock-usability/v2/registration-method', (req, res) => {
  const method = req.session.data['registration-method']
  if (method === 'file-upload') {
    res.redirect('/livestock-usability/v2/file-upload')
  } else {
    res.redirect('/livestock-usability/v2/animal-select')
  }
})

router.post('/livestock-usability/v2/animal-select', (req, res) => {
  res.redirect('/livestock-usability/v2/tag-entry')
})

router.post('/livestock-usability/v2/upload', (req, res) => {
  res.redirect('/livestock-usability/v2/tag-list')
})

router.post('/livestock-usability/v2/tag-entry', (req, res) => {
  res.redirect('/livestock-usability/v2/tag-list')
})

router.post('/livestock-usability/v2/tag-list', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v2/tag-entry')
  } else {
    res.redirect('/livestock-usability/v2/submit')
  }
})

router.get('/livestock-usability/v2/calf-details', (req, res) => {
  if (req.query.tag) {
    req.session.data['current-tag'] = req.query.tag
  }
  res.render('livestock-usability/v2/calf-details')
})

router.post('/livestock-usability/v2/calf-details', (req, res) => {
  res.redirect('/livestock-usability/v2/calf-details-radio')
})

router.post('/livestock-usability/v2/calf-details-radio', (req, res) => {
  const answer = req.session.data['calf-details-radio']
  if (answer === 'option-1') {
    res.redirect('/livestock-usability/v2/multiple-birth')
  } else {
    res.redirect('/livestock-usability/v2/breed')
  }
})

router.post('/livestock-usability/v2/multiple-birth', (req, res) => {
  res.redirect('/livestock-usability/v2/breed')
})

router.post('/livestock-usability/v2/dam-details', (req, res) => {
  res.redirect('/livestock-usability/v2/sire-details')
})

router.post('/livestock-usability/v2/sire-details', (req, res) => {
  res.redirect('/livestock-usability/v2/check-calf-details')
})

router.post('/livestock-usability/v2/check-calf-details', (req, res) => {
  const currentTag = req.session.data['current-tag']
  if (currentTag) {
    let completed = req.session.data['completed-tags'] || []
    if (!Array.isArray(completed)) completed = [completed]
    if (!completed.includes(currentTag)) completed.push(currentTag)
    req.session.data['completed-tags'] = completed
  }
  res.redirect('/livestock-usability/v2/tag-list')
})

router.post('/livestock-usability/v2/tag-list-complete', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v2/tag-entry')
  } else {
    res.redirect('/livestock-usability/v2/submit')
  }
})

router.post('/livestock-usability/v2/submit', (req, res) => {
  res.redirect('/livestock-usability/v2/confirmation')
})

router.post('/livestock-usability/v2/embryo-transfer', (req, res) => {
  const embryoTransfer = req.session.data['embryo-transfer']
  if (embryoTransfer === 'yes') {
    res.redirect('/livestock-usability/v2/surrogate-dam')
  } else {
    res.redirect('/livestock-usability/v2/genetic-dam')
  }
})

router.post('/livestock-usability/v2/surrogate-dam', (req, res) => {
  res.redirect('/livestock-usability/v2/genetic-dam')
})

router.post('/livestock-usability/v2/genetic-dam', (req, res) => {
  res.redirect('/livestock-usability/v2/sire-number')
})

router.post('/livestock-usability/v2/sire-number', (req, res) => {
  res.redirect('/livestock-usability/v2/breed')
})

router.post('/livestock-usability/v2/breed', (req, res) => {
  res.redirect('/livestock-usability/v2/dam-details')
})

router.post('/livestock-usability/v2/animal-number', (req, res) => {
  res.redirect('/livestock-usability/v2/sex')
})

router.post('/livestock-usability/v2/sex', (req, res) => {
  res.redirect('/livestock-usability/v2/check-your-answers')
})

router.post('/livestock-usability/v2/check-your-answers', (req, res) => {
  res.redirect('/livestock-usability/v2/confirmation')
})

router.post('/livestock-usability/v2/confirmation', (req, res) => {
  res.redirect('/livestock-usability/v2/register-an-animal')
})

router.post('/livestock-usability/v2/register-an-animal-birth', (req, res) => {
  res.redirect('/livestock-usability/v2/animal-select')
})

router.post('/livestock-usability/v2/submission-detail', (req, res) => {
  res.redirect('/livestock-usability/v2/submit')
})

module.exports = router
