const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v6/register-animal'

// Details of the calf currently being entered or edited. Saved calves are
// copied into data['calves'] from these fields on the check page.
const CALF_FIELDS = [
  'ear-tag-number', 'dob', 'dob-day', 'dob-month', 'dob-year', 'sex',
  'breed', 'dam-type', 'genetic-dam-number', 'surrogate-dam-number',
  'sire-number', 'sire-name'
]

// The dummy draft on the register a cattle birth page. Continuing it loads
// these calves so they can be checked, changed and sent like any others.
const DRAFT_CALVES = [
  {
    'ear-tag-number': 'UK312545670001', dob: '12/4/2026', 'dob-day': '12', 'dob-month': '4', 'dob-year': '2026',
    sex: 'female', breed: 'Aberdeen Angus (AA)', 'dam-type': 'genetic', 'genetic-dam-number': 'UK123456501100'
  },
  {
    'ear-tag-number': 'UK312545670002', dob: '12/4/2026', 'dob-day': '12', 'dob-month': '4', 'dob-year': '2026',
    sex: 'male', breed: 'Aberdeen Angus (AA)'
  }
]

function getCalves(data) {
  return Array.isArray(data['calves']) ? data['calves'] : []
}

function clearCurrentCalf(data) {
  CALF_FIELDS.forEach(f => delete data[f])
  delete data['current-calf']
  delete data['change']
}

function isCalfComplete(calf) {
  const damComplete = calf['genetic-dam-number'] || calf['surrogate-dam-number']
  return Boolean(calf['ear-tag-number'] && calf['dob-day'] && calf['dob-month'] &&
                 calf['dob-year'] && calf['sex'] && calf['breed'] && damComplete)
}

// Today as d/m/yyyy, the format the date picker uses for data-max-date
function todayForDatePicker() {
  const today = new Date()
  return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
}

// Returns an error message for the date of birth, or nothing if it is valid
function dobError(day, month, year) {
  if (!day || !month || !year) {
    return 'Enter the date the animal was born'
  }
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return 'Date of birth must be a real date, for example 01/05/2026'
  }
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    return 'Date of birth must be a real date, for example 01/05/2026'
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date > today) {
    return 'Date of birth must be today or in the past'
  }
}

function returnToCheck(req, res, normalPath) {
  if (req.session.data['change'] === 'true') {
    delete req.session.data['change']
    return res.redirect(`${BASE}/check-calf-details`)
  }
  res.redirect(normalPath)
}

router.get(`${BASE}/start`, (req, res) => {
  clearCurrentCalf(req.session.data)
  delete req.session.data['calves']
  delete req.session.data['add-another']
  res.redirect(`${BASE}/calf-details`)
})

router.get(`${BASE}/animal-select`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/animal-select')
})

router.post(`${BASE}/animal-select`, (req, res) => {
  const animalType = req.session.data['animal-type']

  if (!animalType) {
    return res.render('mvp-front-office/v6/register-animal/animal-select', {
      errors: {
        'animal-type': { text: 'Select a species from the list' }
      }
    })
  }

  res.redirect('/mvp-front-office/v6/report-death/is-registered')
})

router.get(`${BASE}/submission-type`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/submission-type')
})

router.post(`${BASE}/submission-type`, (req, res) => {
  const submissionType = req.session.data['submission-type']

  if (!submissionType) {
    return res.render('mvp-front-office/v6/register-animal/submission-type', {
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
  res.render('mvp-front-office/v6/register-animal/calf-details', { maxDob: todayForDatePicker() })
})

router.post(`${BASE}/calf-details`, (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['ear-tag-number']) {
    errors['ear-tag-number'] = 'Enter all or part of the animal ear tag number you are registering'
  } else {
    const currentIndex = data['current-calf'] === undefined ? -1 : Number(data['current-calf'])
    const isDuplicate = getCalves(data).some((calf, i) =>
      i !== currentIndex && calf['ear-tag-number'] === data['ear-tag-number'])
    if (isDuplicate) {
      errors['ear-tag-number'] = 'This animal ear tag number has already been added to this registration'
    }
  }

  // Date picker gives a single d/m/yyyy value - split it into the
  // dob-day/month/year fields the rest of the journey reads
  const dobParts = (data['dob'] || '').trim().split('/')

  if (dobParts.length === 3 && dobParts.every(Boolean)) {
    [data['dob-day'], data['dob-month'], data['dob-year']] = dobParts
  } else {
    delete data['dob-day']
    delete data['dob-month']
    delete data['dob-year']
  }

  const dobMessage = dobError(data['dob-day'], data['dob-month'], data['dob-year'])
  if (dobMessage) {
    errors['dob'] = dobMessage
  }

  if (!data['sex']) {
    errors['sex'] = 'Select if the animal is male or female'
  }

  if (!data['breed']) {
    errors['breed'] = 'Enter the animal breed or breed code into the text box and select the correct one from the suggested options'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v6/register-animal/calf-details', { errors, maxDob: todayForDatePicker() })
  }

  returnToCheck(req, res, `${BASE}/dam-details`)
})

router.get(`${BASE}/dam-details`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/dam-details')
})

router.post(`${BASE}/dam-details`, (req, res) => {
  const data = req.session.data

  if (!data['dam-type']) {
    return res.render('mvp-front-office/v6/register-animal/dam-details', {
      errors: { 'dam-type': 'Select if the calf was born via a genetic or surrogate dam' }
    })
  }

  if (data['dam-type'] === 'surrogate') {
    return res.redirect(`${BASE}/surrogate-dam`)
  }

  res.redirect(`${BASE}/genetic-dam`)
})

router.get(`${BASE}/surrogate-dam`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/surrogate-dam')
})

