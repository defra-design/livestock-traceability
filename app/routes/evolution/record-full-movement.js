'use strict'

/*
 * Whole cattle movement reporting journey.
 * Automatically loaded by the main prototype's recursive route loader.
 * A filename selected using the HTML file input triggers demo ear-tag data.
 */
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/evolution/record-full-movement'
const VIEW = 'evolution/record-full-movement/'
const SESSION = 'recordFullMovementV2'
const SENDER = { name: 'Oakfield Farm', cph: '37/123/4567', address: 'Oakfield Lane, Exampleton, EX1 2AB' }
const DESTINATIONS = [
  { id: 'hilltop', type: 'holding', name: 'Hilltop Farm', identifier: '56/312/0056', idLabel: 'CPH number', address: 'Mill Lane, Exampleton, EX2 3CD' },
  { id: 'brook', type: 'holding', name: 'Brook Farm', identifier: '15/628/0067', idLabel: 'CPH number', address: 'High Road, Exampleton, EX2 4DE' },
  { id: 'closed-holding', type: 'holding', name: 'Old Manor Farm', identifier: '12/345/9999', idLabel: 'CPH number', address: '1 Brick Lane, Shrewsbury, SY1 1AA', status: 'Closed' },
  { id: 'market', type: 'market', name: 'Example Livestock Market', identifier: '31/672/0158', idLabel: 'CPH number', address: 'Market Road, Exampleton, EX3 5EF' },
  { id: 'mart', type: 'market', name: 'Valley Livestock Market', identifier: '44/209/0317', idLabel: 'CPH number', address: 'Market Street, Exampleton, EX3 6FG' },
  { id: 'abattoir', type: 'slaughterhouse', name: 'Example Abattoir', identifier: 'UK 1234', idLabel: 'Approval number', address: 'Industrial Estate, Exampleton, EX4 7GH' },
  { id: 'slaughter', type: 'slaughterhouse', name: 'Valley Meats', identifier: 'UK 5678', idLabel: 'Approval number', address: 'Abbey Road, Exampleton, EX4 8HJ' },
  { id: 'show', type: 'showground', name: 'County Showground', identifier: '66/204/0141', idLabel: 'CPH number', address: 'Showground Road, Exampleton, EX5 9JK' },
  { id: 'collection', type: 'collection-centre', name: 'Example Collection Centre', identifier: '22/100/0044', idLabel: 'CPH number', address: 'Station Road, Exampleton, EX6 1MN' }
]
// Up to ten fictional destinations that Oakfield Farm has previously used.
const PREVIOUS_IDS = ['hilltop', 'market', 'abattoir', 'show']
const CATTLE = Array.from({ length: 180 }, (_, i) => {
  const n = String(i + 1).padStart(6, '0')
  return { tag: `UK 371234 ${n}`, normal: `UK371234${n}`, breed: [{ code: 'HF', name: 'Holstein Friesian' }, { code: 'BRB', name: 'British Blue' }, { code: 'AA', name: 'Aberdeen Angus' }, { code: 'HE', name: 'Hereford' }][i % 4], sex: i % 2 === 0 ? 'Female' : 'Male', dateOfBirth: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(2020 + (i % 5), i % 12, 1 + (i % 28)))) }
})
// Fictional restrictions used only to exercise the prototype journey.
const RESTRICTIONS = { 'UK 371234 000018': { category: 'authorisation', description: 'Movement licence required' }, 'UK 371234 000022': { category: 'authorisation', description: 'Movement under TB restrictions' }, 'UK 371234 000029': { category: 'prohibited', description: 'Movement recorded as prohibited by enforcement notice' } }
const LOOKUP = new Map(CATTLE.map(a => [a.normal, a.tag]))
const CATTLE_BY_TAG = new Map(CATTLE.map(a => [a.tag, a]))
const animalRow = tag => ({ ...CATTLE_BY_TAG.get(tag), tag, encodedTag: enc(tag), restriction: RESTRICTIONS[tag] || null })
const EXAMPLE_FILE_CATTLE = ['UK 371234 000001', 'UK 371234 000003', 'UK 371234 000005']
const TYPES = ['holding', 'market', 'slaughterhouse', 'showground', 'collection-centre', 'other']
const strip = v => String(v == null ? '' : v).trim()
const normalTag = v => strip(v).toUpperCase().replace(/[\s-]/g, '')
const normalId = v => strip(v).toUpperCase().replace(/[\s/]/g, '')
const enc = v => encodeURIComponent(String(v))
const yesNo = a => a === 'yes' || a === 'no'
const err = (field, message) => ({ field, message })

