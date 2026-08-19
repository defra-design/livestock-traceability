const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v4/register-animal'

function returnToCheck(req, res, normalPath) {
  if (req.session.data['change'] === 'true') {
    delete req.session.data['change']
    return res.redirect(`${BASE}/check-calf-details`)
  }
  res.redirect(normalPath)
}

router.get(`${BASE}/animal-select`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/animal-select')
})

router.post(`${BASE}/animal-select`, (req, res) => {
  const animalType = req.session.data['animal-type']

  if (!animalType) {
    return res.render('mvp-front-office/v4/register-animal/animal-select', {
      errors: {
        'animal-type': { text: 'Select a species from the list' }
      }
    })
  }

  res.redirect('/mvp-front-office/v4/report-death/is-registered')
})

router.get(`${BASE}/submission-type`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/submission-type')
})

router.post(`${BASE}/submission-type`, (req, res) => {
  const submissionType = req.session.data['submission-type']

  if (!submissionType) {
    return res.render('mvp-front-office/v4/register-animal/submission-type', {
      errors: { 'submission-type': 'Select the type of submission you would like to make' }
    })
  }

  if (submissionType === 'birth') {
    return res.redirect(`${BASE}/calf-details`)
  }

  if (submissionType === 'death') {
    return res.redirect(`${BASE}/animal-select`)
  }

  res.redirect(`${BASE}/submission-type`)
})

router.get(`${BASE}/calf-details`, (req, res) => {
  if (req.query.tag) {
    req.session.data['current-tag'] = req.query.tag
  }
  res.render('mvp-front-office/v4/register-animal/calf-details')
})

router.post(`${BASE}/calf-details`, (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['ear-tag-number']) {
    errors['ear-tag-number'] = 'Enter the last 6 digits of the animal ear tag number you are registering'
  }

  if (!data['dob-day'] || !data['dob-month'] || !data['dob-year']) {
    errors['dob'] = 'Enter the date the animal was born'
  }

  if (!data['sex']) {
    errors['sex'] = 'Select if the animal is male or female'
  }

  if (!data['breed']) {
    errors['breed'] = 'Enter the animal breed or breed code into the text box and select the correct one from the suggested options'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v4/register-animal/calf-details', { errors })
  }

  returnToCheck(req, res, `${BASE}/dam-details`)
})

router.get(`${BASE}/dam-details`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/dam-details')
})

router.post(`${BASE}/dam-details`, (req, res) => {
  const data = req.session.data

  if (!data['dam-type']) {
    return res.render('mvp-front-office/v4/register-animal/dam-details', {
      errors: { 'dam-type': 'Select if the calf was born via a genetic or surrogate dam' }
    })
  }

  if (data['dam-type'] === 'surrogate') {
    return res.redirect(`${BASE}/surrogate-dam`)
  }

  res.redirect(`${BASE}/genetic-dam`)
})

router.get(`${BASE}/surrogate-dam`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/surrogate-dam')
})

router.post(`${BASE}/surrogate-dam`, (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['genetic-dam-number'] || !data['genetic-dam-number'].trim()) {
    errors['genetic-dam-number'] = 'Enter the ear tag number of the genetic dam'
  }

  const surrogateDamNumber = data['surrogate-dam-number']

  const knownSurrogateTags = [
    'UK123456601200', 'UK123456601201', 'UK123456601202', 'UK123456601203',
    'UK123456601204', 'UK123456601205', 'UK123456601206', 'UK123456601207',
    'UK123456601208', 'UK123456601209'
  ]
  const recentlyCalvedTags = ['UK123456601205']
  const tooYoungTags = ['UK123456601206']
  const tooOldTags = ['UK123456601207']

  if (!surrogateDamNumber || !surrogateDamNumber.trim()) {
    errors['surrogate-dam-number'] = 'Enter all or part of the surrogate dam ear tag number and select from the list'
  } else if (!knownSurrogateTags.includes(surrogateDamNumber)) {
    errors['surrogate-dam-number'] = 'The surrogate dam ear tag number is not registered on your holding'
  } else if (recentlyCalvedTags.includes(surrogateDamNumber)) {
    errors['surrogate-dam-number'] = 'The surrogate dam appears to have given birth in the past 240 days'
  } else if (tooYoungTags.includes(surrogateDamNumber)) {
    errors['surrogate-dam-number'] = 'The surrogate dam appears to be under 15 months old'
  } else if (tooOldTags.includes(surrogateDamNumber)) {
    errors['surrogate-dam-number'] = 'The surrogate dam appears to be over 20 years old'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v4/register-animal/surrogate-dam', { errors })
  }

  returnToCheck(req, res, `${BASE}/sire-details`)
})

