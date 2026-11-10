'use strict'

// Version 2: simple routes and automatic Prototype Kit page rendering.
// Ordinary GET pages are served directly from app/views/evolution/record-full-movement-v2/.
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const BASE = '/evolution/record-full-movement-v3'
const VIEW = 'evolution/record-full-movement-v3/'
const SESSION = 'recordFullMovementSimpleV3'

const SENDER = {
  name: 'Oakfield Farm',
  cph: '37/123/4567',
  address: 'Oakfield Lane, Exampleton, EX1 2AB'
}

const LOCATIONS = [
  { id: 'hilltop', name: 'Hilltop Farm', identifier: '56/312/0056', address: 'Mill Lane, Exampleton, EX2 3CD', type: 'holding', idLabel: 'CPH number' },
  { id: 'brook', name: 'Brook Farm', identifier: '15/628/0067', address: 'High Road, Exampleton, EX2 4DE', type: 'holding', idLabel: 'CPH number' },
  { id: 'market', name: 'Example Livestock Market', identifier: '31/672/0158', address: 'Market Road, Exampleton, EX3 5EF', type: 'market', idLabel: 'CPH number' },
  { id: 'show', name: 'County Showground', identifier: '66/204/0141', address: 'Showground Road, Exampleton, EX5 9JK', type: 'showground', idLabel: 'CPH number' },
  { id: 'abattoir', name: 'Example Abattoir', identifier: 'UK 1234', address: 'Industrial Estate, Exampleton, EX4 7GH', type: 'slaughterhouse', idLabel: 'Approval number' }
]

// Ten fictional animals to support the interactive Add to list journey.
const BREEDS = [
  { code: 'HF', name: 'Holstein Friesian' },
  { code: 'BRB', name: 'British Blue' },
  { code: 'AA', name: 'Aberdeen Angus' },
  { code: 'HE', name: 'Hereford' }
]
const CATTLE = Array.from({ length: 10 }, (_, i) => {
  const tag = 'UK 371234 ' + String(i + 1).padStart(6, '0')
  return {
    tag,
    breed: BREEDS[i % 4],
    sex: i % 2 ? 'Male' : 'Female',
    dateOfBirth: String(i + 1).padStart(2, '0') + '-' + String(i % 12 + 1).padStart(2, '0') + '-2022',
    encodedTag: encodeURIComponent(tag)
  }
})

// Five static completed movements. The completed detail and activity are static examples.
const EXAMPLES = [
  { id: 'MOV-2001', holdingDirection: 'off', otherHolding: '56/312/0056', date: '21 October 2026' },
  { id: 'MOV-2002', holdingDirection: 'on', otherHolding: '15/628/0067', date: '20 October 2026' },
  { id: 'MOV-2003', holdingDirection: 'off', otherHolding: '31/672/0158', date: '19 October 2026' },
  { id: 'MOV-2004', holdingDirection: 'on', otherHolding: '44/209/0317', date: '18 October 2026' },
  { id: 'MOV-2005', holdingDirection: 'off', otherHolding: '66/204/0141', date: '17 October 2026' }
].map(item => ({ ...item, count: 3, status: 'confirmed', label: 'Confirmed', colour: 'govuk-tag--green', actionWith: 'none' }))

// Shared data for automatically rendered pages. No individual GET route is needed
// just to supply `base`, the current draft or a list of animals.
router.use(BASE, (req, res, next) => {
  const data = req.session.data
  data[SESSION] = data[SESSION] || { direction: 'off', tags: [] }
  data.simpleV2Reports = data.simpleV2Reports || []
  const draft = data[SESSION]
  const animals = CATTLE.filter(animal => draft.tags.includes(animal.tag))
  const destination = draft.location || LOCATIONS.find(location => location.id === draft.locationId) || LOCATIONS[0]

  res.locals.base = BASE
  res.locals.root = BASE + '/movements'
  res.locals.sender = SENDER
  res.locals.currentHolding = SENDER.cph
  res.locals.draft = draft
  res.locals.isOn = draft.direction === 'on'
  res.locals.animals = animals
  res.locals.groups = { clear: animals, authorisation: [], prohibited: [] }
  res.locals.newTags = draft.newTags || []
  res.locals.failures = []
  res.locals.failureCount = 0
  res.locals.errors = []
  res.locals.destination = destination
  res.locals.previousDestinations = LOCATIONS.filter(location => draft.direction !== 'on' || location.type !== 'slaughterhouse')
  res.locals.matchingDestinations = res.locals.previousDestinations
  res.locals.results = LOCATIONS.slice(0, 3)
  res.locals.search = draft.postcode || 'EX2 3CD'
  res.locals.quickDates = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'two-days', label: '2 days ago' },
    { value: 'three-days', label: '3 days ago' }
  ]
  res.locals.chosen = draft.dateChoice || 'today'
  res.locals.dates = {
    off: draft.direction === 'off' ? draft.date || 'Not provided' : null,
    on: draft.direction === 'on' ? draft.date || 'Not provided' : null
  }
  res.locals.posted = { day: draft.dateDay, month: draft.dateMonth, year: draft.dateYear }
  res.locals.confirmation = draft.confirmation || { reference: 'MOV-V2-001', animals: [], destination }
  res.locals.count = animals.length
  res.locals.filter = req.query.status || 'all'
  res.locals.actionFilter = req.query.actionWith || 'all'
  res.locals.labels = { confirmed: 'Confirmed' }
  res.locals.actionCounts = { you: 0, other: 0, bcms: 0 }

  const allMovements = [...data.simpleV2Reports.slice().reverse(), ...EXAMPLES]
  res.locals.movements = (res.locals.filter === 'all' || res.locals.filter === 'confirmed') &&
    res.locals.actionFilter === 'all' ? allMovements : []
  next()
})

