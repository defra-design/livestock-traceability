const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

function returnToCheck(req, res, normalPath) {
  if (req.session.data['change'] === 'true') {
    delete req.session.data['change']
    return res.redirect('/livestock-usability/v5/check-calf-details')
  }
  res.redirect(normalPath)
}

const registerAnimalPages = [
  'animal-select', 'breed', 'calf-details-radio', 'check-calf-details',
  'confirmation', 'dam-details', 'file-upload', 'genetic-dam', 'genetic-details',
  'multiple-birth', 'quantity', 'register-an-animal', 'registration-method',
  'sire-details', 'submission-detail', 'submit', 'surrogate-dam', 'tag-entry',
  'tag-list-complete', 'tag-list', 'upload'
]

registerAnimalPages.forEach(page => {
  router.get(`/livestock-usability/v5/${page}`, (req, res) => {
    res.render(`livestock-usability/v5/register-animal/${page}`)
  })
})

router.post('/livestock-usability/v5/registration-method', (req, res) => {
  const method = req.session.data['registration-method']
  if (method === 'file-upload') {
    res.redirect('/livestock-usability/v5/file-upload')
  } else {
    res.redirect('/livestock-usability/v5/animal-select')
  }
})

router.post('/livestock-usability/v5/animal-select', (req, res) => {
  const animalType = req.session.data['animal-type']

  if (!animalType) {
    return res.render('livestock-usability/v5/register-animal/animal-select', {
      errors: {
        'animal-type': { text: 'Select a species from the list' }
      }
    })
  }

  res.redirect('/livestock-usability/v5/calf-details')
})

router.post('/livestock-usability/v5/upload', (req, res) => {
  res.redirect('/livestock-usability/v5/tag-list')
})

router.post('/livestock-usability/v5/tag-entry', (req, res) => {
  res.redirect('/livestock-usability/v5/tag-list')
})

router.post('/livestock-usability/v5/tag-list', (req, res) => {
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
    return res.render('livestock-usability/v5/register-animal/tag-list', { errors })
  }

  if (addAnother === 'yes') {
    return res.redirect('/livestock-usability/v5/calf-details')
  }

  res.redirect('/livestock-usability/v5/submit')
})

router.get('/livestock-usability/v5/calf-details', (req, res) => {
  if (req.query.tag) {
    req.session.data['current-tag'] = req.query.tag
  }
  res.render('livestock-usability/v5/register-animal/calf-details')
})

router.post('/livestock-usability/v5/calf-details', (req, res) => {
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
    return res.render('livestock-usability/v5/register-animal/calf-details', { errors })
  }

  returnToCheck(req, res, '/livestock-usability/v5/dam-details')
})

router.post('/livestock-usability/v5/calf-details-radio', (req, res) => {
  const answer = req.session.data['calf-details-radio']
  if (answer === 'option-1') {
    res.redirect('/livestock-usability/v5/multiple-birth')
  } else {
    res.redirect('/livestock-usability/v5/breed')
  }
})

router.post('/livestock-usability/v5/multiple-birth', (req, res) => {
  res.redirect('/livestock-usability/v5/breed')
})

router.post('/livestock-usability/v5/dam-details', (req, res) => {
  const data = req.session.data

  if (!data['dam-type']) {
    return res.render('livestock-usability/v5/register-animal/dam-details', {
      errors: { 'dam-type': 'Select if the calf was born to a genetic or surrogate dam' }
    })
  }

  if (data['dam-type'] === 'surrogate') {
    return res.redirect('/livestock-usability/v5/surrogate-dam')
  }

  res.redirect('/livestock-usability/v5/genetic-dam')
})

router.post('/livestock-usability/v5/sire-details', (req, res) => {
  returnToCheck(req, res, '/livestock-usability/v5/check-calf-details')
})

router.get('/livestock-usability/v5/remove-calf', (req, res) => {
  res.render('livestock-usability/v5/register-animal/remove-calf')
})