router.get(`${BASE}/genetic-dam`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/genetic-dam')
})

router.post(`${BASE}/genetic-dam`, (req, res) => {
  const data = req.session.data
  const geneticDamNumber = data['genetic-dam-number']

  const knownTags = [
    'UK123456501100', 'UK123456501101', 'UK123456501102', 'UK123456501103',
    'UK123456501104', 'UK123456501105', 'UK123456501106', 'UK123456501107',
    'UK123456501108', 'UK123456501109'
  ]
  const recentlyCalvedTags = ['UK123456501105']
  const tooYoungTags = ['UK123456501106']
  const tooOldTags = ['UK123456501107']

  let error

  if (!geneticDamNumber || !geneticDamNumber.trim()) {
    error = 'Enter all or part of the genetic dam ear tag number and select from the list'
  } else if (!knownTags.includes(geneticDamNumber)) {
    error = 'The genetic dam ear tag number is not registered on your holding'
  } else if (recentlyCalvedTags.includes(geneticDamNumber)) {
    error = 'The genetic dam appears to have given birth in the past 240 days'
  } else if (tooYoungTags.includes(geneticDamNumber)) {
    error = 'The genetic dam appears to be under 15 months old'
  } else if (tooOldTags.includes(geneticDamNumber)) {
    error = 'The genetic dam appears to be over 20 years old'
  }

  if (error) {
    return res.render('mvp-front-office/v4/register-animal/genetic-dam', {
      errors: { 'genetic-dam-number': error }
    })
  }

  returnToCheck(req, res, `${BASE}/sire-details`)
})

router.get(`${BASE}/sire-details`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/sire-details')
})

router.post(`${BASE}/sire-details`, (req, res) => {
  returnToCheck(req, res, `${BASE}/check-calf-details`)
})

router.get(`${BASE}/check-calf-details`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/check-calf-details')
})

router.post(`${BASE}/check-calf-details`, (req, res) => {
  const earTagNumber = req.session.data['ear-tag-number']
  if (earTagNumber) {
    const fullTag = 'UK 12 34 56 ' + earTagNumber
    let completed = req.session.data['completed-tags'] || []
    if (!Array.isArray(completed)) completed = [completed]
    if (!completed.includes(fullTag)) completed.push(fullTag)
    req.session.data['completed-tags'] = completed
  }
  res.redirect(`${BASE}/tag-list`)
})

router.get(`${BASE}/remove-calf`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/remove-calf')
})

router.post(`${BASE}/remove-calf`, (req, res) => {
  const fields = [
    'ear-tag-number', 'dob-day', 'dob-month', 'dob-year', 'sex',
    'breed', 'dam-type', 'dam-number', 'genetic-dam-number', 'surrogate-dam-number',
    'sire-number', 'sire-name', 'calf-details-radio', 'related-tag-numbers',
    'completed-tags', 'current-tag'
  ]
  fields.forEach(f => delete req.session.data[f])
  res.redirect(`${BASE}/tag-list`)
})

router.get(`${BASE}/tag-list`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/tag-list')
})

router.post(`${BASE}/tag-list`, (req, res) => {
  const data = req.session.data
  const addAnother = data['add-another']
  const errors = {}

  if (!addAnother) {
    errors['add-another'] = 'Select yes to add additional animals or no to continue'
  } else if (addAnother === 'no') {
    const damComplete = data['genetic-dam-number'] || data['surrogate-dam-number']
    const isComplete = data['ear-tag-number'] && data['dob-day'] && data['dob-month'] &&
                       data['dob-year'] && data['sex'] && data['breed'] && damComplete
    if (!isComplete) {
      errors['incomplete'] = 'Complete all required animal details before continuing'
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v4/register-animal/tag-list', { errors })
  }

  if (addAnother === 'yes') {
    return res.redirect(`${BASE}/calf-details`)
  }

  res.redirect(`${BASE}/submit`)
})

router.get(`${BASE}/submit`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/submit')
})

router.post(`${BASE}/submit`, (req, res) => {
  res.redirect(`${BASE}/confirmation`)
})

router.get(`${BASE}/confirmation`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/confirmation')
})

router.post(`${BASE}/confirmation`, (req, res) => {
  res.redirect('/mvp-front-office/v4/my-holdings/submissions')
})

router.get(`${BASE}/submission-detail`, (req, res) => {
  res.render('mvp-front-office/v4/register-animal/submission-detail')
})

router.post(`${BASE}/submission-detail`, (req, res) => {
  res.redirect(`${BASE}/submit`)
})

module.exports = router