// The journey root has no matching start.html URL, so it needs one simple GET.
router.get(BASE, (req, res) => {
  res.render(VIEW + 'start')
})

// These two GET routes supply the static completed movement examples.
router.get(BASE + '/movements/:id', (req, res) => {
  const isOn = ['on', 'MOV-2002', 'MOV-2004'].includes(req.params.id)
  const other = isOn ? LOCATIONS[1] : LOCATIONS[0]
  res.render(VIEW + 'detail', {
    movement: {
      id: isOn ? 'MOV-2002' : 'MOV-2001',
      holdingDirection: isOn ? 'on' : 'off',
      from: isOn ? other.identifier : SENDER.cph,
      to: isOn ? SENDER.cph : other.identifier,
      fromAddress: isOn ? other.address : SENDER.address,
      toAddress: isOn ? SENDER.address : other.address,
      count: 3,
      animals: CATTLE.slice(0, 3),
      offDate: isOn ? null : '21 October 2026',
      onDate: isOn ? '20 October 2026' : null,
      date: isOn ? '20 October 2026' : '21 October 2026',
      reportedBy: 'You (keeper)'
    }
  })
})

router.get(BASE + '/movements/:id/activity', (req, res) => {
  const isOn = ['on', 'MOV-2002', 'MOV-2004'].includes(req.params.id)
  res.render(VIEW + 'activity', {
    movement: {
      id: isOn ? 'MOV-2002' : 'MOV-2001',
      holdingDirection: isOn ? 'on' : 'off',
      from: isOn ? LOCATIONS[1].identifier : SENDER.cph,
      to: isOn ? SENDER.cph : LOCATIONS[0].identifier,
      date: isOn ? '20 October 2026' : '21 October 2026'
    }
  })
})

// Reporting: only the POST requests that save answers or choose a next page.
router.post(BASE + '/start', (req, res) => {
  req.session.data[SESSION] = { direction: 'off', tags: [] }
  res.redirect(BASE + '/movement-type')
})

router.post(BASE + '/movement-type', (req, res) => {
  req.session.data[SESSION].direction = req.body['rfm-movement-type'] === 'on' ? 'on' : 'off'
  res.redirect(BASE + (req.session.data[SESSION].direction === 'on' ? '/previous-destinations' : '/add-method'))
})

router.post(BASE + '/add-method', (req, res) => {
  res.redirect(BASE + (req.body['rfm-method'] === 'upload' ? '/upload' : '/manual'))
})

router.post(BASE + '/manual', (req, res) => {
  const draft = req.session.data[SESSION]
  const entered = String(req.body['rfm-tags'] || '').split(/[\n,;]+/)
  draft.newTags = []
  for (const value of entered) {
    const tag = value.toUpperCase().replace(/[\s-]/g, '')
    const animal = CATTLE.find(item => item.tag.replace(/\s/g, '') === tag)
    if (animal && !draft.tags.includes(animal.tag)) {
      draft.tags.push(animal.tag)
      draft.newTags.push(animal.tag)
    }
  }
  res.redirect(BASE + '/animals')
})

router.post(BASE + '/upload', (req, res) => {
  const draft = req.session.data[SESSION]
  draft.newTags = []
  for (const animal of CATTLE.slice(0, 3)) {
    if (!draft.tags.includes(animal.tag)) {
      draft.tags.push(animal.tag)
      draft.newTags.push(animal.tag)
    }
  }
  res.redirect(BASE + '/animals')
})

router.post(BASE + '/animals', (req, res) => {
  res.redirect(BASE + (req.body['rfm-another'] === 'yes' ? '/add-method' : '/movement-date'))
})

router.get(BASE + '/animal/:tag/remove', (req, res) => {
  res.render(VIEW + 'remove-animal', { tag: req.params.tag, returnTo: req.query.returnTo || 'animals' })
})

