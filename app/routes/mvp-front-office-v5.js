const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

function getSelectedHolding(req) {
  const holdingsData = req.session.data.holdingsSingleCph
  const holdingId = req.session.data['holding-id'] || 'holding-001'
  return holdingsData.holdings.find((h) => h.id === holdingId) || holdingsData.holdings[0]
}

// Dummy data for now - a real animal error record data source will
// replace this once the JSON is built.
function getErrorRecords() {
  return [
    {
      id: '0987-9875',
      earTagNumber: 'UK324537467886',
      date: '11-08-2025',
      dateOfBirth: '09-07-2025',
      dateOfRegistration: '10-08-2025',
      category: 'Late birth registration',
      reason: 'Date of birth appears to be over the 27-day deadline to report a calf birth.',
      evidence: 'You may be required to provide a written explanation describing why the birth could not be reported within the allotted time.',
      status: 'Rejected'
    },
    {
      id: '6780-5907',
      earTagNumber: 'UK324537467887',
      date: '12-08-2025',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      category: 'Dam calving interval',
      reason: 'The genetic dam appears to have given birth in the past 240 days.',
      evidence: 'You may be required to provide documentary evidence or DNA parentage testing.',
      status: 'Pending'
    },
    {
      id: '2987-1984',
      earTagNumber: 'UK324537467888',
      date: '13-08-2025',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      category: 'Dam age',
      reason: 'The genetic dam appears to be under 15-months old',
      evidence: 'You may be required to provide a signed declaration from your veterinarian or breed society.',
      status: 'Resolved'
    }
  ]
}

// Dummy data for now - pending registrations will come from the real
// registration submission pipeline once it exists.
function getPendingRegistrations() {
  return [
    {
      earTagNumber: 'UK324537467901',
      dateOfBirth: '02-08-2025',
      dateOfRegistration: '05-08-2025',
      sex: 'Female',
      breed: { name: 'Holstein Friesian', code: 'HO' }
    },
    {
      earTagNumber: 'UK324537467902',
      dateOfBirth: '14-08-2025',
      dateOfRegistration: '18-08-2025',
      sex: 'Male',
      breed: { name: 'Holstein Friesian Cross', code: 'HOX' }
    },
    {
      earTagNumber: 'UK324537467903',
      dateOfBirth: '21-08-2025',
      dateOfRegistration: '25-08-2025',
      sex: 'Female',
      breed: { name: 'Limousin', code: 'LM' }
    },
    {
      earTagNumber: 'UK324537467904',
      dateOfBirth: '30-08-2025',
      dateOfRegistration: '02-09-2025',
      sex: 'Male',
      breed: { name: 'British Blue', code: 'BB' }
    },
    {
      earTagNumber: 'UK324537467905',
      dateOfBirth: '06-09-2025',
      dateOfRegistration: '09-09-2025',
      sex: 'Female',
      breed: { name: 'Aberdeen Angus', code: 'AA' }
    }
  ]
}

// Dummy data for now - a real submissions data source will replace
// this once the JSON is built.
function getBirthSubmissions() {
  return [
    {
      reference: '9872-9873',
      date: '05-05-2026',
      total: 2,
      errorCount: null,
      status: 'Draft',
      statusClass: 'govuk-tag--blue',
      href: '/mvp-front-office/v5/register-animal/submission-detail-draft'
    },
    {
      reference: '5268-9872',
      date: '08-05-2026',
      total: 4,
      errorCount: null,
      status: 'Pending validation',
      statusClass: 'govuk-tag--yellow',
      href: '/mvp-front-office/v5/register-animal/submission-detail-pending'
    },
    {
      reference: '7863-9873',
      date: '01-05-2026',
      total: 12,
      errorCount: 1,
      status: 'Approved',
      statusClass: 'govuk-tag--green',
      href: '/mvp-front-office/v5/register-animal/submission-detail-sent'
    }
  ]
}