router.post('/livestock-usability/v5/remove-calf', (req, res) => {
  const fields = [
    'ear-tag-number', 'dob-day', 'dob-month', 'dob-year', 'sex',
    'breed', 'dam-type', 'dam-number', 'genetic-dam-number', 'surrogate-dam-number',
    'sire-number', 'sire-name', 'calf-details-radio', 'related-tag-numbers',
    'completed-tags', 'current-tag'
  ]
  fields.forEach(f => delete req.session.data[f])
  res.redirect('/livestock-usability/v5/tag-list')
})

router.post('/livestock-usability/v5/check-calf-details', (req, res) => {
  const earTagNumber = req.session.data['ear-tag-number']
  if (earTagNumber) {
    const fullTag = 'UK 12 34 56 ' + earTagNumber
    let completed = req.session.data['completed-tags'] || []
    if (!Array.isArray(completed)) completed = [completed]
    if (!completed.includes(fullTag)) completed.push(fullTag)
    req.session.data['completed-tags'] = completed
  }
  res.redirect('/livestock-usability/v5/tag-list')
})

router.post('/livestock-usability/v5/tag-list-complete', (req, res) => {
  const addAnother = req.session.data['add-another']
  if (addAnother === 'yes') {
    delete req.session.data['tag-numbers']
    res.redirect('/livestock-usability/v5/tag-entry')
  } else {
    res.redirect('/livestock-usability/v5/submit')
  }
})

router.post('/livestock-usability/v5/submit', (req, res) => {
  res.redirect('/livestock-usability/v5/confirmation')
})

router.post('/livestock-usability/v5/embryo-transfer', (req, res) => {
  const embryoTransfer = req.session.data['embryo-transfer']
  if (embryoTransfer === 'yes') {
    res.redirect('/livestock-usability/v5/surrogate-dam')
  } else {
    res.redirect('/livestock-usability/v5/genetic-dam')
  }
})

router.post('/livestock-usability/v5/surrogate-dam', (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['genetic-dam-number'] || !data['genetic-dam-number'].trim()) {
    errors['genetic-dam-number'] = 'Enter the ear tag number of the genetic dam'
  }

  if (!data['surrogate-dam-number']) {
    errors['surrogate-dam-number'] = 'Enter the ear tag number of the surrogate dam'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('livestock-usability/v5/register-animal/surrogate-dam', { errors })
  }

  returnToCheck(req, res, '/livestock-usability/v5/sire-details')
})

router.post('/livestock-usability/v5/genetic-dam', (req, res) => {
  const data = req.session.data
  if (!data['genetic-dam-number']) {
    return res.render('livestock-usability/v5/register-animal/genetic-dam', {
      errors: { 'genetic-dam-number': 'Enter the ear tag number of the genetic dam' }
    })
  }
  returnToCheck(req, res, '/livestock-usability/v5/sire-details')
})

router.post('/livestock-usability/v5/sire-number', (req, res) => {
  res.redirect('/livestock-usability/v5/breed')
})

router.post('/livestock-usability/v5/breed', (req, res) => {
  if (!req.session.data['breed']) {
    return res.render('livestock-usability/v5/register-animal/breed', {
      errors: { breed: 'Select a breed' }
    })
  }
  res.redirect('/livestock-usability/v5/dam-details')
})

router.post('/livestock-usability/v5/animal-number', (req, res) => {
  res.redirect('/livestock-usability/v5/sex')
})

router.post('/livestock-usability/v5/sex', (req, res) => {
  res.redirect('/livestock-usability/v5/check-your-answers')
})

router.post('/livestock-usability/v5/check-your-answers', (req, res) => {
  res.redirect('/livestock-usability/v5/confirmation')
})

router.post('/livestock-usability/v5/confirmation', (req, res) => {
  res.redirect('/livestock-usability/v5/register-an-animal')
})

router.post('/livestock-usability/v5/register-an-animal-birth', (req, res) => {
  res.redirect('/livestock-usability/v5/animal-select')
})

router.post('/livestock-usability/v5/submission-detail', (req, res) => {
  res.redirect('/livestock-usability/v5/submit')
})

// ---- report-death flow ----

router.post('/livestock-usability/v5/report-death/animal-select', (req, res) => {
  const species = req.session.data['death-animal-type']
  if (!species) {
    return res.render('livestock-usability/v5/report-death/animal-select', {
      errors: { 'death-animal-type': 'Select a species' }
    })
  }
  res.redirect('/livestock-usability/v5/report-death/is-registered')
})

