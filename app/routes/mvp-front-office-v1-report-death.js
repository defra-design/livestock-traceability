const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v1/report-death'

router.post(`${BASE}/is-registered`, (req, res) => {
  const data = req.session.data
  const answer = data['death-is-registered']

  if (!answer) {
    return res.render('mvp-front-office/v1/report-death/is-registered', {
      errors: { 'death-is-registered': 'Select if the animal is already registered to your holding' }
    })
  }

  if (data['change'] === 'true') {
    delete data['change']
    return res.redirect(`${BASE}/check-animal-details`)
  }

  if (answer === 'yes') {
    return res.redirect(`${BASE}/yes/animal-details`)
  }

  res.redirect(`${BASE}/no/animal-details`)
})

router.post(`${BASE}/yes/animal-details`, (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['death-ear-tag-number']) {
    errors['death-ear-tag-number'] = 'Enter the last 6 digits of the animal ear tag number you are registering'
  }

  const dateComplete = data['death-date-day'] && data['death-date-month'] && data['death-date-year']
  if (!dateComplete) {
    errors['death-date'] = 'Enter the date the animal died'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deathDate = new Date(parseInt(data['death-date-year']), parseInt(data['death-date-month']) - 1, parseInt(data['death-date-day']))
    if (deathDate > today) {
      errors['death-date'] = 'Date of death needs to be in the past'
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v1/report-death/yes/animal-details', { errors })
  }

  res.redirect(`${BASE}/check-animal-details`)
})

router.post(`${BASE}/no/animal-details`, (req, res) => {
  const data = req.session.data
  const errors = {}

  if (!data['death-ear-tag-number']) {
    errors['death-ear-tag-number'] = 'Enter the last 6 digits of the animal ear tag number you are registering'
  }

  const dobComplete = data['death-dob-day'] && data['death-dob-month'] && data['death-dob-year']
  if (!dobComplete) {
    errors['death-dob'] = 'Enter the date the animal was born'
  }

  const dateComplete = data['death-date-day'] && data['death-date-month'] && data['death-date-year']
  if (!dateComplete) {
    errors['death-date'] = 'Enter the date the animal died'
  }

  if (!data['death-sex']) {
    errors['death-sex'] = 'Select if the animal is male or female'
  }

  if (!data['death-breed']) {
    errors['death-breed'] = 'Enter the animal breed or breed code into the text box and select the correct one from the suggested options'
  }

  if (dobComplete && !errors['death-dob']) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dob = new Date(parseInt(data['death-dob-year']), parseInt(data['death-dob-month']) - 1, parseInt(data['death-dob-day']))
    if (dob > today) {
      errors['death-dob'] = 'Date of birth must be in the past'
    }
  }

  if (dateComplete && !errors['death-date']) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deathDate = new Date(parseInt(data['death-date-year']), parseInt(data['death-date-month']) - 1, parseInt(data['death-date-day']))
    if (deathDate > today) {
      errors['death-date'] = 'Date of death needs to be in the past'
    } else if (dobComplete && !errors['death-dob']) {
      const dob = new Date(parseInt(data['death-dob-year']), parseInt(data['death-dob-month']) - 1, parseInt(data['death-dob-day']))
      if (deathDate < dob) {
        errors['death-date'] = 'Date of death cannot be before the date of birth'
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render('mvp-front-office/v1/report-death/no/animal-details', { errors })
  }

  res.redirect(`${BASE}/check-animal-details`)
})

router.post(`${BASE}/check-animal-details`, (req, res) => {
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
  res.redirect(`${BASE}/add-more-deaths`)
})

router.post(`${BASE}/add-more-deaths`, (req, res) => {
  const answer = req.session.data['add-more-deaths']

  if (!answer) {
    return res.render('mvp-front-office/v1/report-death/add-more-deaths', {
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
    return res.redirect(`${BASE}/is-registered`)
  }

  res.redirect(`${BASE}/submit`)
})

router.post(`${BASE}/submit`, (req, res) => {
  res.redirect(`${BASE}/confirmation`)
})

router.post(`${BASE}/confirmation`, (req, res) => {
  res.redirect('/mvp-front-office/v1/submissions')
})

module.exports = router