function getMovementSubmissions() {
  return [
    {
      reference: '7652-6478',
      date: '05-05-2026',
      total: 2,
      errorCount: null,
      status: 'Draft',
      statusClass: 'govuk-tag--blue',
      movementType: 'On movement',
      href: '#'
    },
    {
      reference: '2568-8762',
      date: '08-05-2026',
      total: 4,
      errorCount: null,
      status: 'Pending validation',
      statusClass: 'govuk-tag--yellow',
      movementType: 'Off movement',
      href: '#'
    },
    {
      reference: '5678-2678',
      date: '01-05-2026',
      total: 12,
      errorCount: 1,
      status: 'Sent',
      statusClass: 'govuk-tag--green',
      movementType: 'On movement',
      href: '#'
    }
  ]
}

function getDeathSubmissions() {
  return [
    {
      reference: '1234-8976',
      date: '05-05-2026',
      total: 2,
      errorCount: null,
      status: 'Draft',
      statusClass: 'govuk-tag--blue',
      href: '#'
    },
    {
      reference: '1422-4391',
      date: '08-05-2026',
      total: 2,
      errorCount: null,
      status: 'Pending validation',
      statusClass: 'govuk-tag--yellow',
      href: '#'
    },
    {
      reference: '2598-1893',
      date: '01-05-2026',
      total: 12,
      errorCount: 1,
      status: 'Sent',
      statusClass: 'govuk-tag--green',
      href: '#'
    }
  ]
}

function parseDDMMYYYY(dateString) {
  const [day, month, year] = dateString.split('-')
  return new Date(`${year}-${month}-${day}`).getTime()
}

function paginateSubmissions(submissions, req, basePath, pageParam = 'page') {
  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(submissions.length / pageSize))
  const requestedPage = parseInt(req.query[pageParam], 10) || 1
  const page = Math.min(Math.max(requestedPage, 1), totalPages)

  const pagedSubmissions = submissions.slice((page - 1) * pageSize, page * pageSize)

  const pageHref = (pageNumber) => {
    const params = new URLSearchParams()
    params.set(pageParam, pageNumber)
    return `${basePath}?${params.toString()}`
  }

  const pagination = totalPages > 1 ? {
    previous: page > 1 ? { href: pageHref(page - 1) } : undefined,
    next: page < totalPages ? { href: pageHref(page + 1) } : undefined,
    items: Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => ({
      number: pageNumber,
      current: pageNumber === page,
      href: pageHref(pageNumber)
    }))
  } : null

  const showingFrom = submissions.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, submissions.length)

  return { pagedSubmissions, pagination, showingFrom, showingTo, totalSubmissions: submissions.length }
}

router.get('/mvp-front-office/v5/my-holdings/register-cattle-birth', (req, res) => {
  const holding = getSelectedHolding(req)
  const basePath = '/mvp-front-office/v5/my-holdings/register-cattle-birth'
  const removedDraftReferences = req.session.data.removedDraftReferences || []
  const allSubmissions = getBirthSubmissions().filter(
    (submission) => !removedDraftReferences.includes(submission.reference)
  )

  const draftSubmissions = allSubmissions.filter((submission) => submission.status === 'Draft')
  const sentSubmissions = allSubmissions
    .filter((submission) => submission.status !== 'Draft')
    .sort((a, b) => parseDDMMYYYY(b.date) - parseDDMMYYYY(a.date))
  const sent = paginateSubmissions(sentSubmissions, req, basePath, 'sentPage')

  res.render('mvp-front-office/v5/my-holdings/register-cattle-birth', {
    holding,
    draftSubmissions,
    totalDrafts: draftSubmissions.length,
    sentSubmissions: sent.pagedSubmissions,
    sentPagination: sent.pagination,
    sentShowingFrom: sent.showingFrom,
    sentShowingTo: sent.showingTo,
    totalSent: sent.totalSubmissions
  })
})

