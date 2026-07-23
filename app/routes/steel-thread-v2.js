const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/steel-thread/v2/one-login-email', (req, res) => {
  const emailAddress = (req.body['email-address'] || '').trim()
  const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)

  if (!emailAddress) {
    return res.render('steel-thread/v2/one-login-email', {
      errors: { 'email-address': 'Enter your email address' }
    })
  }

  if (!isValidFormat) {
    return res.render('steel-thread/v2/one-login-email', {
      errors: { 'email-address': 'Enter an email address in the correct format, like name@example.com' }
    })
  }

  res.redirect('/steel-thread/v2/one-login-password')
})

router.post('/steel-thread/v2/auth-2', (req, res) => {
  const serviceUserType = req.body['service-user-type']

  if (serviceUserType === 'personal') {
    return res.redirect('/steel-thread/v2/auth-4')
  }

  if (serviceUserType === 'business') {
    return res.redirect('/steel-thread/v2/auth-3')
  }

  res.redirect('/steel-thread/v2/auth-2')
})

router.post('/steel-thread/v2/auth-3', (req, res) => {
  res.redirect('/steel-thread/v2/auth-5')
})

router.post('/steel-thread/v2/auth-4', (req, res) => {
  res.redirect('/steel-thread/v2/auth-5')
})

router.post('/steel-thread/v2/auth-5', (req, res) => {
  const firstName = (req.body['first-name'] || '').trim()
  const lastName = (req.body['last-name'] || '').trim()
  const errors = {}

  if (!firstName) {
    errors['first-name'] = 'Enter your first name'
  }

  if (!lastName) {
    errors['last-name'] = 'Enter your last name'
  }

  if (Object.keys(errors).length > 0) {
    return res.render('steel-thread/v2/auth-5', { errors })
  }

  res.redirect('/steel-thread/v2/auth-5b')
})

router.post('/steel-thread/v2/auth-5b', (req, res) => {
  const phoneNumber = (req.body['phone-number'] || '').trim()
  const isValidFormat = /^[0-9+\s()-]{7,20}$/.test(phoneNumber)

  if (!phoneNumber) {
    return res.render('steel-thread/v2/auth-5b', {
      errors: { 'phone-number': 'Enter your phone number' }
    })
  }

  if (!isValidFormat) {
    return res.render('steel-thread/v2/auth-5b', {
      errors: { 'phone-number': 'Enter a phone number in the correct format' }
    })
  }

  const serviceUserType = req.session.data['service-user-type']

  if (serviceUserType === 'personal') {
    return res.redirect('/steel-thread/v2/auth-check-details')
  }

  res.redirect('/steel-thread/v2/auth-6')
})

router.post('/steel-thread/v2/auth-6', (req, res) => {
  const organisationRegisteredWith = req.body['organisation-registered-with']

  if (organisationRegisteredWith === 'neither') {
    return res.redirect('/steel-thread/v2/auth-6a')
  }

  res.redirect('/steel-thread/v2/auth-7')
})

router.post('/steel-thread/v2/auth-6a', (req, res) => {
  res.redirect('/steel-thread/v2/auth-6b')
})

router.post('/steel-thread/v2/auth-6b', (req, res) => {
  res.redirect('/steel-thread/v2/auth-6c')
})

router.post('/steel-thread/v2/auth-6c', (req, res) => {
  const hasUkAddress = req.body['organisation-has-uk-address']

  if (hasUkAddress === 'no') {
    return res.redirect('/steel-thread/v2/auth-6f')
  }

  res.redirect('/steel-thread/v2/auth-6d')
})

router.post('/steel-thread/v2/auth-6d', (req, res) => {
  res.redirect('/steel-thread/v2/auth-6dd')
})

router.post('/steel-thread/v2/auth-6dd', (req, res) => {
  res.redirect('/steel-thread/v2/auth-10')
})

router.post('/steel-thread/v2/auth-6e', (req, res) => {
  res.redirect('/steel-thread/v2/auth-10')
})

