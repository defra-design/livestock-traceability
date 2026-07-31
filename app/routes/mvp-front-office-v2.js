const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

function getSelectedHolding(req) {
  const holdingsData = req.session.data.holdingsSingleCph
  const holdingId = req.session.data['holding-id'] || 'holding-001'
  return holdingsData.holdings.find((h) => h.id === holdingId) || holdingsData.holdings[0]
}

router.post('/mvp-front-office/v2/auth/one-login-email', (req, res) => {
  res.redirect('/mvp-front-office/v2/auth/one-login-password')
})

router.post('/mvp-front-office/v2/auth/one-login-password', (req, res) => {
  res.redirect('/mvp-front-office/v2/auth/check-your-phone')
})

router.post('/mvp-front-office/v2/auth/check-your-phone', (req, res) => {
  res.redirect('/mvp-front-office/v2/overview')
})

router.get('/mvp-front-office/v2/my-holdings/holding-details', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v2/my-holdings/holding-details', { holding })
})

router.get('/mvp-front-office/v2/my-holdings/holding-overview', (req, res) => {
  const holding = getSelectedHolding(req)
  const cattleData = req.session.data.livestockSameHerd

  const cattle = cattleData.animals.filter(
    (animal) => animal.status !== 'Deceased' && animal.status !== 'Sold'
  )

  const errorRecordsCount = 3

  res.render('mvp-front-office/v2/my-holdings/holding-overview', { holding, cattle, errorRecordsCount })
})

router.get('/mvp-front-office/v2/my-holdings', (req, res) => {
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
  })

  res.render('mvp-front-office/v2/my-holdings', { holdings, search })
})

router.get('/mvp-front-office/v2/my-holdings/submissions', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v2/my-holdings/submissions', { holding })
})

router.get('/mvp-front-office/v2/my-holdings/animals-on-holding', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const cattleData = req.session.data.livestockSameHerd
  const holding = getSelectedHolding(req)

  const cattle = cattleData.animals
    .filter((animal) => animal.status !== 'Deceased' && animal.status !== 'Sold')
    .filter((animal) => {
      if (!search) return true
      const searchableValues = [
        animal.cph,
        animal.earTagNumber,
        animal.dateOfBirth,
        animal.sex,
        animal.breed?.name,
        animal.breed?.code,
        animal.status,
        animal.dam?.geneticDam?.earTagNumber,
        animal.dam?.surrogateDam?.earTagNumber,
        animal.sire?.earTagNumber,
        animal.sire?.name
      ]
      return searchableValues.some((value) =>
        String(value || '').toLowerCase().includes(search)
      )
    })

  res.render('mvp-front-office/v2/my-holdings/animals-on-holding', { cattle, search, holding })
})

router.get('/mvp-front-office/v2/my-holdings/export-animals', (req, res) => {
  const holding = getSelectedHolding(req)
  const exported = req.query.exported === 'true'

  res.render('mvp-front-office/v2/my-holdings/export-animals', { holding, exported })
})

router.post('/mvp-front-office/v2/my-holdings/export-animals', (req, res) => {
  res.redirect('/mvp-front-office/v2/my-holdings/export-animals?exported=true')
})

router.get('/mvp-front-office/v2/my-holdings/animal-error-record', (req, res) => {
  const holding = getSelectedHolding(req)

  const errorRecords = [
    {
      earTagNumber: 'UK324537467886',
      dateOfBirth: '09-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The date of birth you have entered is over the 27-day deadline to report a calf birth.',
      evidence: 'You may be required to provide a written explanation describing why the birth could not be reported within the allotted time.'
    },
    {
      earTagNumber: 'UK324537467887',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The genetic dam you have entered has given birth in the last 240 days.',
      evidence: 'You may be required to provide documentary evidence or DNA parentage testing.'
    },
    {
      earTagNumber: 'UK324537467888',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The genetic dam you have entered is over 20 years old.',
      evidence: 'You may be required to provide a signed declaration from your veterinarian or breed society.'
    }
  ]

  res.render('mvp-front-office/v2/my-holdings/animal-error-record', { errorRecords, holding })
})

router.get('/mvp-front-office/v2/my-holdings/activity-history', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v2/my-holdings/activity-history', { holding })
})

router.get('/mvp-front-office/v2/my-holdings/messages', (req, res) => {
  const holding = getSelectedHolding(req)

  res.render('mvp-front-office/v2/my-holdings/messages', { holding })
})

router.get('/mvp-front-office/v2/my-holdings/manage-delegates', (req, res) => {
  const holding = getSelectedHolding(req)

  const delegates = [...req.session.data.delegatesSingleCph.delegates]
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))

  res.render('mvp-front-office/v2/my-holdings/manage-delegates', { holding, delegates })
})

router.get('/mvp-front-office/v2/my-holdings/cattle/:earTagNumber', (req, res) => {
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

  res.render('mvp-front-office/v2/my-holdings/animal-details', { animal, offspring })
})

module.exports = router
