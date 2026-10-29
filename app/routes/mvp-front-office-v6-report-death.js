const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v6/report-death'

// Details of the death currently being entered or edited. Saved deaths are
// copied into data['deaths'] from these fields on the check page.
const DEATH_FIELDS = [
  'death-is-registered', 'death-ear-tag-number',
  'death-date', 'death-date-day', 'death-date-month', 'death-date-year',
  'death-dob', 'death-dob-day', 'death-dob-month', 'death-dob-year',
  'death-sex', 'death-breed'
]

// Only asked for animals that are not registered to the holding
const UNREGISTERED_FIELDS = [
  'death-dob', 'death-dob-day', 'death-dob-month', 'death-dob-year',
  'death-sex', 'death-breed'
]

function getDeaths(data) {
  return Array.isArray(data['deaths']) ? data['deaths'] : []
}

function clearCurrentDeath(data) {
  DEATH_FIELDS.forEach(f => delete data[f])
  delete data['current-death']
  delete data['change']
}

function isDeathComplete(death) {
  const hasDeathDate = death['death-date-day'] && death['death-date-month'] && death['death-date-year']
  if (!death['death-is-registered'] || !death['death-ear-tag-number'] || !hasDeathDate) {
    return false
  }
  if (death['death-is-registered'] === 'no') {
    const hasDob = death['death-dob-day'] && death['death-dob-month'] && death['death-dob-year']
    return Boolean(hasDob && death['death-sex'] && death['death-breed'])
  }
  return true
}

// Returns an error message if the tag is already used by another death in this report
function duplicateTagError(data) {
  const currentIndex = data['current-death'] === undefined ? -1 : Number(data['current-death'])
  const isDuplicate = getDeaths(data).some((death, i) =>
    i !== currentIndex && death['death-ear-tag-number'] === data['death-ear-tag-number'])
  if (isDuplicate) {
    return 'This animal ear tag number has already been added to this report'
  }
}

// Today as d/m/yyyy, the format the date picker uses for data-max-date
function todayForDatePicker() {
  const today = new Date()
  return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
}

// Date pickers give a single d/m/yyyy value - split it into the
// -day/-month/-year fields the rest of the journey reads
function splitDatePickerValue(data, name) {
  const parts = (data[name] || '').trim().split('/')

  if (parts.length === 3 && parts.every(Boolean)) {
    [data[`${name}-day`], data[`${name}-month`], data[`${name}-year`]] = parts
  } else {
    delete data[`${name}-day`]
    delete data[`${name}-month`]
    delete data[`${name}-year`]
  }
}

// Returns the date, or nothing if the day, month and year are not a real date
function realDate(day, month, year) {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
    return
  }
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)) {
    return date
  }
}

function isInFuture(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date > today
}

function renderDetails(res, page, errors) {
  res.render(`mvp-front-office/v6/report-death/${page}/animal-details`, { errors, maxDate: todayForDatePicker() })
}

router.get(`${BASE}/start`, (req, res) => {
  clearCurrentDeath(req.session.data)
  delete req.session.data['deaths']
  delete req.session.data['add-more-deaths']
  res.redirect(`${BASE}/is-registered`)
})

router.post(`${BASE}/is-registered`, (req, res) => {
  const data = req.session.data
  const answer = data['death-is-registered']

  if (!answer) {
    return res.render('mvp-front-office/v6/report-death/is-registered', {
      errors: { 'death-is-registered': 'Select if the animal is already registered to your holding' }
    })
  }

  if (answer === 'yes') {
    UNREGISTERED_FIELDS.forEach(f => delete data[f])
  }

  if (data['change'] === 'true') {
    delete data['change']
    // Switching to not registered needs the extra details before checking
    if (answer === 'yes' || isDeathComplete(data)) {
      return res.redirect(`${BASE}/check-animal-details`)
    }
  }

  if (answer === 'yes') {
    return res.redirect(`${BASE}/yes/animal-details`)
  }

  res.redirect(`${BASE}/no/animal-details`)
})

router.get(`${BASE}/yes/animal-details`, (req, res) => {
  renderDetails(res, 'yes')
})

router.post(`${BASE}/yes/animal-details`, (req, res) => {
  const data = req.session.data
  const errors = {}

  splitDatePickerValue(data, 'death-date')

  if (!data['death-ear-tag-number']) {
    errors['death-ear-tag-number'] = 'Enter all or part of the animal ear tag number you are reporting'
  } else if (duplicateTagError(data)) {
    errors['death-ear-tag-number'] = duplicateTagError(data)
  }

  const dateComplete = data['death-date-day'] && data['death-date-month'] && data['death-date-year']
  if (!dateComplete) {
    errors['death-date'] = 'Enter the date the animal died'
  } else {
    const deathDate = realDate(data['death-date-day'], data['death-date-month'], data['death-date-year'])
    if (!deathDate) {
      errors['death-date'] = 'Date of death must be a real date, for example 01/05/2026'
    } else if (isInFuture(deathDate)) {
      errors['death-date'] = 'Date of death needs to be in the past'
    }
  }

  if (Object.keys(errors).length > 0) {
    return renderDetails(res, 'yes', errors)
  }

  res.redirect(`${BASE}/check-animal-details`)
})

router.get(`${BASE}/no/animal-details`, (req, res) => {
  renderDetails(res, 'no')
})

