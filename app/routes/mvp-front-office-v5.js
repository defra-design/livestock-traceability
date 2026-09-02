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
      id: 'AER-48213',
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
      id: 'AER-59027',
      earTagNumber: 'UK324537467887',
      date: '12-08-2025',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      category: 'Dam calving interval',
      reason: 'The genetic dam appears to have given birth in the past 240 days.',
      evidence: 'You may be required to provide documentary evidence or DNA parentage testing.',
      status: 'In review'
    },
    {
      id: 'AER-61984',
      earTagNumber: 'UK324537467888',
      date: '13-08-2025',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      category: 'Dam age',
      reason: 'The genetic dam appears to be under 15-months old',
      evidence: 'You may be required to provide a signed declaration from your veterinarian or breed society.',
      status: 'Approved'
    }
  ]
}

router.post('/mvp-front-office/v5/auth/one-login-email', (req, res) => {
  res.redirect('/mvp-front-office/v5/auth/one-login-password')
})

router.post('/mvp-front-office/v5/auth/one-login-password', (req, res) => {
  res.redirect('/mvp-front-office/v5/auth/check-your-phone')
})

router.post('/mvp-front-office/v5/auth/check-your-phone', (req, res) => {
  res.redirect('/mvp-front-office/v5/overview')
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
  }).slice(0, 1)

  res.render('mvp-front-office/v5/my-holdings', { holdings, search })
})

router.get('/mvp-front-office/v5/my-holdings/submissions', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v5/my-holdings/submissions', { holding })
})

router.get('/mvp-front-office/v5/my-holdings/animals-on-holding', (req, res) => {
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
    return `/mvp-front-office/v5/my-holdings/animals-on-holding?${params.toString()}`
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

  res.render('mvp-front-office/v5/my-holdings/animals-on-holding', {
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

router.get('/mvp-front-office/v5/my-holdings/animal-error-record/:id', (req, res) => {
  const holding = getSelectedHolding(req)

  const record = getErrorRecords().find(
    (r) => r.id.toLowerCase() === req.params.id.toLowerCase()
  )

  if (!record) {
    return res.status(404).send('Animal error record not found')
  }

  res.render('mvp-front-office/v5/my-holdings/animal-error-record-detail', { record, holding })
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

  res.render('mvp-front-office/v5/my-holdings/animal-details', { animal, offspring, holding })
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

  res.render('mvp-front-office/v5/my-holdings/animal-activity-record', { animal, holding, transactions })
})

module.exports = router