function blank () {
  return { direction: 'off', animals: [], pending: null, lastBatch: [], lastBatchIsAdditional: false, lastFailures: [], authorisation: '', method: '', dateChoice: '', dateDay: '', dateMonth: '', dateYear: '', otherDateChoice: '', otherDateDay: '', otherDateMonth: '', otherDateYear: '',
    destinationType: '', destinationId: '', findMethod: '', addressSearch: '', identifierSearch: '', otherDestination: null, confirmedDestination: false, confirmation: null }
}
function data (req) {
  const session = req.session.data
  if (!session[SESSION] || !Array.isArray(session[SESSION].animals)) session[SESSION] = blank()
  return session[SESSION]
}
function go (res, path) { return res.redirect(`${BASE}${path}`) }
function render (req, res, page, extras = {}, status = 200) {
  return res.status(status).render(VIEW + page, { base: BASE, draft: data(req), sender: SENDER, isOn: data(req).direction === 'on', ...extras })
}
function invalid (req, res, page, errors, extras) { return render(req, res, page, { errors, ...(extras || {}) }, 400) }
function getDestination (d) {
  return (d.destinationType === 'other' && d.otherDestination) ||
    DESTINATIONS.find(x => x.id === d.destinationId && x.type === d.destinationType) || null
}
function rows (d) { return d.animals.map(animalRow) }
function groups (d) { const a = rows(d); return { clear: a.filter(x => !x.restriction), authorisation: a.filter(x => x.restriction && x.restriction.category === 'authorisation'), prohibited: a.filter(x => x.restriction && x.restriction.category === 'prohibited') } }
function hasRestrictions (d) { return d.animals.some(tag => !!RESTRICTIONS[tag]) }
function requireAuthorisation (req, res) { if (!requireAnimals(req, res)) return false; if (hasRestrictions(data(req)) && !['yes', 'no', 'unsure'].includes(data(req).authorisation)) { go(res, '/movement-authorisation'); return false } return true }
function requireAnimals (req, res) { if (!data(req).animals.length) { go(res, '/add-method'); return false } return true }
function requireDate (req, res) {
  if (!requireAuthorisation(req, res)) return false
  if (movementDate(data(req).dateDay, data(req).dateMonth, data(req).dateYear).message) { go(res, '/movement-date'); return false }
  return true
}
// The initial date is the date for the holding making the report. The other
// date can be the same, different, or not known to this keeper.
function otherDateResult (d) {
  if (!['same', 'different', 'unknown'].includes(d.otherDateChoice)) return { message: 'Select whether the dates were the same' }
  const own = movementDate(d.dateDay, d.dateMonth, d.dateYear)
  if (own.message) return { message: own.message }
  if (d.otherDateChoice === 'unknown') return { display: 'Not known', known: false }
  if (d.otherDateChoice === 'same') return { display: own.display, known: true }
  const other = movementDate(d.otherDateDay, d.otherDateMonth, d.otherDateYear)
  if (other.message) return other
  const ownTime = Date.UTC(Number(d.dateYear), Number(d.dateMonth) - 1, Number(d.dateDay))
  const otherTime = Date.UTC(Number(d.otherDateYear), Number(d.otherDateMonth) - 1, Number(d.otherDateDay))
  if (otherTime === ownTime) return { message: 'Select Yes if the cattle moved on the same day' }
  // Arrival cannot precede departure: which date is which depends on direction.
  if ((d.direction === 'off' && otherTime < ownTime) || (d.direction === 'on' && ownTime < otherTime)) {
    return { message: 'The arrival date cannot be before the departure date' }
  }
  return { display: other.display, known: true }
}
function movementDates (d) {
  const own = movementDate(d.dateDay, d.dateMonth, d.dateYear).display
  const other = otherDateResult(d)
  return {
    off: d.direction === 'off' ? own : other.display,
    on: d.direction === 'on' ? own : other.display,
    otherDateChoice: d.otherDateChoice
  }
}
function requireOtherDate (req, res) {
  if (!requireDate(req, res)) return false
  if (otherDateResult(data(req)).message) { go(res, '/other-movement-date'); return false }
  return true
}
function requireDestination (req, res) {
  if (data(req).direction !== 'on' && !requireDate(req, res)) return false
  if (!getDestination(data(req))) { go(res, '/previous-destinations'); return false }
  return true
}
function requireType (req, res) {
  if (data(req).direction === 'on') { if (!data(req).direction) { go(res, '/movement-type'); return false } }
  else if (!requireDate(req, res)) return false
  if (!TYPES.includes(data(req).destinationType)) { go(res, '/destination-type'); return false }
  return true
}
// Compare with today's calendar date in the UK, regardless of server timezone.
function todayUK () {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const fields = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  return new Date(Date.UTC(Number(fields.year), Number(fields.month) - 1, Number(fields.day)))
}
function quickDates () {
  const today = todayUK()
  const fmt = x => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(x)
  return [
    { value: 'two-days', offset: 2, label: 'Two days ago – ' + fmt(new Date(today.getTime() - 2 * 86400000)) },
    { value: 'yesterday', offset: 1, label: 'Yesterday – ' + fmt(new Date(today.getTime() - 86400000)) },
    { value: 'today', offset: 0, label: 'Today – ' + fmt(today) }
  ]
}
function datePartsFromOffset (offset) {
  const d = new Date(todayUK().getTime() - offset * 86400000)
  return { day: String(d.getUTCDate()), month: String(d.getUTCMonth() + 1), year: String(d.getUTCFullYear()) }
}
function movementDate (day, month, year) {
  if (!day || !month || !year) return { message: 'Enter the date the cattle moved' }
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return { message: 'Enter a real date of movement' }
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (d.getUTCFullYear() !== Number(year) || d.getUTCMonth() + 1 !== Number(month) || d.getUTCDate() !== Number(day)) return { message: 'Enter a real date of movement' }
  const daysAgo = Math.round((todayUK().getTime() - d.getTime()) / 86400000)
  if (daysAgo < 0) return { message: 'The movement date must be today or in the past' }
  if (daysAgo > 3650) return { message: 'Enter a movement date within the last 10 years for this prototype' }
  return { daysAgo, late: daysAgo > 3, display: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d) }
}
function validateLines (lines, draft, prior = []) {
  const good = prior.slice()
  const issues = []
  const seen = new Set([...good.map(normalTag), ...draft.animals.map(normalTag)])
  lines.forEach((v, i) => {
    const raw = strip(v)
    if (!raw) return
    const n = normalTag(raw)
    if (!/^UK\d{12}$/.test(n)) issues.push({ line: i + 1, value: raw, message: 'Enter a UK ear tag number in the correct format' })
    else if (seen.has(n)) issues.push({ line: i + 1, value: raw, message: 'This animal is already included' })
    else if (!LOOKUP.has(n)) issues.push({ line: i + 1, value: raw, message: draft.direction === 'on' ? 'Animal not found at the selected sending holding' : 'Animal not found on the demonstration holding' })
    else { good.push(LOOKUP.get(n)); seen.add(n) }
  })
  return { good, issues }
}
function commitBatch (d, result) {
  const newlyAdded = result.good.filter(tag => !d.animals.includes(tag))
  d.lastBatchIsAdditional = d.animals.length > 0
  d.animals.push(...newlyAdded)
  if (newlyAdded.length) d.authorisation = ''
  d.lastBatch = newlyAdded
  d.lastFailures = result.issues
  d.pending = null
  d.confirmation = null
}
function animalPageData (d) {
  return { animals: rows(d), groups: groups(d), newTags: d.lastBatchIsAdditional ? d.lastBatch : [], recentAddedCount: d.lastBatch.length, failures: d.lastFailures, failureCount: d.lastFailures.length }
}
function clearRecent (d) { d.lastBatch = []; d.lastBatchIsAdditional = false; d.lastFailures = [] }

