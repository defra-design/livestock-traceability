const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/steel-thread/v1/one-login-password', (req, res) => {
  res.redirect('/steel-thread/v1/one-login-password')
})

router.post('/steel-thread/v1/gateway-login', (req, res) => {
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