router.post('/livestock-usability/v5/report-death/is-registered', (req, res) => {
  const answer = req.session.data['death-is-registered']
  if (!answer) {
    return res.render('livestock-usability/v5/report-death/is-registered', {
      errors: { 'death-is-registered': 'Select if the animal is already registered to your holding' }
    })
  }
  res.redirect('/livestock-usability/v5/report-death/ear-tag-number')
})

router.post('/livestock-usability/v5/report-death/ear-tag-number', (req, res) => {
  const data = req.session.data
  if (!data['death-ear-tag-number']) {
    return res.render('livestock-usability/v5/report-death/ear-tag-number', {
      errors: { 'death-ear-tag-number': 'Enter the ear tag number of the animal' }
    })
  }
  if (data['death-is-registered'] === 'yes') {
    return res.redirect('/livestock-usability/v5/report-death/date-of-death')
  }
  res.redirect('/livestock-usability/v5/report-death/date-of-birth')
})

router.post('/livestock-usability/v5/report-death/date-of-birth', (req, res) => {
  const data = req.session.data
  if (!data['death-dob-day'] || !data['death-dob-month'] || !data['death-dob-year']) {
    return res.render('livestock-usability/v5/report-death/date-of-birth', {
      errors: { 'death-dob': 'Enter the date the animal was born' }
    })
  }
  const entered = new Date(
    parseInt(data['death-dob-year']),
    parseInt(data['death-dob-month']) - 1,
    parseInt(data['death-dob-day'])
  )
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (entered > today) {
    return res.render('livestock-usability/v5/report-death/date-of-birth', {
      errors: { 'death-dob': 'Date of birth must be in the past.' }
    })
  }
  res.redirect('/livestock-usability/v5/report-death/date-of-death')
})

router.post('/livestock-usability/v5/report-death/date-of-death', (req, res) => {
  const data = req.session.data
  if (!data['death-date-day'] || !data['death-date-month'] || !data['death-date-year']) {
    return res.render('livestock-usability/v5/report-death/date-of-death', {
      errors: { 'death-date': 'Enter the date the animal died' }
    })
  }
  const entered = new Date(
    parseInt(data['death-date-year']),
    parseInt(data['death-date-month']) - 1,
    parseInt(data['death-date-day'])
  )
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (entered > today) {
    return res.render('livestock-usability/v5/report-death/date-of-death', {
      errors: { 'death-date': 'Date of death needs to be in the past' }
    })
  }
  if (data['death-is-registered'] === 'yes') {
    return res.redirect('/livestock-usability/v5/report-death/check-death-details')
  }
  res.redirect('/livestock-usability/v5/report-death/breed')
})

router.post('/livestock-usability/v5/report-death/breed', (req, res) => {
  const data = req.session.data
  if (!data['death-breed']) {
    return res.render('livestock-usability/v5/report-death/breed', {
      errors: { 'death-breed': 'Select a breed' }
    })
  }
  res.redirect('/livestock-usability/v5/report-death/sex')
})

router.post('/livestock-usability/v5/report-death/sex', (req, res) => {
  const data = req.session.data
  if (!data['death-sex']) {
    return res.render('livestock-usability/v5/report-death/sex', {
      errors: { 'death-sex': 'Select if the animal is male or female' }
    })
  }
  res.redirect('/livestock-usability/v5/report-death/dam-details')
})

router.post('/livestock-usability/v5/report-death/dam-details', (req, res) => {
  const data = req.session.data
  const errors = {}
  if (!data['death-dam-type']) {
    errors['death-dam-type'] = 'Select if the animal was born to a genetic or surrogate dam'
  } else if (data['death-dam-type'] === 'genetic' && !data['death-dam-number']) {
    errors['death-dam-number'] = 'Enter the last 6 digits of the animal ear tag number'
  } else if (data['death-dam-type'] === 'surrogate' && !data['death-surrogate-dam-number']) {
    errors['death-surrogate-dam-number'] = 'Enter the last 6 digits of the animal ear tag number'
  }
  if (Object.keys(errors).length > 0) {
    return res.render('livestock-usability/v5/report-death/dam-details', { errors })
  }
  res.redirect('/livestock-usability/v5/report-death/sire-details')
})