router.get('/mvp-front-office/errors-empty-states/my-holdings/register-cattle-birth', (req, res) => {
  const holding = getSelectedHolding(req)
  const basePath = '/mvp-front-office/errors-empty-states/my-holdings/register-cattle-birth'
  const removedDraftReferences = req.session.data.removedDraftReferences || []
  const allSubmissions = getBirthSubmissions().filter(
    (submission) => !removedDraftReferences.includes(submission.reference)
  )

  const draftSubmissions = allSubmissions.filter((submission) => submission.status === 'Draft')
  const sentSubmissions = allSubmissions
    .filter((submission) => submission.status !== 'Draft')
    .sort((a, b) => parseDDMMYYYY(b.date) - parseDDMMYYYY(a.date))
  const sent = paginateSubmissions(sentSubmissions, req, basePath, 'sentPage')

  res.render('mvp-front-office/errors-empty-states/my-holdings/register-cattle-birth', {
    holding,
    draftSubmissions,
    totalDrafts: draftSubmissions.length,
    sentSubmissions: sent.pagedSubmissions,
    sentPagination: sent.pagination,
    sentShowingFrom: sent.showingFrom,
    sentShowingTo: sent.showingTo,
    totalSent: sent.totalSubmissions
  })
})

router.get('/mvp-front-office/v5/my-holdings/register-cattle-birth/remove-draft', (req, res) => {
  const submission = getBirthSubmissions().find(
    (s) => s.status === 'Draft' && s.reference === req.query.reference
  )

  if (!submission) {
    return res.redirect('/mvp-front-office/v5/my-holdings/register-cattle-birth')
  }

  res.render('mvp-front-office/v5/my-holdings/remove-draft-registration', { submission })
})

router.post('/mvp-front-office/v5/my-holdings/register-cattle-birth/remove-draft', (req, res) => {
  const removedDraftReferences = req.session.data.removedDraftReferences || []
  removedDraftReferences.push(req.body['draft-reference'])
  req.session.data.removedDraftReferences = removedDraftReferences

  res.redirect('/mvp-front-office/v5/my-holdings/register-cattle-birth')
})

router.get('/mvp-front-office/v5/my-holdings/report-cattle-movement', (req, res) => {
  const holding = getSelectedHolding(req)
  const basePath = '/mvp-front-office/v5/my-holdings/report-cattle-movement'
  const removedDraftReferences = req.session.data.removedDraftReferences || []
  const allSubmissions = getMovementSubmissions().filter(
    (submission) => !removedDraftReferences.includes(submission.reference)
  )

  const draftSubmissions = allSubmissions.filter((submission) => submission.status === 'Draft')
  const sentSubmissions = allSubmissions
    .filter((submission) => submission.status !== 'Draft')
    .sort((a, b) => parseDDMMYYYY(b.date) - parseDDMMYYYY(a.date))
  const sent = paginateSubmissions(sentSubmissions, req, basePath, 'sentPage')

  res.render('mvp-front-office/v5/my-holdings/report-cattle-movement', {
    holding,
    draftSubmissions,
    totalDrafts: draftSubmissions.length,
    sentSubmissions: sent.pagedSubmissions,
    sentPagination: sent.pagination,
    sentShowingFrom: sent.showingFrom,
    sentShowingTo: sent.showingTo,
    totalSent: sent.totalSubmissions
  })
})

router.get('/mvp-front-office/v5/my-holdings/report-cattle-movement/remove-draft', (req, res) => {
  const submission = getMovementSubmissions().find(
    (s) => s.status === 'Draft' && s.reference === req.query.reference
  )

  if (!submission) {
    return res.redirect('/mvp-front-office/v5/my-holdings/report-cattle-movement')
  }

  res.render('mvp-front-office/v5/my-holdings/remove-draft-registration', {
    submission,
    totalLabel: 'Total movements',
    basePath: '/mvp-front-office/v5/my-holdings/report-cattle-movement'
  })
})

