const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/mvp-front-office/v6/report-movement'

const MOVEMENT_FIELDS = ['movement-type', 'movement-ear-tags', 'movement-dates', 'movement-animals']

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
    return res.render('mvp-front-office/v6/report-movement/movement-type', {
      errors: { 'movement-type': 'Select if this is an on or off movement' }
    })
  }

  // The movement date is now asked per animal on the ear tag numbers page
  returnToCheck(req, res, `${BASE}/ear-tag-numbers`)
})

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Date pickers give a d/m/yyyy value - returns a Date, or null if it isn't one
function parseDatePickerValue(value) {
  const parts = String(value || '').trim().split('/')
  if (parts.length !== 3) return null

  const [day, month, year] = parts.map(Number)
  const date = new Date(year, month - 1, day)

  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isRealDate ? date : null
}

router.post(`${BASE}/ear-tag-numbers`, (req, res) => {
  const data = req.session.data

  // Each animal row has an ear tag and a movement date, added one row at a
  // time by the add another component. Drop rows where both are blank.
  const earTags = [].concat(data['movement-ear-tags'] || [])
  const dates = [].concat(data['movement-dates'] || [])
  const rowCount = Math.max(earTags.length, dates.length)

  const rows = Array.from({ length: rowCount }, (_, i) => ({
    earTag: String(earTags[i] || '').trim(),
    date: String(dates[i] || '').trim()
  })).filter((row) => row.earTag || row.date)

  data['movement-ear-tags'] = rows.map((row) => row.earTag)
  data['movement-dates'] = rows.map((row) => row.date)

  // Errors are keyed by field and row, for example movement-dates-1
  const errors = {}
  const errorList = []
  const addError = (field, index, text) => {
    errors[`${field}-${index}`] = text
    errorList.push({ text, href: `#${field}-${index}` })
  }

  if (rows.length === 0) {
    addError('movement-ear-tags', 0, 'Enter at least one ear tag number')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  rows.forEach((row, index) => {
    const animal = `animal ${index + 1}`

    if (!row.earTag) {
      addError('movement-ear-tags', index, `Enter the ear tag number for ${animal}`)
    } else if (rows.slice(0, index).some((earlier) => earlier.earTag === row.earTag)) {
      addError('movement-ear-tags', index, `The ear tag number for ${animal} has already been added to this movement`)
    }

    if (!row.date) {
      addError('movement-dates', index, `Enter the movement date for ${animal}`)
    } else {
      const date = parseDatePickerValue(row.date)

      if (!date) {
        addError('movement-dates', index, `Movement date for ${animal} must be a real date, for example 27/3/2026`)
      } else if (date > today) {
        addError('movement-dates', index, `Movement date for ${animal} must be today or in the past`)
      }
    }
  })

  if (errorList.length > 0) {
    return res.render('mvp-front-office/v6/report-movement/ear-tag-numbers', { errors, errorList })
  }

  // For the check page, for example "UK123456301550 – 27 March 2026"
  data['movement-animals'] = rows.map((row) => {
    const date = parseDatePickerValue(row.date)
    return {
      earTag: row.earTag,
      date: `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
    }
  })

  returnToCheck(req, res, `${BASE}/check-movement-details`)
})

// Nothing to check or send, for example after a movement has already been sent
function hasMovement(data) {
  return Array.isArray(data['movement-animals']) && data['movement-animals'].length > 0
}

router.get(`${BASE}/check-movement-details`, (req, res) => {
  if (!hasMovement(req.session.data)) {
    return res.redirect(`${BASE}/movement-type`)
  }
  res.render('mvp-front-office/v6/report-movement/check-movement-details')
})

// Removes one animal from the movement and returns to the check page
router.get(`${BASE}/remove-animal/:index`, (req, res) => {
  const data = req.session.data
  const index = Number(req.params.index)

  if (hasMovement(data) && data['movement-animals'][index]) {
    ;['movement-animals', 'movement-ear-tags', 'movement-dates'].forEach((field) => {
      data[field] = [].concat(data[field] || []).filter((_, i) => i !== index)
    })
  }

  res.redirect(`${BASE}/check-movement-details`)
})

router.post(`${BASE}/check-movement-details`, (req, res) => {
  res.redirect(`${BASE}/submit`)
})

router.get(`${BASE}/submit`, (req, res) => {
  if (!hasMovement(req.session.data)) {
    return res.redirect(`${BASE}/movement-type`)
  }
  res.render('mvp-front-office/v6/report-movement/submit')
})

router.post(`${BASE}/submit`, (req, res) => {
  const data = req.session.data
  if (!hasMovement(data)) {
    return res.redirect(`${BASE}/movement-type`)
  }
  MOVEMENT_FIELDS.forEach(f => delete data[f])
  delete data['change']
  res.redirect(`${BASE}/confirmation`)
})

router.post(`${BASE}/confirmation`, (req, res) => {
  res.redirect('/mvp-front-office/v6/my-holdings/report-cattle-movement')
})

module.exports = router