router.post('/livestock-usability/v5/report-death/sire-details', (req, res) => {
  res.redirect('/livestock-usability/v5/report-death/check-death-details')
})

router.post('/livestock-usability/v5/report-death/add-more-deaths', (req, res) => {
  const answer = req.session.data['add-more-deaths']
  if (!answer) {
    return res.render('livestock-usability/v5/report-death/add-more-deaths', {
      errors: { 'add-more-deaths': 'Select yes to report more deaths, or no to continue' }
    })
  }
  if (answer === 'yes') {
    const deathFields = [
      'death-is-registered', 'death-ear-tag-number',
      'death-date-day', 'death-date-month', 'death-date-year',
      'death-dob-day', 'death-dob-month', 'death-dob-year',
      'death-sex', 'death-breed', 'death-dam-type', 'death-dam-number',
      'death-surrogate-dam-number', 'death-sire-number', 'death-sire-name',
      'add-more-deaths'
    ]
    deathFields.forEach(f => delete req.session.data[f])
    return res.redirect('/livestock-usability/v5/report-death/is-registered')
  }
  res.redirect('/livestock-usability/v5/report-death/submit')
})

router.post('/livestock-usability/v5/report-death/submit', (req, res) => {
  res.redirect('/livestock-usability/v5/report-death/confirmation')
})

router.post('/livestock-usability/v5/report-death/check-death-details', (req, res) => {
  const data = req.session.data
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthIndex = parseInt(data['death-date-month']) - 1
  const entry = {
    tag: data['death-ear-tag-number'],
    date: `${data['death-date-day']} ${months[monthIndex]} ${data['death-date-year']}`,
    registered: data['death-is-registered']
  }
  let completed = data['completed-deaths'] || []
  if (!Array.isArray(completed)) completed = [completed]
  completed.push(entry)
  req.session.data['completed-deaths'] = completed
  res.redirect('/livestock-usability/v5/report-death/add-more-deaths')
})

// ---- report-movement flow ----

router.post('/livestock-usability/v5/report-movement/animal-select', (req, res) => {
  const species = req.session.data['movement-animal-type']
  if (!species) {
    return res.render('livestock-usability/v5/report-movement/animal-select', {
      errors: { 'movement-animal-type': 'Select a species' }
    })
  }
  res.redirect('/livestock-usability/v5/report-movement/movement-type')
})

router.post('/livestock-usability/v5/report-movement/movement-type', (req, res) => {
  const type = req.session.data['movement-type']
  if (!type) {
    return res.render('livestock-usability/v5/report-movement/movement-type', {
      errors: { 'movement-type': 'Select if this is an on or off movement' }
    })
  }
  res.redirect('/livestock-usability/v5/report-movement/movement-date')
})

router.post('/livestock-usability/v5/report-movement/movement-date', (req, res) => {
  const data = req.session.data
  if (!data['movement-date-day'] || !data['movement-date-month'] || !data['movement-date-year']) {
    return res.render('livestock-usability/v5/report-movement/movement-date', {
      errors: { 'movement-date': 'Enter the date of the movement' }
    })
  }
  res.redirect('/livestock-usability/v5/report-movement/ear-tag-numbers')
})

router.post('/livestock-usability/v5/report-movement/ear-tag-numbers', (req, res) => {
  const data = req.session.data
  if (!data['movement-ear-tags'] || !data['movement-ear-tags'].trim()) {
    return res.render('livestock-usability/v5/report-movement/ear-tag-numbers', {
      errors: { 'movement-ear-tags': 'Enter at least one ear tag number' }
    })
  }
  res.redirect('/livestock-usability/v5/report-movement/check-movement-details')
})

router.post('/livestock-usability/v5/report-movement/check-movement-details', (req, res) => {
  res.redirect('/livestock-usability/v5/report-movement/submit')
})

router.post('/livestock-usability/v5/report-movement/submit', (req, res) => {
  res.redirect('/livestock-usability/v5/report-movement/confirmation')
})

module.exports = router