function listMatches (d) { return DESTINATIONS.filter(x => x.type === d.destinationType) }
function searchDestinations (d, query) {
  const words = strip(query).toLowerCase().split(/\s+/).filter(Boolean)
  return words.length ? listMatches(d).filter(x => words.every(word => (x.address + ' ' + x.name + ' ' + x.identifier).toLowerCase().includes(word))) : []
}
function selectDestination (d, destination) {
  d.destinationId = destination.id
  d.confirmedDestination = false
  d.confirmation = null
}
function confirmationBack (d) {
  if (d.findMethod === 'address') return '/destination-address?q=' + enc(d.addressSearch)
  if (d.findMethod === 'identifier') return '/destination'
  if (d.destinationType === 'other') return '/destination-other'
  return '/previous-destinations'
}
function clearDestination (d) {
  d.destinationType = ''; d.destinationId = ''; d.findMethod = ''; d.addressSearch = ''; d.identifierSearch = ''; d.otherDestination = null; d.confirmedDestination = false; d.confirmation = null
}
function saveDate (d, parts, option) {
  d.dateDay = parts.day; d.dateMonth = parts.month; d.dateYear = parts.year
  d.dateChoice = option; d.confirmation = null
  // The other-date response remains saved and is revalidated against any changed date.
}

// Register routes on the exported Express router.
  router.get(BASE, (req, res) => render(req, res, 'start'))
  router.post(`${BASE}/start`, (req, res) => { req.session.data[SESSION] = blank(); return go(res, '/movement-type') })
  router.post(`${BASE}/reset`, (req, res) => { delete req.session.data[SESSION]; return go(res, '') })

  router.get(`${BASE}/movement-type`, (req, res) => render(req, res, 'movement-type'))
  router.post(`${BASE}/movement-type`, (req, res) => {
    const choice = strip(req.body['rfm-movement-type'])
    if (!['off', 'on'].includes(choice)) return invalid(req, res, 'movement-type', [err('movement-type-error', 'Select a movement type')])
    const d = data(req)
    d.direction = choice
    return go(res, choice === 'on' ? '/previous-destinations' : '/add-method')
  })

  router.get(`${BASE}/add-method`, (req, res) => { if (data(req).direction === 'on' && !data(req).confirmedDestination) return go(res, '/previous-destinations'); clearRecent(data(req)); return render(req, res, 'add-method') })
  router.post(`${BASE}/add-method`, (req, res) => {
    const method = strip(req.body['rfm-method'])
    if (!['upload', 'manual'].includes(method)) return invalid(req, res, 'add-method', [err('add-method-error', 'Select how you want to add cattle')])
    const d = data(req)
    if (d.direction === 'on' && !d.confirmedDestination) return go(res, '/previous-destinations')
    d.method = method; d.pending = null
    return go(res, '/' + method)
  })

  router.get(`${BASE}/upload`, (req, res) => render(req, res, 'upload'))
  router.post(`${BASE}/upload`, (req, res) => {
    const filename = strip(req.body['rfm-file'])
    if (data(req).direction === 'on' && !data(req).confirmedDestination) return go(res, '/previous-destinations')
    if (!filename) return invalid(req, res, 'upload', [err('file-upload-error', 'Select a file to upload')])
    if (!/\.(csv|xlsx)$/i.test(filename)) return invalid(req, res, 'upload', [err('file-upload-error', 'Choose a CSV or XLSX file')])
    const d = data(req)
    commitBatch(d, validateLines(EXAMPLE_FILE_CATTLE, d))
    return go(res, '/animals')
  })
  router.get(`${BASE}/manual`, (req, res) => render(req, res, 'manual'))
  router.post(`${BASE}/manual`, (req, res) => {
    const entered = strip(req.body['rfm-tags'])
    if (data(req).direction === 'on' && !data(req).confirmedDestination) return go(res, '/previous-destinations')
    if (!entered) return invalid(req, res, 'manual', [err('ear-tags-error', 'Enter at least one ear tag number')], { postedTags: entered })
    const lines = entered.split(/\r\n|\n|\r/)
    if (lines.length > 500) return invalid(req, res, 'manual', [err('ear-tags-error', 'Enter no more than 500 ear tag numbers at a time')], { postedTags: entered })
    const d = data(req)
    commitBatch(d, validateLines(lines, d))
    return go(res, '/animals')
  })
  router.get(`${BASE}/animals-not-added`, (req, res) => {
    const d = data(req)
    d.lastBatch = []
    return render(req, res, 'animals-not-added', { failures: d.lastFailures })
  })
  router.get(`${BASE}/animals`, (req, res) => render(req, res, 'animals', animalPageData(data(req))))
  router.post(`${BASE}/animals`, (req, res) => {
    const answer = strip(req.body['rfm-another'])
    const d = data(req)
    if (!yesNo(answer)) return invalid(req, res, 'animals', [err('another-error', 'Select yes if you need to add more cattle')], animalPageData(d))
    if (answer === 'yes') { clearRecent(d); return go(res, '/add-method') }
    if (!d.animals.length) return invalid(req, res, 'animals', [err('another-error', 'Add at least one animal before continuing')], animalPageData(d))
    clearRecent(d)
    return go(res, hasRestrictions(d) ? '/movement-authorisation' : '/movement-date')
  })
  router.get(`${BASE}/movement-authorisation`, (req, res) => {
    if (!requireAnimals(req, res)) return
    if (!hasRestrictions(data(req))) { data(req).authorisation = ''; return go(res, '/movement-date') }
    return render(req, res, 'movement-authorisation', { groups: groups(data(req)), returnTo: req.query.returnTo === 'check-answers' ? 'check-answers' : 'movement-date' })
  })
  router.post(`${BASE}/movement-authorisation`, (req, res) => {
    if (!requireAnimals(req, res)) return
    if (!hasRestrictions(data(req))) { data(req).authorisation = ''; return go(res, '/movement-date') }
    const answer = strip(req.body['rfm-authorisation'])
    if (!['yes', 'no', 'unsure'].includes(answer)) return invalid(req, res, 'movement-authorisation', [err('authorisation-error', 'Select whether you had authorisation when the cattle moved')], { groups: groups(data(req)), returnTo: req.body['rfm-return-to'] === 'check-answers' ? 'check-answers' : 'movement-date' })
    data(req).authorisation = answer
    data(req).confirmation = null
    return go(res, req.body['rfm-return-to'] === 'check-answers' ? '/check-answers' : '/movement-date')
  })
  router.get(`${BASE}/animal/:tag/remove`, (req, res) => { clearRecent(data(req)); return data(req).animals.includes(req.params.tag)
    ? render(req, res, 'remove-animal', { tag: req.params.tag, returnTo: req.query.returnTo === 'check-answers' ? 'check-answers' : 'animals' }) : go(res, '/animals') })
  router.post(`${BASE}/animal/:tag/remove`, (req, res) => {
    const ans = strip(req.body['rfm-remove']), tag = req.params.tag, returnTo = req.body['rfm-return-to'] === 'check-answers' ? 'check-answers' : 'animals'
    if (!yesNo(ans)) return invalid(req, res, 'remove-animal', [err('remove-error', 'Select yes if you want to remove the animal')], { tag, returnTo })
    if (ans === 'yes') { const d = data(req); d.animals = d.animals.filter(x => x !== tag); d.authorisation = ''; d.confirmation = null }
    return go(res, '/' + (returnTo === 'check-answers' && !data(req).animals.length ? 'add-method' : returnTo))
  })

  router.get(`${BASE}/remove-all`, (req, res) => {
    clearRecent(data(req))
    return render(req, res, 'remove-all', { count: data(req).animals.length })
  })
  router.post(`${BASE}/remove-all`, (req, res) => {
    const answer = strip(req.body['rfm-remove-all'])
    if (!yesNo(answer)) return invalid(req, res, 'remove-all', [err('remove-all-error', 'Select yes if you want to remove all cattle')], { count: data(req).animals.length })
    if (answer === 'yes') { data(req).animals = []; data(req).authorisation = ''; clearRecent(data(req)); data(req).confirmation = null }
    return go(res, '/animals')
  })
  router.get(`${BASE}/movement-date`, (req, res) => {
    clearRecent(data(req))
    if (!requireAuthorisation(req, res)) return
    return render(req, res, 'movement-date', { quickDates: quickDates(), chosen: data(req).dateChoice })
  })
  router.post(`${BASE}/movement-date`, (req, res) => {
    if (!requireAuthorisation(req, res)) return
    const d = data(req), chosen = strip(req.body['rfm-date-choice'])
    const opt = quickDates().find(o => o.value === chosen)
    let parts
    if (opt) parts = datePartsFromOffset(opt.offset)
    else if (chosen === 'different') parts = { day: strip(req.body['rfm-day']), month: strip(req.body['rfm-month']), year: strip(req.body['rfm-year']) }
    else return invalid(req, res, 'movement-date', [err('movement-date-error', 'Select when the cattle moved')], { quickDates: quickDates(), chosen })
    const parsed = movementDate(parts.day, parts.month, parts.year)
    if (parsed.message) return invalid(req, res, 'movement-date', [err('movement-date-error', parsed.message)], { quickDates: quickDates(), chosen, posted: parts })
    saveDate(d, parts, chosen)
    return go(res, '/other-movement-date')
  })
  router.get(`${BASE}/other-movement-date`, (req, res) => {
    if (!requireDate(req, res)) return
    return render(req, res, 'other-movement-date', {
      originalDate: movementDate(data(req).dateDay, data(req).dateMonth, data(req).dateYear).display
    })
  })

  router.post(`${BASE}/other-movement-date`, (req, res) => {
    if (!requireDate(req, res)) return
    const d = data(req)
    const choice = strip(req.body['rfm-other-date-choice'])
    if (!['same', 'different', 'unknown'].includes(choice)) {
      return invalid(req, res, 'other-movement-date', [err('other-date-error', 'Select whether the cattle moved on the same day')], {
        originalDate: movementDate(d.dateDay, d.dateMonth, d.dateYear).display
      })
    }
    const proposed = { ...d,
      otherDateChoice: choice,
      otherDateDay: strip(req.body['rfm-other-day']),
      otherDateMonth: strip(req.body['rfm-other-month']),
      otherDateYear: strip(req.body['rfm-other-year'])
    }
    const result = otherDateResult(proposed)
    if (result.message) {
      return invalid(req, res, 'other-movement-date', [err('other-date-error', result.message)], {
        originalDate: movementDate(d.dateDay, d.dateMonth, d.dateYear).display,
        posted: proposed
      })
    }
    d.otherDateChoice = choice
    d.otherDateDay = choice === 'different' ? proposed.otherDateDay : ''
    d.otherDateMonth = choice === 'different' ? proposed.otherDateMonth : ''
    d.otherDateYear = choice === 'different' ? proposed.otherDateYear : ''
    d.confirmation = null
    return go(res, d.direction === 'on' ? '/check-answers' : '/previous-destinations')
  })

  router.get(`${BASE}/previous-destinations`, (req, res) => {
    if (data(req).direction !== 'on' && !requireDate(req, res)) return
    return render(req, res, 'previous-destinations', { previousDestinations: PREVIOUS_IDS.map(id => DESTINATIONS.find(x => x.id === id)).filter(Boolean).slice(0, 10) })
  })
  router.post(`${BASE}/previous-destinations`, (req, res) => {
    if (data(req).direction !== 'on' && !requireDate(req, res)) return
    const id = strip(req.body['rfm-previous']), previous = PREVIOUS_IDS.map(k => DESTINATIONS.find(x => x.id === k)).find(x => x && x.id === id)
    if (id !== 'new' && !previous) return invalid(req, res, 'previous-destinations', [err('previous-error', 'Select a destination')], { previousDestinations: PREVIOUS_IDS.map(k => DESTINATIONS.find(x => x.id === k)) })
    const d = data(req); clearDestination(d)
    if (id === 'new') return go(res, '/destination-type')
    d.destinationType = previous.type; d.destinationId = previous.id
    return go(res, '/confirm-destination')
  })
  router.get(`${BASE}/destination-type`, (req, res) => {
    if (data(req).direction !== 'on' && !requireDate(req, res)) return
    return render(req, res, 'destination-type')
  })
  router.post(`${BASE}/destination-type`, (req, res) => {
    if (data(req).direction !== 'on' && !requireDate(req, res)) return
    const type = strip(req.body['rfm-destination-type'])
    if (!TYPES.includes(type)) return invalid(req, res, 'destination-type', [err('destination-type-error', 'Select the type of destination')])
    const d = data(req); clearDestination(d); d.destinationType = type
    return go(res, type === 'other' ? '/destination-other' : '/find-method')
  })
  router.get(`${BASE}/find-method`, (req, res) => {
    if (!requireType(req, res)) return
    if (data(req).destinationType === 'other') return go(res, '/destination-other')
    return render(req, res, 'find-method')
  })
  router.post(`${BASE}/find-method`, (req, res) => {
    if (!requireType(req, res)) return
    const method = strip(req.body['rfm-find-method'])
    if (!['identifier', 'address'].includes(method)) return invalid(req, res, 'find-method', [err('find-method-error', 'Select how to find the destination')])
    const d = data(req); d.findMethod = method; d.destinationId = ''; d.confirmedDestination = false; d.confirmation = null
    return go(res, method === 'identifier' ? '/destination' : '/destination-address')
  })
  router.get(`${BASE}/destination`, (req, res) => {
    if (!requireType(req, res)) return
    return render(req, res, 'destination', { matchingDestinations: listMatches(data(req)) })
  })
  router.post(`${BASE}/destination`, (req, res) => {
    if (!requireType(req, res)) return
    const d = data(req), entered = strip(req.body['rfm-destination-id'])
    const dest = listMatches(d).find(x => normalId(x.identifier) === normalId(entered))
    if (!dest) return invalid(req, res, 'destination', [err('destination-id-error', entered ? 'No matching demonstration destination was found' : 'Enter a destination identifier')], { enteredId: entered, matchingDestinations: listMatches(d) })
    d.identifierSearch = entered; selectDestination(d, dest)
    return go(res, '/confirm-destination')
  })
  router.get(`${BASE}/destination-address`, (req, res) => {
    if (!requireType(req, res)) return
    const d = data(req)
    // Retain separate fields for this HMRC-style postcode lookup.
    return render(req, res, 'destination-address', {
      postcode: d.addressPostcode || '',
      property: d.addressProperty || ''
    })
  })
  router.post(`${BASE}/destination-address`, (req, res) => {
    if (!requireType(req, res)) return
    const postcode = strip(req.body['rfm-location-postcode'])
    const property = strip(req.body['rfm-location-property'])
    if (!postcode) {
      return invalid(req, res, 'destination-address', [
        err('location-postcode-error', 'Enter a postcode')
      ], { postcode, property })
    }
    const d = data(req)
    d.addressPostcode = postcode
    d.addressProperty = property
    // Existing registered-location matching accepts individual search words.
    // Keep addressSearch for the existing results and confirmation routes.
    const search = [property, postcode].filter(Boolean).join(' ')
    d.addressSearch = search
    const results = searchDestinations(d, search)
    if (results.length === 1) {
      selectDestination(d, results[0])
      return go(res, '/confirm-destination')
    }
    return go(res, '/destination-address-results')
  })
  router.get(`${BASE}/destination-address-results`, (req, res) => {
    if (!requireType(req, res)) return
    const d = data(req)
    if (!d.addressSearch) return go(res, '/destination-address')
    const results = searchDestinations(d, d.addressSearch)
    if (results.length === 1) {
      selectDestination(d, results[0])
      return go(res, '/confirm-destination')
    }
    return render(req, res, 'destination-address-results', { search: d.addressSearch, results })
  })
  router.post(`${BASE}/destination-address/select`, (req, res) => {
    if (!requireType(req, res)) return
    const d = data(req), id = strip(req.body['rfm-address-destination'])
    const results = searchDestinations(d, d.addressSearch)
    const chosen = results.find(x => x.id === id)
    if (!chosen) return invalid(req, res, 'destination-address-results', [err('select-address-error', 'Select a registered destination')], { search: d.addressSearch, results })
    selectDestination(d, chosen)
    return go(res, '/confirm-destination')
  })
  router.get(`${BASE}/destination-other`, (req, res) => {
    if (!requireType(req, res)) return
    return render(req, res, 'destination-other', { posted: data(req).otherDestination || {} })
  })
  router.post(`${BASE}/destination-other`, (req, res) => {
    if (!requireType(req, res)) return
    const posted = { name: strip(req.body['rfm-other-name']), identifier: strip(req.body['rfm-other-id']), address: strip(req.body['rfm-other-address']) }
    if (!posted.name || !posted.identifier || !posted.address) return invalid(req, res, 'destination-other', [err('other-details-error', 'Enter the name, identifier and address')], { posted })
    const d = data(req)
    d.otherDestination = { id: 'other', type: 'other', idLabel: 'Destination identifier', ...posted }
    d.confirmedDestination = false; d.confirmation = null
    return go(res, '/confirm-destination')
  })
  router.get(`${BASE}/confirm-destination`, (req, res) => {
    if (!requireDestination(req, res)) return
    const destination = getDestination(data(req))
    return render(req, res, 'confirm-destination', { destination, isClosed: destination.status === 'Closed', backTo: confirmationBack(data(req)) })
  })
  router.post(`${BASE}/confirm-destination`, (req, res) => {
    if (!requireDestination(req, res)) return
    const destination = getDestination(data(req))
    if (destination.status === 'Closed') { data(req).confirmedDestination = false; return go(res, '/confirm-destination') }
    const answer = strip(req.body['rfm-confirm-destination'])
    if (!yesNo(answer)) return invalid(req, res, 'confirm-destination', [err('confirm-destination-error', 'Select whether this is the correct destination')], { destination: getDestination(data(req)), backTo: confirmationBack(data(req)) })
    if (answer === 'no') { const d = data(req); d.destinationId = ''; d.otherDestination = null; d.confirmedDestination = false; return go(res, confirmationBack(d)) }
    data(req).confirmedDestination = true
    return go(res, data(req).direction === 'on' && !data(req).animals.length ? '/add-method' : '/check-answers')
  })
  router.get(`${BASE}/check-answers`, (req, res) => {
    if (!requireDestination(req, res)) return
    if (!requireOtherDate(req, res)) return
    if (!data(req).confirmedDestination || getDestination(data(req)).status === 'Closed') return go(res, '/confirm-destination')
    const d = data(req)
    return render(req, res, 'check-answers', { destination: getDestination(d), movement: movementDate(d.dateDay, d.dateMonth, d.dateYear), animals: rows(d), groups: groups(d), hasRestrictions: hasRestrictions(d), dates: movementDates(d) })
  })
  router.post(`${BASE}/submit`, (req, res) => {
    if (!requireDestination(req, res)) return
    if (!requireOtherDate(req, res)) return
    const d = data(req)
    if (!d.confirmedDestination || getDestination(d).status === 'Closed') return go(res, '/confirm-destination')
    if (!d.confirmation) d.confirmation = {
      reference: (d.direction === 'on' ? 'MI-' : 'MO-') + String(Math.floor(Math.random() * 900000) + 100000),
      direction: d.direction, destination: getDestination(d), date: movementDate(d.dateDay, d.dateMonth, d.dateYear).display, offDate: movementDates(d).off, onDate: movementDates(d).on, animals: d.animals.slice(), authorisation: d.authorisation
    }
    return go(res, '/confirmation')
  })
  router.get(`${BASE}/confirmation`, (req, res) => {
    if (!data(req).confirmation) return go(res, '')
    return render(req, res, 'confirmation', { confirmation: data(req).confirmation })
  })

module.exports = router
