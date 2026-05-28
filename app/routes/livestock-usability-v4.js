const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/livestock-usability/v4/registration-method', (req, res) => {
  const method = req.session.data['registration-method']
  if (method === 'file-upload') {
    res.redirect('/livestock-usability/v4/file-upload')
  } else {
    res.redirect('/livestock-usability/v4/animal-select')
  }
})

router.post('/livestock-usability/v4/animal-select', (req, res) => {
  res.redirect('/livestock-usability/v4/calf-details')
})

router.post('/livestock-usability/v4/upload', (req, res) => {
  res.redirect('/livestock-usability/v4/tag-list')
})

router.post('/livestock-usability/v4/tag-entry', (req, res) => {
  res.redirect('/livestock-usability/v4/tag-list')
})

router.post('/livestock-usability/v4/tag-list', (req, res) => {
  const data = req.session.data
  const addAnother = data['add-another']
  const errors = {}

  if (!addAnother) {
    errors['add-another'] = 'Select yes or no'
  } else if (addAnother === 'no') {
    const damComplete = (data['dam-type'] === 'genetic' && data['dam-number']) ||
                        (data['dam-type'] === 'surrogate' && data['surrogate-dam-number'])
    const isComplete = data['ear-tag-number'] && data['dob-day'] && data['dob-month'] &&
                       data['dob-year'] && data['sex'] && data['breed'] && damComplete
    if (!isComplete) {
      errors['incomplete'] = 'Complete all required animal details before continuing'
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render('livestock-usability/v4/tag-list', { errors })
  }

  if (addAnother === 'yes') {
    return res.redirect('/livestock-usability/v4/calf-details')
  }

  res.redirect('/livestock-usability/v4/submit')
})

router.get('/livestock-usability/v4/calf-details', (req, res) => {
  if (req.query.tag) {
    req.session.data['current-tag'] = req.query.tag
  }
  res.render('livestock-usability/v4/calf-details')
})

router.post('/livestock-usability/v4/calf-details', (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['ear-tag-number']) {
    errors['ear-tag-number'] = 'Select an ear tag number'
  }

  if (!data['dob-day'] || !data['dob-month'] || !data['dob-year']) {
    errors['dob'] = 'Enter a date of birth'
  }

  if (!data['sex']) {
    errors['sex'] = 'Select a sex'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('livestock-usability/v4/calf-details', { errors })
  }

  res.redirect('/livestock-usability/v4/breed')
})

router.post('/livestock-usability/v4/calf-details-radio', (req, res) => {
  const answer = req.session.data['calf-details-radio']
  if (answer === 'option-1') {
    res.redirect('/livestock-usability/v4/multiple-birth')
  } else {
    res.redirect('/livestock-usability/v4/breed')
  }
})

router.post('/livestock-usability/v4/multiple-birth', (req, res) => {
  res.redirect('/livestock-usability/v4/breed')
})

router.post('/livestock-usability/v4/dam-details', (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['dam-type']) {
    errors['dam-type'] = 'Select genetic or surrogate'
  } else if (data['dam-type'] === 'genetic' && !data['dam-number']) {
    errors['dam-number'] = 'Enter the genetic dam ear tag number'
  } else if (data['dam-type'] === 'surrogate' && !data['surrogate-dam-number']) {
    errors['surrogate-dam-number'] = 'Enter the surrogate dam ear tag number'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('livestock-usability/v4/dam-details', { errors })
  }

  res.redirect('/livestock-usability/v4/sire-details')
})

router.post('/livestock-usability/v4/sire-details', (req, res) => {
  res.redirect('/livestock-usability/v4/check-calf-details')
})

router.get('/livestock-usability/v4/remove-calf', (req, res) => {
  res.render('livestock-usability/v4/remove-calf')
})

router.post('/livestock-usability/v4/remove-calf', (req, res) => {
  const fields = [
    'ear-tag-number', 'dob-day', 'dob-month', 'dob-year', 'sex',
    'breed', 'dam-type', 'dam-number', 'surrogate-dam-number',
    'sire-number', 'sire-name', 'calf-details-radio', 'related-tag-numbers',
    'completed-tags', 'current-tag'
  ]
  fields.forEach(f => delete req.session.data[f])
  res.redirect('/livestock-usability/v4/tag-list')
})

router.post('/livestock-usability/v4/check-calf-details', (req, res) => {
  const earTagNumber = req.session.data['ear-tag-number']
  if (earTagNumber) {
    const fullTag = 'UK 12 34 56 ' + earTagNumber
    let completed = req.session.data['completed-tags'] || []
    if (!Array.isArray(completed)) completed = [completed]
    if (!completed.includes(fullTag)) completed.push(fullTag)
    req.session.data['completed-tags'] = completed
  }
  res.redirect('/livestock-usability/v4/tag-list')
})

router.post('/livestock-usability/v4/tag-list-complete', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v4/tag-entry')
  } else {
    res.redirect('/livestock-usability/v4/submit')
  }
})

router.post('/livestock-usability/v4/submit', (req, res) => {
  res.redirect('/livestock-usability/v4/confirmation')
})

router.post('/livestock-usability/v4/embryo-transfer', (req, res) => {
  const embryoTransfer = req.session.data['embryo-transfer']
  if (embryoTransfer === 'yes') {
    res.redirect('/livestock-usability/v4/surrogate-dam')
  } else {
    res.redirect('/livestock-usability/v4/genetic-dam')
  }
})

router.post('/livestock-usability/v4/surrogate-dam', (req, res) => {
  res.redirect('/livestock-usability/v4/genetic-dam')
})

router.post('/livestock-usability/v4/genetic-dam', (req, res) => {
  res.redirect('/livestock-usability/v4/sire-number')
})

router.post('/livestock-usability/v4/sire-number', (req, res) => {
  res.redirect('/livestock-usability/v4/breed')
})

router.post('/livestock-usability/v4/breed', (req, res) => {
  if (!req.session.data['breed']) {
    return res.render('livestock-usability/v4/breed', {
      errors: { breed: 'Select at least one breed' }
    })
  }
  res.redirect('/livestock-usability/v4/dam-details')
})

router.post('/livestock-usability/v4/animal-number', (req, res) => {
  res.redirect('/livestock-usability/v4/sex')
})

router.post('/livestock-usability/v4/sex', (req, res) => {
  res.redirect('/livestock-usability/v4/check-your-answers')
})

router.post('/livestock-usability/v4/check-your-answers', (req, res) => {
  res.redirect('/livestock-usability/v4/confirmation')
})

router.post('/livestock-usability/v4/confirmation', (req, res) => {
  res.redirect('/livestock-usability/v4/register-an-animal')
})

router.post('/livestock-usability/v4/register-an-animal-birth', (req, res) => {
  res.redirect('/livestock-usability/v4/animal-select')
})

router.post('/livestock-usability/v4/submission-detail', (req, res) => {
  res.redirect('/livestock-usability/v4/submit')
})

module.exports = router
