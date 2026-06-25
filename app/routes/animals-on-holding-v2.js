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

router.get('/animals-on-holding/v2/holdings/:id/holding-details', (req, res) => {
  const holdingsData = req.session.data.holdings
  const holding = holdingsData.holdings.find((h) => h.id === req.params.id)

  if (!holding) {
    return res.status(404).send('Holding not found')
  }

  res.render('animals-on-holding/v2/holding-details-info', { holding })
})

const allDelegates = [
  { email: 'j.smith@farmholdings.co.uk', role: 'Owner', status: 'Active' },
  { email: 'a.jones@agriservices.com', role: 'Keeper', status: 'Active' },
  { email: 'm.brown@ruralconsult.co.uk', role: 'Agent', status: 'Invited' },
  { email: 'l.wilson@countryfarming.org', role: 'Keeper', status: 'Invited' },
  { email: 'r.taylor@livestockmgt.net', role: 'Agent', status: 'Active' }
]

router.get('/animals-on-holding/v2/holdings/:id/manage-delegates', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  const search = String(req.query.search || '').trim().toLowerCase()
  const delegates = allDelegates.filter((delegate) => {
    if (!search) return true
    return [delegate.email, delegate.role, delegate.status].some(
      (value) => String(value || '').toLowerCase().includes(search)
    )
  })
  res.render('animals-on-holding/v2/holding-details-delegates', { holding, delegates, search })
})

router.get('/animals-on-holding/v2/holdings/:id/add-delegate', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  res.render('animals-on-holding/v2/delegates-add', { holding })
})

router.post('/animals-on-holding/v2/holdings/:id/add-delegate', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  if (!req.session.data['email-address'] || !req.session.data['email-address'].trim()) {
    return res.render('animals-on-holding/v2/delegates-add', {
      holding,
      errors: [{ text: 'Enter an email address', href: '#email-address' }]
    })
  }
  res.redirect(`/animals-on-holding/v2/holdings/${req.params.id}/delegate-account-info`)
})

router.get('/animals-on-holding/v2/holdings/:id/delegate-account-info', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  res.render('animals-on-holding/v2/delegates-account-info', { holding })
})

router.post('/animals-on-holding/v2/holdings/:id/delegate-account-info', (req, res) => {
  res.redirect(`/animals-on-holding/v2/holdings/${req.params.id}/check-details`)
})

router.get('/animals-on-holding/v2/holdings/:id/check-details', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  res.render('animals-on-holding/v2/delegates-check-details', { holding })
})

router.post('/animals-on-holding/v2/holdings/:id/check-details', (req, res) => {
  const delegates = req.session.data.delegates || []
  delegates.push({ email: req.session.data['email-address'] })
  req.session.data.delegates = delegates
  req.session.data.confirmedDelegateEmail = req.session.data['email-address']
  res.redirect(`/animals-on-holding/v2/holdings/${req.params.id}/confirmation`)
})

router.get('/animals-on-holding/v2/holdings/:id/confirmation', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  res.render('animals-on-holding/v2/delegates-confirmation', { holding })
})

router.post('/animals-on-holding/v2/holdings/:id/confirmation', (req, res) => {
  delete req.session.data['email-address']
  res.redirect(`/animals-on-holding/v2/holdings/${req.params.id}/manage-delegates`)
})

router.get('/animals-on-holding/v2/holdings/:id/manage-delegate', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  const index = parseInt(req.query.index) || 0
  const delegates = req.session.data.delegates || []
  req.session.data.currentDelegateIndex = index
  req.session.data.currentDelegate = delegates[index] || null
  res.render('animals-on-holding/v2/delegates-manage', { holding })
})

router.get('/animals-on-holding/v2/holdings/:id/change-role', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  res.render('animals-on-holding/v2/delegates-change-role', { holding })
})

router.post('/animals-on-holding/v2/holdings/:id/change-role', (req, res) => {
  const index = req.session.data.currentDelegateIndex
  const delegates = req.session.data.delegates || []
  if (delegates[index]) {
    delegates[index].role = req.session.data['delegate-role']
    req.session.data.delegates = delegates
    req.session.data.currentDelegate = delegates[index]
  }
  res.redirect(`/animals-on-holding/v2/holdings/${req.params.id}/manage-delegate?index=${index}`)
})

router.get('/animals-on-holding/v2/holdings/:id/remove-delegate', (req, res) => {
  const holding = req.session.data.holdings.holdings.find((h) => h.id === req.params.id)
  if (!holding) return res.status(404).send('Holding not found')
  res.render('animals-on-holding/v2/delegates-remove', { holding })
})

router.post('/animals-on-holding/v2/holdings/:id/remove-delegate', (req, res) => {
  const index = req.session.data.currentDelegateIndex
  const delegates = req.session.data.delegates || []
  if (index !== undefined && index !== null) {
    delegates.splice(index, 1)
    req.session.data.delegates = delegates
  }
  res.redirect(`/animals-on-holding/v2/holdings/${req.params.id}/manage-delegates`)
})

module.exports = router
