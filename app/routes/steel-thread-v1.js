const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/steel-thread/v1/one-login-password', (req, res) => {
  res.redirect('/steel-thread/v1/one-login-password')
})

router.post('/steel-thread/v1/gateway-login', (req, res) => {
  res.redirect('/steel-thread/v1/check-your-phone')
})

router.post('/steel-thread/v1/check-your-phone', (req, res) => {
  res.redirect('/steel-thread/v1/holding-information')
})

router.get('/steel-thread/v1/holding-information', (req, res) => {
  const holdingsData = req.session.data.holdingsSingleCph
  const holding = holdingsData.holdings.find((h) => h.id === 'holding-001')

  res.render('steel-thread/v1/holding-information', { holding })
})

router.get('/steel-thread/v1/cattle-register', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const cattleData = req.session.data.livestockSameHerd

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

  res.render('steel-thread/v1/cattle-register', { cattle, search })
})

router.get('/steel-thread/v1/animal-error-record', (req, res) => {
  const errorRecords = [
    {
      earTagNumber: 'UK324537113253',
      dateOfBirth: '12-11-2024',
      dateOfRegistration: '15-11-2024',
      reason: 'Ear tag number does not match the number recorded at birth notification.'
    },
    {
      earTagNumber: 'UK324537119876',
      dateOfBirth: '03-02-2024',
      dateOfRegistration: '10-02-2024',
      reason: 'Date of registration is more than 27 days after date of birth.'
    },
    {
      earTagNumber: 'UK324537128341',
      dateOfBirth: '21-06-2024',
      dateOfRegistration: '25-06-2024',
      reason: 'Dam ear tag number recorded does not exist on the holding register.'
    }
  ]

  res.render('steel-thread/v1/animal-error-record', { errorRecords })
})

router.get('/steel-thread/v1/cattle/:earTagNumber', (req, res) => {
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

  res.render('steel-thread/v1/cattle-details', { animal, offspring })
})

module.exports = router