router.post(BASE + '/animal/:tag/remove', (req, res) => {
  const draft = req.session.data[SESSION]
  if (req.body['rfm-remove'] !== 'no') {
    draft.tags = draft.tags.filter(tag => tag !== req.params.tag)
  }
  res.redirect(BASE + '/' + (req.body['rfm-return-to'] || 'animals'))
})

router.post(BASE + '/remove-all', (req, res) => {
  if (req.body['rfm-remove-all'] !== 'no') req.session.data[SESSION].tags = []
  res.redirect(BASE + '/animals')
})

router.post(BASE + '/movement-date', (req, res) => {
  const draft = req.session.data[SESSION]
  draft.dateChoice = req.body['rfm-date-choice'] || 'today'
  draft.dateDay = req.body['rfm-day']
  draft.dateMonth = req.body['rfm-month']
  draft.dateYear = req.body['rfm-year']

  if (draft.dateChoice === 'different') {
    const date = new Date(Date.UTC(Number(draft.dateYear), Number(draft.dateMonth) - 1, Number(draft.dateDay)))
    draft.date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
  } else {
    const daysAgo = { today: 0, yesterday: 1, 'two-days': 2, 'three-days': 3 }[draft.dateChoice] || 0
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    draft.date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(date)
  }
  res.redirect(BASE + (draft.direction === 'on' ? '/check-answers' : '/previous-destinations'))
})

router.post(BASE + '/previous-destinations', (req, res) => {
  const draft = req.session.data[SESSION]
  if (req.body['rfm-previous'] === 'new') {
    return res.redirect(BASE + '/destination-type')
  }
  draft.locationId = req.body['rfm-previous']
  delete draft.location
  res.redirect(BASE + '/confirm-destination')
})

router.post(BASE + '/destination-type', (req, res) => {
  req.session.data[SESSION].destinationType = req.body['rfm-destination-type']
  res.redirect(BASE + (req.body['rfm-destination-type'] === 'other' ? '/destination-other' : '/find-method'))
})

router.post(BASE + '/find-method', (req, res) => {
  res.redirect(BASE + (req.body['rfm-find-method'] === 'address' ? '/destination-address' : '/destination'))
})

router.post(BASE + '/destination', (req, res) => {
  const draft = req.session.data[SESSION]
  const identifier = req.body['rfm-destination-id'] || ''
  draft.identifierSearch = identifier
  draft.location = LOCATIONS.find(item => item.identifier === identifier) || {
    identifier: identifier || '56/312/0056',
    address: 'Exampleton, EX2 3CD', type: 'holding', idLabel: 'CPH number'
  }
  res.redirect(BASE + '/confirm-destination')
})

router.post(BASE + '/destination-address', (req, res) => {
  req.session.data[SESSION].postcode = req.body['rfm-location-postcode']
  req.session.data[SESSION].property = req.body['rfm-location-property']
  res.redirect(BASE + '/destination-address-results')
})

router.post(BASE + '/destination-address/select', (req, res) => {
  req.session.data[SESSION].locationId = req.body['rfm-address-destination'] || 'hilltop'
  delete req.session.data[SESSION].location
  res.redirect(BASE + '/confirm-destination')
})

router.post(BASE + '/destination-other', (req, res) => {
  req.session.data[SESSION].location = {
    identifier: req.body['rfm-other-id'] || 'Not provided',
    address: req.body['rfm-other-name'] || 'Other location',
    type: 'other', idLabel: 'Identifier'
  }
  res.redirect(BASE + '/confirm-destination')
})

router.post(BASE + '/confirm-destination', (req, res) => {
  if (req.body['rfm-confirm-destination'] === 'no') {
    return res.redirect(BASE + '/previous-destinations')
  }
  res.redirect(BASE + (req.session.data[SESSION].direction === 'on' ? '/add-method' : '/check-answers'))
})

router.post(BASE + '/submit', (req, res) => {
  const draft = req.session.data[SESSION]
  const destination = draft.location || LOCATIONS.find(location => location.id === draft.locationId) || LOCATIONS[0]
  const reports = req.session.data.simpleV2Reports
  const reference = 'MOV-V2-' + String(reports.length + 1).padStart(3, '0')

  reports.push({
    id: reference,
    holdingDirection: draft.direction,
    otherHolding: destination.identifier,
    date: draft.date || 'Not provided',
    count: draft.tags.length,
    status: 'confirmed', label: 'Confirmed', colour: 'govuk-tag--green', actionWith: 'none'
  })
  draft.confirmation = {
    reference,
    animals: CATTLE.filter(animal => draft.tags.includes(animal.tag)),
    destination
  }
  res.redirect(BASE + '/confirmation')
})

module.exports = router