router.get('/mvp-front-office/v5/my-holdings/report-cattle-death', (req, res) => {
  const holding = getSelectedHolding(req)
  const basePath = '/mvp-front-office/v5/my-holdings/report-cattle-death'
  const removedDraftReferences = req.session.data.removedDraftReferences || []
  const allSubmissions = getDeathSubmissions().filter(
    (submission) => !removedDraftReferences.includes(submission.reference)
  )

  const draftSubmissions = allSubmissions.filter((submission) => submission.status === 'Draft')
  const sentSubmissions = allSubmissions
    .filter((submission) => submission.status !== 'Draft')
    .sort((a, b) => parseDDMMYYYY(b.date) - parseDDMMYYYY(a.date))
  const sent = paginateSubmissions(sentSubmissions, req, basePath, 'sentPage')

  res.render('mvp-front-office/v5/my-holdings/report-cattle-death', {
    holding,
    draftSubmissions,
    totalDrafts: draftSubmissions.length,
    sentSubmissions: sent.pagedSubmissions,
    sentPagination: sent.pagination,
    sentShowingFrom: sent.showingFrom,
    sentShowingTo: sent.showingTo,
    totalSent: sent.totalSubmissions
  })
})

router.get('/mvp-front-office/v5/my-holdings/report-cattle-death/remove-draft', (req, res) => {
  const submission = getDeathSubmissions().find(
    (s) => s.status === 'Draft' && s.reference === req.query.reference
  )

  if (!submission) {
    return res.redirect('/mvp-front-office/v5/my-holdings/report-cattle-death')
  }

  res.render('mvp-front-office/v5/my-holdings/remove-draft-registration', {
    submission,
    totalLabel: 'Total deaths',
    basePath: '/mvp-front-office/v5/my-holdings/report-cattle-death'
  })
})

router.post('/mvp-front-office/v5/auth/one-login-email', (req, res) => {
  res.redirect('/mvp-front-office/v5/auth/one-login-password')
})

router.post('/mvp-front-office/v5/auth/one-login-password', (req, res) => {
  res.redirect('/mvp-front-office/v5/auth/check-your-phone')
})

router.post('/mvp-front-office/v5/auth/check-your-phone', (req, res) => {
  res.redirect('/mvp-front-office/v5/my-holdings/holding-overview')
})

router.get('/mvp-front-office/v5/my-holdings/holding-details', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v5/my-holdings/holding-details', { holding })
})

router.get('/mvp-front-office/v5/my-holdings/holding-overview', (req, res) => {
  const holding = getSelectedHolding(req)
  const cattleData = req.session.data.livestockSameHerd

  const cattle = cattleData.animals.filter(
    (animal) => animal.status !== 'Deceased' && animal.status !== 'Sold'
  )

  const errorRecordsCount = 3

  res.render('mvp-front-office/v5/my-holdings/holding-overview', { holding, cattle, errorRecordsCount })
})

router.get('/mvp-front-office/v5/my-holdings', (req, res) => {
  const holdingsData = req.session.data.holdingsSingleCph
  const search = String(req.query.search || '').trim().toLowerCase()

  const holdings = holdingsData.holdings.filter((holding) => {
    if (!search) return true

    const searchableValues = [
      holding.cph,
      holding.holdingName,
      holding.businessName,
      holding.address?.addressLine1,
      holding.address?.addressLine2,
      holding.address?.town,
      holding.address?.county,
      holding.address?.postcode,
      holding.status,
      holding.holdingType,
      ...(holding.species || [])
    ]

    return searchableValues.some((value) =>
      String(value || '').toLowerCase().includes(search)
    )
  }).slice(0, 2)

  res.render('mvp-front-office/v5/my-holdings', { holdings, search })
})

router.get('/mvp-front-office/v5/my-holdings/submissions', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v5/my-holdings/submissions', { holding })
})

