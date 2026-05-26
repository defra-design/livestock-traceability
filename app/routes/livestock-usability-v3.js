const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/livestock-usability/v3/cattle-activity', (req, res) => {
  const activity = req.session.data['cattle-activity']
  if (activity === 'option-1') {
    res.redirect('/livestock-usability/v3/registration-method')
  } else {
    res.redirect('/livestock-usability/v3/cattle-activity')
  }
})

router.post('/livestock-usability/v3/registration-method', (req, res) => {
  const method = req.session.data['registration-method']
  if (method === 'file-upload') {
    res.redirect('/livestock-usability/v3/file-upload')
  } else {
    res.redirect('/livestock-usability/v3/tag-entry')
  }
})

router.post('/livestock-usability/v3/animal-select', (req, res) => {
  res.redirect('/livestock-usability/v3/tag-entry')
})

router.post('/livestock-usability/v3/upload', (req, res) => {
  res.redirect('/livestock-usability/v3/tag-list')
})

router.post('/livestock-usability/v3/tag-entry', (req, res) => {
  res.redirect('/livestock-usability/v3/tag-list')
})

router.post('/livestock-usability/v3/tag-list', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v3/tag-entry')
  } else {
    res.redirect('/livestock-usability/v3/submit')
  }
})

router.get('/livestock-usability/v3/calf-details', (req, res) => {
  if (req.query.tag) {
    req.session.data['current-tag'] = req.query.tag
  }
  res.render('livestock-usability/v3/calf-details')
})

router.post('/livestock-usability/v3/calf-details', (req, res) => {
  res.redirect('/livestock-usability/v3/calf-details-radio')
})

router.post('/livestock-usability/v3/calf-details-radio', (req, res) => {
  const answer = req.session.data['calf-details-radio']
  if (answer === 'option-1') {
    res.redirect('/livestock-usability/v3/multiple-birth')
  } else {
    res.redirect('/livestock-usability/v3/breed')
  }
})

router.post('/livestock-usability/v3/multiple-birth', (req, res) => {
  res.redirect('/livestock-usability/v3/breed')
})

router.post('/livestock-usability/v3/dam-details', (req, res) => {
  res.redirect('/livestock-usability/v3/sire-details')
})

router.post('/livestock-usability/v3/sire-details', (req, res) => {
  res.redirect('/livestock-usability/v3/check-calf-details')
})

router.post('/livestock-usability/v3/check-calf-details', (req, res) => {
  const currentTag = req.session.data['current-tag']
  if (currentTag) {
    let completed = req.session.data['completed-tags'] || []
    if (!Array.isArray(completed)) completed = [completed]
    if (!completed.includes(currentTag)) completed.push(currentTag)
    req.session.data['completed-tags'] = completed
  }
  res.redirect('/livestock-usability/v3/tag-list')
})

router.post('/livestock-usability/v3/tag-list-complete', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v3/tag-entry')
  } else {
    res.redirect('/livestock-usability/v3/submit')
  }
})

router.post('/livestock-usability/v3/submit', (req, res) => {
  res.redirect('/livestock-usability/v3/confirmation')
})

router.post('/livestock-usability/v3/embryo-transfer', (req, res) => {
  const embryoTransfer = req.session.data['embryo-transfer']
  if (embryoTransfer === 'yes') {
    res.redirect('/livestock-usability/v3/surrogate-dam')
  } else {
    res.redirect('/livestock-usability/v3/genetic-dam')
  }
})

router.post('/livestock-usability/v3/surrogate-dam', (req, res) => {
  res.redirect('/livestock-usability/v3/genetic-dam')
})

router.post('/livestock-usability/v3/genetic-dam', (req, res) => {
  res.redirect('/livestock-usability/v3/sire-number')
})

router.post('/livestock-usability/v3/sire-number', (req, res) => {
  res.redirect('/livestock-usability/v3/breed')
})

router.post('/livestock-usability/v3/breed', (req, res) => {
  res.redirect('/livestock-usability/v3/dam-details')
})

router.post('/livestock-usability/v3/animal-number', (req, res) => {
  res.redirect('/livestock-usability/v3/sex')
})

router.post('/livestock-usability/v3/sex', (req, res) => {
  res.redirect('/livestock-usability/v3/check-your-answers')
})

router.post('/livestock-usability/v3/check-your-answers', (req, res) => {
  res.redirect('/livestock-usability/v3/confirmation')
})

router.post('/livestock-usability/v3/confirmation', (req, res) => {
  res.redirect('/livestock-usability/v3/cattle-registration-service')
})

router.post('/livestock-usability/v3/register-an-animal-birth', (req, res) => {
  res.redirect('/livestock-usability/v3/animal-select')
})

router.post('/livestock-usability/v3/submission-detail', (req, res) => {
  res.redirect('/livestock-usability/v3/submit')
})

module.exports = router