router.post('/steel-thread/v2/auth-6f', (req, res) => {
  res.redirect('/steel-thread/v2/auth-10')
})

router.post('/steel-thread/v2/auth-10', (req, res) => {
  const usePersonalDetails = req.body['use-personal-details'] === 'use-personal-details'
  const phoneNumber = (req.body['organisation-phone-number'] || '').trim()
  const email = (req.body['organisation-email'] || '').trim()
  const hasBothFields = Boolean(phoneNumber && email)

  if (!usePersonalDetails && !hasBothFields) {
    const message = 'Select the checkbox to use your personal details, or enter both a phone number and email address for the organisation'

    return res.render('steel-thread/v2/auth-10', {
      errors: {
        'use-personal-details': message,
        'organisation-phone-number': message,
        'organisation-email': message
      }
    })
  }

  if (usePersonalDetails) {
    req.session.data['organisation-phone-number'] = req.session.data['phone-number']
    req.session.data['organisation-email'] = req.session.data['email-address']
  }

  res.redirect('/steel-thread/v2/auth-check-details')
})

router.post('/steel-thread/v2/auth-7', (req, res) => {
  res.redirect('/steel-thread/v2/auth-8')
})

router.post('/steel-thread/v2/auth-8', (req, res) => {
  const confirmBusiness = req.body['confirm-business']

  if (confirmBusiness === 'no') {
    return res.redirect('/steel-thread/v2/auth-7')
  }

  if (confirmBusiness === 'yes') {
    return res.redirect('/steel-thread/v2/auth-check-details')
  }

  res.redirect('/steel-thread/v2/auth-8')
})

router.post('/steel-thread/v2/auth-check-details', (req, res) => {
  res.redirect('/steel-thread/v2/auth-15')
})

router.get('/steel-thread/v2/auth-check-details', (req, res) => {
  const data = req.session.data
  const tookManualOrganisationRoute = data['organisation-registered-with'] === 'neither'
  const hasOrganisationContactDetails = Boolean(data['organisation-phone-number'] || data['organisation-email'])

  if (tookManualOrganisationRoute && !hasOrganisationContactDetails) {
    return res.redirect('/steel-thread/v2/auth-10')
  }

  res.render('steel-thread/v2/auth-check-details')
})

router.post('/steel-thread/v2/auth-15', (req, res) => {
  res.redirect('/steel-thread/v2/holding-details')
})

router.post('/steel-thread/v2/gateway-login', (req, res) => {
  res.redirect('/steel-thread/v2/check-your-phone')
})

router.post('/steel-thread/v2/check-your-phone', (req, res) => {
  res.redirect('/steel-thread/v2/auth-2')
})

router.get('/steel-thread/v2/holding-details', (req, res) => {
  const holdingsData = req.session.data.holdingsSingleCph
  const holding = holdingsData.holdings.find((h) => h.id === 'holding-001')

  res.render('steel-thread/v2/holding-details', { holding })
})

router.get('/steel-thread/v2/animals-on-holding', (req, res) => {
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

  res.render('steel-thread/v2/animals-on-holding', { cattle, search })
})

router.get('/steel-thread/v2/animal-error-record', (req, res) => {
  const errorRecords = [
    {
      earTagNumber: 'UK324537467886',
      dateOfBirth: '09-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The date of birth you have entered is over the 27-day deadline to report a calf birth.'
    },
    {
      earTagNumber: 'UK324537467887',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The genetic dam you have entered has given birth in the last 240 days.'
    },
    {
      earTagNumber: 'UK324537467888',
      dateOfBirth: '29-07-2025',
      dateOfRegistration: '10-08-2025',
      reason: 'The genetic dam you have entered is over 20 years old.'
    }
  ]

  res.render('steel-thread/v2/animal-error-record', { errorRecords })
})

router.get('/steel-thread/v2/cattle/:earTagNumber', (req, res) => {
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

  res.render('steel-thread/v2/animal-details', { animal, offspring })
})

module.exports = router