router.post(`${BASE}/surrogate-dam`, (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['genetic-dam-number'] || !data['genetic-dam-number'].trim()) {
    errors['genetic-dam-number'] = 'Enter the full animal ear tag number of the genetic dam'
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
    return res.render('mvp-front-office/v6/register-animal/surrogate-dam', { errors })
  }

  returnToCheck(req, res, `${BASE}/sire-details`)
})

router.get(`${BASE}/genetic-dam`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/genetic-dam')
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
    return res.render('mvp-front-office/v6/register-animal/genetic-dam', {
      errors: { 'genetic-dam-number': error }
    })
  }

  returnToCheck(req, res, `${BASE}/sire-details`)
})

router.get(`${BASE}/sire-details`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/sire-details')
})

router.post(`${BASE}/sire-details`, (req, res) => {
  returnToCheck(req, res, `${BASE}/check-calf-details`)
})

router.get(`${BASE}/check-calf-details`, (req, res) => {
  // Nothing loaded, for example after pressing Back from the tag list
  if (!req.session.data['ear-tag-number']) {
    return res.redirect(`${BASE}/tag-list`)
  }
  res.render('mvp-front-office/v6/register-animal/check-calf-details')
})

router.post(`${BASE}/check-calf-details`, (req, res) => {
  const data = req.session.data
  if (data['ear-tag-number']) {
    const calf = {}
    CALF_FIELDS.forEach(f => {
      if (data[f] !== undefined) calf[f] = data[f]
    })
    const calves = getCalves(data)
    if (data['current-calf'] !== undefined && calves[data['current-calf']]) {
      calves[data['current-calf']] = calf
    } else {
      calves.push(calf)
    }
    data['calves'] = calves
  }
  clearCurrentCalf(data)
  res.redirect(`${BASE}/tag-list`)
})

// Load a saved calf into the current calf fields so it can be checked and changed
router.get(`${BASE}/calf/:index`, (req, res) => {
  const data = req.session.data
  const index = Number(req.params.index)
  const calf = getCalves(data)[index]
  if (!calf) {
    return res.redirect(`${BASE}/tag-list`)
  }
  clearCurrentCalf(data)
  Object.assign(data, calf)
  data['current-calf'] = index
  res.redirect(`${BASE}/check-calf-details`)
})

router.get(`${BASE}/remove-calf`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/remove-calf')
})

router.post(`${BASE}/remove-calf`, (req, res) => {
  const data = req.session.data
  if (data['current-calf'] !== undefined) {
    const calves = getCalves(data)
    calves.splice(Number(data['current-calf']), 1)
    data['calves'] = calves
  }
  clearCurrentCalf(data)
  res.redirect(`${BASE}/tag-list`)
})

router.get(`${BASE}/tag-list`, (req, res) => {
  res.render('mvp-front-office/v6/register-animal/tag-list')
})

router.post(`${BASE}/tag-list`, (req, res) => {
  const data = req.session.data
  const addAnother = data['add-another']
  const errors = {}
  let incompleteHref

  if (!addAnother) {
    errors['add-another'] = 'Select yes to add additional animals or no to continue'
  } else if (addAnother === 'no') {
    const calves = getCalves(data)
    if (calves.length === 0) {
      errors['incomplete'] = 'Add at least one animal before continuing'
    } else if (!calves.every(isCalfComplete)) {
      errors['incomplete'] = 'Complete all required animal details before continuing'
      incompleteHref = `${BASE}/calf/${calves.findIndex(calf => !isCalfComplete(calf))}`
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v6/register-animal/tag-list', { errors, incompleteHref })
  }

  delete data['add-another']

  if (addAnother === 'yes') {
    clearCurrentCalf(data)
    return res.redirect(`${BASE}/calf-details`)
  }

  res.redirect(`${BASE}/submit`)
})

router.get(`${BASE}/submit`, (req, res) => {
  if (getCalves(req.session.data).length === 0) {
    return res.redirect(`${BASE}/tag-list`)
  }
  res.render('mvp-front-office/v6/register-animal/submit')
})

router.post(`${BASE}/submit`, (req, res) => {
  const data = req.session.data
  // Already sent, for example after pressing Back from the confirmation page
  if (getCalves(data).length === 0) {
    return res.redirect(`${BASE}/tag-list`)
  }
  data['registered-count'] = getCalves(data).length
  delete data['calves']
  clearCurrentCalf(data)
  res.redirect(`${BASE}/confirmation`)
})

router.get(`${BASE}/submission-detail-draft`, (req, res) => {
  const data = req.session.data
  clearCurrentCalf(data)
  data['calves'] = DRAFT_CALVES.map(calf => ({ ...calf }))
  delete data['add-another']
  res.render('mvp-front-office/v6/register-animal/submission-detail-draft')
})

router.get(`${BASE}/confirmation`, (req, res) => {
  // Nothing has been sent, for example the page was opened directly
  if (req.session.data['registered-count'] === undefined) {
    return res.redirect('/mvp-front-office/v6/my-holdings/register-cattle-birth')
  }
  res.render('mvp-front-office/v6/register-animal/confirmation')
})

router.post(`${BASE}/confirmation`, (req, res) => {
  res.redirect('/mvp-front-office/v6/my-holdings/register-cattle-birth')
})

module.exports = router
