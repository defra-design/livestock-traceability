const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/steel-thread/v3/one-login-email', (req, res) => {
  res.redirect('/steel-thread/v3/one-login-password')
})

router.post('/steel-thread/v3/auth-2', (req, res) => {
  const serviceUserType = req.body['service-user-type']

  if (serviceUserType === 'personal') {
    return res.redirect('/steel-thread/v3/auth-4')
  }

  if (serviceUserType === 'business') {
    return res.redirect('/steel-thread/v3/auth-3')
  }

  res.redirect('/steel-thread/v3/auth-2')
})

router.post('/steel-thread/v3/auth-3', (req, res) => {
  res.redirect('/steel-thread/v3/auth-5')
})

router.post('/steel-thread/v3/auth-4', (req, res) => {
  res.redirect('/steel-thread/v3/auth-5')
})

router.post('/steel-thread/v3/auth-5', (req, res) => {
  res.redirect('/steel-thread/v3/auth-5b')
})

router.post('/steel-thread/v3/auth-5b', (req, res) => {
  const serviceUserType = req.session.data['service-user-type']

  if (serviceUserType === 'personal') {
    return res.redirect('/steel-thread/v3/auth-check-details')
  }

  res.redirect('/steel-thread/v3/auth-6')
})

router.post('/steel-thread/v3/auth-6', (req, res) => {
  const organisationRegisteredWith = req.body['organisation-registered-with']

  if (organisationRegisteredWith === 'neither') {
    return res.redirect('/steel-thread/v3/auth-6a')
  }

  res.redirect('/steel-thread/v3/auth-7')
})

router.post('/steel-thread/v3/auth-6a', (req, res) => {
  res.redirect('/steel-thread/v3/auth-6b')
})

router.post('/steel-thread/v3/auth-6b', (req, res) => {
  res.redirect('/steel-thread/v3/auth-6c')
})

router.post('/steel-thread/v3/auth-6c', (req, res) => {
  const hasUkAddress = req.body['organisation-has-uk-address']

  if (hasUkAddress === 'no') {
    return res.redirect('/steel-thread/v3/auth-6f')
  }

  res.redirect('/steel-thread/v3/auth-6d')
})

router.post('/steel-thread/v3/auth-6d', (req, res) => {
  res.redirect('/steel-thread/v3/auth-6dd')
})

router.post('/steel-thread/v3/auth-6dd', (req, res) => {
  res.redirect('/steel-thread/v3/auth-10')
})

router.post('/steel-thread/v3/auth-6e', (req, res) => {
  res.redirect('/steel-thread/v3/auth-10')
})

router.post('/steel-thread/v3/auth-6f', (req, res) => {
  res.redirect('/steel-thread/v3/auth-10')
})

router.post('/steel-thread/v3/auth-10', (req, res) => {
  const usePersonalDetails = req.body['use-personal-details'] === 'use-personal-details'

  if (usePersonalDetails) {
    req.session.data['organisation-phone-number'] = req.session.data['phone-number']
    req.session.data['organisation-email'] = req.session.data['email-address']
  }

  res.redirect('/steel-thread/v3/auth-check-details')
})

router.post('/steel-thread/v3/auth-7', (req, res) => {
  res.redirect('/steel-thread/v3/auth-8')
})

router.post('/steel-thread/v3/auth-8', (req, res) => {
  const confirmBusiness = req.body['confirm-business']

  if (confirmBusiness === 'no') {
    return res.redirect('/steel-thread/v3/auth-7')
  }

  if (confirmBusiness === 'yes') {
    return res.redirect('/steel-thread/v3/auth-check-details')
  }

  res.redirect('/steel-thread/v3/auth-8')
})

router.post('/steel-thread/v3/auth-check-details', (req, res) => {
  res.redirect('/steel-thread/v3/auth-15')
})

router.get('/steel-thread/v3/auth-check-details', (req, res) => {
  const data = req.session.data
  const tookManualOrganisationRoute = data['organisation-registered-with'] === 'neither'
  const hasOrganisationContactDetails = Boolean(data['organisation-phone-number'] || data['organisation-email'])

  if (tookManualOrganisationRoute && !hasOrganisationContactDetails) {
    return res.redirect('/steel-thread/v3/auth-10')
  }

  res.render('steel-thread/v3/auth-check-details')
})

router.post('/steel-thread/v3/auth-15', (req, res) => {
  res.redirect('/steel-thread/v3/holding-details')
})

router.post('/steel-thread/v3/gateway-login', (req, res) => {
  res.redirect('/steel-thread/v3/check-your-phone')
})

router.post('/steel-thread/v3/check-your-phone', (req, res) => {
  res.redirect('/steel-thread/v3/auth-2')
})

router.get('/steel-thread/v3/holding-details', (req, res) => {
  const holdingsData = req.session.data.holdingsSingleCph
  const holding = holdingsData.holdings.find((h) => h.id === 'holding-001')

  res.render('steel-thread/v3/holding-details', { holding })
})

router.get('/steel-thread/v3/animals-on-holding', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const cattleData = req.session.data.livestockSameHerd
  const holdingsData = req.session.data.holdingsSingleCph
  const holding = holdingsData.holdings.find((h) => h.id === 'holding-001')

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
    return `/steel-thread/v3/animals-on-holding?${params.toString()}`
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

  res.render('steel-thread/v3/animals-on-holding', {
    cattle: pagedCattle,
    search,
    holding,
    pagination,
    showingFrom,
    showingTo,
    totalCattle: cattle.length
  })
})

router.get('/steel-thread/v3/animal-error-record', (req, res) => {
  const holdingsData = req.session.data.holdingsSingleCph
  const holding = holdingsData.holdings.find((h) => h.id === 'holding-001')

  const errorRecords = [
    {
      referenceNumber: 'ERR-000123',
      earTagNumber: 'UK324537467886',
      dateOfBirth: '09-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The date of birth you have entered is over the 27-day deadline to report a calf birth.',
      evidence: 'You may be required to provide a written explanation describing why the birth could not be reported within the allotted time.',
      status: 'Rejected'
    },
    {
      referenceNumber: 'ERR-000124',
      earTagNumber: 'UK324537467887',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The genetic dam you have entered has given birth in the last 240 days.',
      evidence: 'You may be required to provide documentary evidence or DNA parentage testing.',
      status: 'Resolved'
    },
    {
      referenceNumber: 'ERR-000125',
      earTagNumber: 'UK324537467886',
      dateOfBirth: '09-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The genetic dam you have entered is over 20 years old.',
      evidence: 'You may be required to provide a signed declaration from your veterinarian or breed society.',
      status: 'Pending'
    }
  ]

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
    return `/steel-thread/v3/animal-error-record?${params.toString()}`
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

  res.render('steel-thread/v3/animal-error-record', {
    errors: pagedErrors,
    sort,
    pagination,
    showingFrom,
    showingTo,
    totalErrors: sortedErrors.length,
    holding
  })
})

router.get('/steel-thread/v3/cattle/:earTagNumber', (req, res) => {
  const cattleData = req.session.data.livestockSameHerd

  const animal = cattleData.animals.find(
    (a) => a.earTagNumber.toLowerCase() === req.params.earTagNumber.toLowerCase()
  )

  if (!animal) {
    return res.status(404).send('Animal not found')
  }

  const offspring = cattleData.animals.filter(
    (a) => a.dam?.geneticDam?.earTagNumber === animal.earTagNumber
  )

  res.render('steel-thread/v3/animal-details', { animal, offspring })
})

module.exports = router