router.get('/mvp-front-office/v5/my-holdings/cattle-on-holding', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const cattleData = req.session.data.livestockSameHerd
  const holding = getSelectedHolding(req)

  const cattle = cattleData.animals
    .filter((animal) => animal.status !== 'Deceased' && animal.status !== 'Sold')
    .filter((animal) => {
      if (!search) return true
      if (search === 'male' || search === 'female') {
        return String(animal.sex || '').toLowerCase() === search
      }
      const searchableValues = [
        animal.earTagNumber,
        animal.breed?.name,
        animal.breed?.code
      ]
      return searchableValues.some((value) =>
        String(value || '').toLowerCase().includes(search)
      )
    })

  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(cattle.length / pageSize))
  const requestedPage = parseInt(req.query.page, 10) || 1
  const page = Math.min(Math.max(requestedPage, 1), totalPages)

  const pagedCattle = cattle.slice((page - 1) * pageSize, page * pageSize)

  const pageHref = (pageNumber) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', pageNumber)
    return `/mvp-front-office/v5/my-holdings/cattle-on-holding?${params.toString()}`
  }

  const pagination = totalPages > 1 ? {
    previous: page > 1 ? { href: pageHref(page - 1) } : undefined,
    next: page < totalPages ? { href: pageHref(page + 1) } : undefined,
    items: Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => ({
      number: pageNumber,
      current: pageNumber === page,
      href: pageHref(pageNumber)
    }))
  } : null

  const showingFrom = cattle.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, cattle.length)

  res.render('mvp-front-office/v5/my-holdings/cattle-on-holding', {
    cattle: pagedCattle,
    search,
    holding,
    pagination,
    showingFrom,
    showingTo,
    totalCattle: cattle.length
  })
})

router.get('/mvp-front-office/v5/my-holdings/export-animals', (req, res) => {
  const holding = getSelectedHolding(req)
  const exported = req.query.exported === 'true'

  res.render('mvp-front-office/v5/my-holdings/export-animals', { holding, exported })
})

router.post('/mvp-front-office/v5/my-holdings/export-animals', (req, res) => {
  res.redirect('/mvp-front-office/v5/my-holdings/export-animals?exported=true')
})

router.get('/mvp-front-office/v5/my-holdings/animal-error-record', (req, res) => {
  const holding = getSelectedHolding(req)

  const errorRecords = getErrorRecords().map((record) => ({
    ...record,
    referenceNumber: record.id
  }))

  const toDate = (value) => {
    const [day, month, year] = value.split('-')
    return new Date(`${year}-${month}-${day}`)
  }

  const sort = ['oldest', 'newest', 'earTag'].includes(req.query.sort) ? req.query.sort : 'oldest'

  const sortedErrors = [...errorRecords].sort((a, b) => {
    if (sort === 'newest') return toDate(b.dateOfBirth) - toDate(a.dateOfBirth)
    if (sort === 'earTag') return a.earTagNumber.localeCompare(b.earTagNumber)
    return toDate(a.dateOfBirth) - toDate(b.dateOfBirth)
  })

  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(sortedErrors.length / pageSize))
  const requestedPage = parseInt(req.query.page, 10) || 1
  const page = Math.min(Math.max(requestedPage, 1), totalPages)

  const pagedErrors = sortedErrors.slice((page - 1) * pageSize, page * pageSize)

  const pageHref = (pageNumber) => {
    const params = new URLSearchParams()
    params.set('sort', sort)
    params.set('page', pageNumber)
    return `/mvp-front-office/v5/my-holdings/animal-error-record?${params.toString()}`
  }

  const pagination = totalPages > 1 ? {
    previous: page > 1 ? { href: pageHref(page - 1) } : undefined,
    next: page < totalPages ? { href: pageHref(page + 1) } : undefined,
    items: Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => ({
      number: pageNumber,
      current: pageNumber === page,
      href: pageHref(pageNumber)
    }))
  } : null

  const showingFrom = sortedErrors.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, sortedErrors.length)

  res.render('mvp-front-office/v5/my-holdings/animal-error-record', {
    errors: pagedErrors,
    sort,
    pagination,
    showingFrom,
    showingTo,
    totalErrors: sortedErrors.length,
    holding
  })
})

