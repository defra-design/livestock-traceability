const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('/animals-on-holding/v2/start', (req, res) => {
  const holdingsData = req.session.data.holdings
  const search = String(req.query.search || '').trim().toLowerCase()

  const holdings = holdingsData.holdings.filter((holding) => {
    if (!search) return true
    const searchableValues = [
      holding.cph,
      holding.holdingName,
      holding.address?.town,
      holding.address?.county,
      holding.address?.postcode,
      holding.status,
      ...(holding.species || [])
    ]
    return searchableValues.some((value) =>
      String(value || '').toLowerCase().includes(search)
    )
  })

  res.render('animals-on-holding/v2/start', { holdings: holdings.slice(0, 5), search })
})

router.get('/animals-on-holding/v2/cattle', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase()
  const cattleData = req.session.data.livestock

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

  const firstActive = cattle.find((a) => a.status === 'Active')

  res.render('animals-on-holding/v2/cattle', { cattle, search, firstActiveEarTag: firstActive?.earTagNumber })
})

router.get('/animals-on-holding/v2/cattle/:earTagNumber', (req, res) => {
  const cattleData = req.session.data.livestock

  const animal = cattleData.animals.find(
    (a) => a.earTagNumber.toLowerCase() === req.params.earTagNumber.toLowerCase()
  )

  if (!animal) {
    return res.status(404).send('Animal not found')
  }

  const offspring = cattleData.animals.filter(
    (a) => a.dam?.geneticDam?.earTagNumber === animal.earTagNumber
  )

  res.render('animals-on-holding/v2/cattle-details', { animal, offspring })
})

router.get('/animals-on-holding/v2/holdings/:id', (req, res) => {
  const holdingsData = req.session.data.holdings
  const holding = holdingsData.holdings.find((h) => h.id === req.params.id)

  if (!holding) {
    return res.status(404).send('Holding not found')
  }

  res.render('animals-on-holding/v2/holding-details', { holding })
})

module.exports = router