router.post(`${BASE}/no/animal-details`, (req, res) => {
  const data = req.session.data
  const errors = {}

  splitDatePickerValue(data, 'death-dob')
  splitDatePickerValue(data, 'death-date')

  if (!data['death-ear-tag-number']) {
    errors['death-ear-tag-number'] = 'Enter the animal ear tag number you are reporting'
  } else if (duplicateTagError(data)) {
    errors['death-ear-tag-number'] = duplicateTagError(data)
  }

  const dobComplete = data['death-dob-day'] && data['death-dob-month'] && data['death-dob-year']
  let dob
  if (!dobComplete) {
    errors['death-dob'] = 'Enter the date the animal was born'
  } else {
    dob = realDate(data['death-dob-day'], data['death-dob-month'], data['death-dob-year'])
    if (!dob) {
      errors['death-dob'] = 'Date of birth must be a real date, for example 01/05/2026'
    } else if (isInFuture(dob)) {
      errors['death-dob'] = 'Date of birth must be in the past'
    }
  }

  const dateComplete = data['death-date-day'] && data['death-date-month'] && data['death-date-year']
  if (!dateComplete) {
    errors['death-date'] = 'Enter the date the animal died'
  } else {
    const deathDate = realDate(data['death-date-day'], data['death-date-month'], data['death-date-year'])
    if (!deathDate) {
      errors['death-date'] = 'Date of death must be a real date, for example 01/05/2026'
    } else if (isInFuture(deathDate)) {
      errors['death-date'] = 'Date of death needs to be in the past'
    } else if (dob && !errors['death-dob'] && deathDate < dob) {
      errors['death-date'] = 'Date of death cannot be before the date of birth'
    }
  }

  if (!data['death-sex']) {
    errors['death-sex'] = 'Select if the animal is male or female'
  }

  if (!data['death-breed']) {
    errors['death-breed'] = 'Enter the animal breed or breed code into the text box and select the correct one from the suggested options'
  }

  if (Object.keys(errors).length > 0) {
    return renderDetails(res, 'no', errors)
  }

  res.redirect(`${BASE}/check-animal-details`)
})

router.get(`${BASE}/check-animal-details`, (req, res) => {
  // Nothing loaded, for example after pressing Back from the list of deaths
  if (!req.session.data['death-ear-tag-number']) {
    return res.redirect(`${BASE}/add-more-deaths`)
  }
  res.render('mvp-front-office/v6/report-death/check-animal-details')
})

router.post(`${BASE}/check-animal-details`, (req, res) => {
  const data = req.session.data
  if (data['death-ear-tag-number']) {
    const death = {}
    DEATH_FIELDS.forEach(f => {
      if (data[f] !== undefined) death[f] = data[f]
    })
    const deaths = getDeaths(data)
    if (data['current-death'] !== undefined && deaths[data['current-death']]) {
      deaths[data['current-death']] = death
    } else {
      deaths.push(death)
    }
    data['deaths'] = deaths
  }
  clearCurrentDeath(data)
  res.redirect(`${BASE}/add-more-deaths`)
})

// Load a saved death into the current death fields so it can be checked and changed
router.get(`${BASE}/death/:index`, (req, res) => {
  const data = req.session.data
  const index = Number(req.params.index)
  const death = getDeaths(data)[index]
  if (!death) {
    return res.redirect(`${BASE}/add-more-deaths`)
  }
  clearCurrentDeath(data)
  Object.assign(data, death)
  data['current-death'] = index
  res.redirect(`${BASE}/check-animal-details`)
})

router.post(`${BASE}/add-more-deaths`, (req, res) => {
  const data = req.session.data
  const answer = data['add-more-deaths']
  const errors = {}
  let incompleteHref

  if (!answer) {
    errors['add-more-deaths'] = 'Select yes to report more deaths, or no to continue'
  } else if (answer === 'no') {
    const deaths = getDeaths(data)
    if (deaths.length === 0) {
      errors['incomplete'] = 'Add at least one animal before continuing'
    } else if (!deaths.every(isDeathComplete)) {
      errors['incomplete'] = 'Complete all required animal details before continuing'
      incompleteHref = `${BASE}/death/${deaths.findIndex(death => !isDeathComplete(death))}`
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v6/report-death/add-more-deaths', { errors, incompleteHref })
  }

  delete data['add-more-deaths']

  if (answer === 'yes') {
    clearCurrentDeath(data)
    return res.redirect(`${BASE}/is-registered`)
  }

  res.redirect(`${BASE}/submit`)
})

router.get(`${BASE}/submit`, (req, res) => {
  if (getDeaths(req.session.data).length === 0) {
    return res.redirect(`${BASE}/add-more-deaths`)
  }
  res.render('mvp-front-office/v6/report-death/submit')
})

router.post(`${BASE}/submit`, (req, res) => {
  const data = req.session.data
  // Already sent, for example after pressing Back from the confirmation page
  if (getDeaths(data).length === 0) {
    return res.redirect(`${BASE}/add-more-deaths`)
  }
  data['reported-count'] = getDeaths(data).length
  delete data['deaths']
  clearCurrentDeath(data)
  res.redirect(`${BASE}/confirmation`)
})

router.get(`${BASE}/confirmation`, (req, res) => {
  // Nothing has been sent, for example the page was opened directly
  if (req.session.data['reported-count'] === undefined) {
    return res.redirect('/mvp-front-office/v6/my-holdings/report-cattle-death')
  }
  res.render('mvp-front-office/v6/report-death/confirmation')
})

router.post(`${BASE}/confirmation`, (req, res) => {
  res.redirect('/mvp-front-office/v6/my-holdings/report-cattle-death')
})

module.exports = router