router.get('/mvp-front-office/v5/my-holdings/cattle-error-records', (req, res) => {
  const holding = getSelectedHolding(req)

  const errorRecords = getErrorRecords().map((record) => ({
    ...record,
    referenceNumber: record.id
  }))

  const toDate = (value) => {
    const [day, month, year] = value.split('-')
    return new Date(`${year}-${month}-${day}`)
  }

  const sort = ['oldest', 'newest', 'earTag'].includes(req.query.sort) ? req.query.sort : 'oldest'

  const sortedErrors = [...errorRecords].sort((a, b) => {
    if (sort === 'newest') return toDate(b.dateOfBirth) - toDate(a.dateOfBirth)
    if (sort === 'earTag') return a.earTagNumber.localeCompare(b.earTagNumber)
    return toDate(a.dateOfBirth) - toDate(b.dateOfBirth)
  })

  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(sortedErrors.length / pageSize))
  const requestedPage = parseInt(req.query.page, 10) || 1
  const page = Math.min(Math.max(requestedPage, 1), totalPages)

  const pagedErrors = sortedErrors.slice((page - 1) * pageSize, page * pageSize)

  const pageHref = (pageNumber) => {
    const params = new URLSearchParams()
    params.set('sort', sort)
    params.set('page', pageNumber)
    return `/mvp-front-office/v5/my-holdings/cattle-error-records?${params.toString()}`
  }

  const pagination = totalPages > 1 ? {
    previous: page > 1 ? { href: pageHref(page - 1) } : undefined,
    next: page < totalPages ? { href: pageHref(page + 1) } : undefined,
    items: Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => ({
      number: pageNumber,
      current: pageNumber === page,
      href: pageHref(pageNumber)
    }))
  } : null

  const showingFrom = sortedErrors.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, sortedErrors.length)

  res.render('mvp-front-office/v5/my-holdings/cattle-error-records', {
    errors: pagedErrors,
    sort,
    pagination,
    showingFrom,
    showingTo,
    totalErrors: sortedErrors.length,
    holding
  })
})

router.get('/mvp-front-office/v5/my-holdings/cattle-error-record-detail/:id', (req, res) => {
  const holding = getSelectedHolding(req)

  const record = getErrorRecords().find(
    (r) => r.id.toLowerCase() === req.params.id.toLowerCase()
  )

  if (!record) {
    return res.status(404).send('Animal error record not found')
  }

  res.render('mvp-front-office/v5/my-holdings/cattle-error-record-detail', { record, holding })
})

router.get('/mvp-front-office/v5/my-holdings/activity-history', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v5/my-holdings/activity-history', { holding })
})

router.get('/mvp-front-office/v5/my-holdings/messages', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v5/my-holdings/messages', { holding })
})

router.get('/mvp-front-office/v5/my-holdings/manage-delegates', (req, res) => {
  const holding = getSelectedHolding(req)

  const delegates = [...req.session.data.delegatesSingleCph.delegates]
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))

  res.render('mvp-front-office/v5/my-holdings/manage-delegates', { holding, delegates })
})

router.get('/mvp-front-office/v5/my-holdings/cattle/:earTagNumber', (req, res) => {
  const cattleData = req.session.data.livestockSameHerd
  const holding = getSelectedHolding(req)

  const animal = cattleData.animals.find(
    (a) => a.earTagNumber.toLowerCase() === req.params.earTagNumber.toLowerCase()
  )

  if (!animal) {
    return res.status(404).send('Animal not found')
  }

  const offspring = cattleData.animals.filter(
    (a) => a.dam?.geneticDam?.earTagNumber === animal.earTagNumber
  )

  res.render('mvp-front-office/v5/my-holdings/cattle-details', { animal, offspring, holding })
})

router.get('/mvp-front-office/v5/my-holdings/cattle/:earTagNumber/activity-record', (req, res) => {
  const cattleData = req.session.data.livestockSameHerd
  const holding = getSelectedHolding(req)

  const animal = cattleData.animals.find(
    (a) => a.earTagNumber.toLowerCase() === req.params.earTagNumber.toLowerCase()
  )

  if (!animal) {
    return res.status(404).send('Animal not found')
  }

  // Dummy data for now - a real transaction/movement history data source
  // will replace this once the JSON is built.
  const transactions = [
    { date: '14 March 2023', event: 'Ear tag applied', location: holding.holdingName || holding.cph, recordedBy: 'James Williams' },
    { date: '02 June 2023', event: 'TB test - clear', location: holding.holdingName || holding.cph, recordedBy: 'Dr. A. Fenwick' },
    { date: '18 September 2023', event: 'Weighed', location: holding.holdingName || holding.cph, recordedBy: 'Sheila Jones' },
    { date: '05 January 2024', event: 'Moved off holding (show)', location: 'Cumbria County Show', recordedBy: 'James Williams' },
    { date: '09 January 2024', event: 'Moved on to holding', location: holding.holdingName || holding.cph, recordedBy: 'James Williams' },
    { date: '22 April 2024', event: 'TB test - clear', location: holding.holdingName || holding.cph, recordedBy: 'Dr. A. Fenwick' }
  ]

  res.render('mvp-front-office/v5/my-holdings/cattle-activity-record', { animal, holding, transactions })
})

router.get('/mvp-front-office/v5/my-holdings/pending-registration', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const holding = getSelectedHolding(req)

  const cattle = getPendingRegistrations().filter((animal) => {
    if (!search) return true
    if (search === 'male' || search === 'female') {
      return String(animal.sex || '').toLowerCase() === search
    }
    const searchableValues = [
      animal.earTagNumber,
      animal.breed?.name,
      animal.breed?.code
    ]
    return searchableValues.some((value) =>
      String(value || '').toLowerCase().includes(search)
    )
  })

  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(cattle.length / pageSize))
  const requestedPage = parseInt(req.query.page, 10) || 1
  const page = Math.min(Math.max(requestedPage, 1), totalPages)

  const pagedCattle = cattle.slice((page - 1) * pageSize, page * pageSize)

  const pageHref = (pageNumber) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', pageNumber)
    return `/mvp-front-office/v5/my-holdings/pending-registration?${params.toString()}`
  }

  const pagination = totalPages > 1 ? {
    previous: page > 1 ? { href: pageHref(page - 1) } : undefined,
    next: page < totalPages ? { href: pageHref(page + 1) } : undefined,
    items: Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => ({
      number: pageNumber,
      current: pageNumber === page,
      href: pageHref(pageNumber)
    }))
  } : null

  const showingFrom = cattle.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, cattle.length)

  res.render('mvp-front-office/v5/my-holdings/pending-registration', {
    cattle: pagedCattle,
    search,
    holding,
    pagination,
    showingFrom,
    showingTo,
    totalCattle: cattle.length
  })
})

router.get('/mvp-front-office/v5/my-holdings/pending-validation', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const cattleData = req.session.data.pendingValidation
  const holding = getSelectedHolding(req)

  const cattle = cattleData.animals.filter((animal) => {
    if (!search) return true
    if (search === 'male' || search === 'female') {
      return String(animal.sex || '').toLowerCase() === search
    }
    const searchableValues = [
      animal.earTagNumber,
      animal.breed?.name,
      animal.breed?.code
    ]
    return searchableValues.some((value) =>
      String(value || '').toLowerCase().includes(search)
    )
  })

  const pageSize = 25
  const totalPages = Math.max(1, Math.ceil(cattle.length / pageSize))
  const requestedPage = parseInt(req.query.page, 10) || 1
  const page = Math.min(Math.max(requestedPage, 1), totalPages)

  const pagedCattle = cattle.slice((page - 1) * pageSize, page * pageSize)

  const pageHref = (pageNumber) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', pageNumber)
    return `/mvp-front-office/v5/my-holdings/pending-validation?${params.toString()}`
  }

  const pagination = totalPages > 1 ? {
    previous: page > 1 ? { href: pageHref(page - 1) } : undefined,
    next: page < totalPages ? { href: pageHref(page + 1) } : undefined,
    items: Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => ({
      number: pageNumber,
      current: pageNumber === page,
      href: pageHref(pageNumber)
    }))
  } : null

  const showingFrom = cattle.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, cattle.length)

  res.render('mvp-front-office/v5/my-holdings/pending-validation', {
    cattle: pagedCattle,
    search,
    holding,
    pagination,
    showingFrom,
    showingTo,
    totalCattle: cattle.length
  })
})

module.exports = router
