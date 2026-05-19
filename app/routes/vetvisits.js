const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/farm-type-answer', function (request, response) {
  var farmtypes = request.session.data['farmtypes'] || []
  if (farmtypes.includes("Beef")) {
    response.redirect("/vetvisits/beef-farm-type")
  } else if (farmtypes.includes("Dairy")) {
    response.redirect("/vetvisits/dairy-farm-type")
  } else if (farmtypes.includes("Sheep")) {
    response.redirect("/vetvisits/sheep-farm-type")
  } else if (farmtypes.includes("Pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/farm-structure")
  }
})

router.post('/beef-farm-type-answer', function (request, response) {
  var farmtypes = request.session.data['farmtypes'] || []
  if (farmtypes.includes("Dairy")) {
    response.redirect("/vetvisits/dairy-farm-type")
  } else if (farmtypes.includes("Sheep")) {
    response.redirect("/vetvisits/sheep-farm-type")
  } else if (farmtypes.includes("Pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/mastitis")
  }
})

router.post('/dairy-farm-type-answer', function (request, response) {
  var farmtypes = request.session.data['farmtypes'] || []
  if (farmtypes.includes("Sheep")) {
    response.redirect("/vetvisits/sheep-farm-type")
  } else if (farmtypes.includes("Pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/check-answers")
  }
})

router.all('/sheep-farm-type-answer', function (request, response) {
  var farmtypes = request.session.data['farmtypes'] || []
  if (farmtypes.includes("Pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/check-answers")
  }
})

router.post('/pigs-farm-type-answer', function (request, response) {
  response.redirect("/vetvisits/check-answers")
})

router.post('/next-step-in-journey', function (req, res) {
  const isCorrect = req.session.data['isCorrectAccount']
  if (isCorrect === 'no') {
    res.redirect('/vetvisits/vet-email')
  } else {
    res.redirect('/vetvisits/farm-assurance-scheme')
  }
})

router.post('/vetvisits/anthelmintic-use-answer', function (req, res) {
  const usedAnthelmintics = req.session.data['anthelmintic-use']
  const anthelminticGroups = req.session.data['anthelmintic-group']
  let errors = []

  if (!usedAnthelmintics) {
    errors.push({
      text: "Select whether you have used anthelmintics in your flock in the last 12 months",
      href: "#anthelmintic-use"
    })
  }

  if (usedAnthelmintics === 'yes' && (!anthelminticGroups || anthelminticGroups.length === 0)) {
    errors.push({
      text: "Select if you have used anthelmintics",
      href: "#anthelmintic-group"
    })
  }

  if (errors.length > 0) {
    return res.render('vetvisits/anthelmintic-use', { errors: errors })
  }

  if (usedAnthelmintics === 'no') {
    delete req.session.data['anthelmintic-group']
    res.redirect('/sheep-farm-type-answer')
  } else {
    res.redirect('/vetvisits/anthelmintic-resistance')
  }
})

router.post('/vetvisits/pig-farm-type-routing', function (req, res) {
  let farmType = req.session.data['pig-farm-type'] || []
  if (typeof farmType === 'string') {
    farmType = [farmType]
  }
  const breedsPigs = farmType.includes('breeder-only') ||
    farmType.includes('breeder-weaner') ||
    farmType.includes('breeder-finisher')
  if (breedsPigs) {
    res.redirect('/vetvisits/pig-survival')
  } else {
    res.redirect('/vetvisits/pig-mobility')
  }
})

router.post('/finisher-answer', function (req, res) {
  const farmType = req.session.data['beef-farm-type']
  if (!farmType) {
    res.redirect('/vetvisits/beef-housing')
    return
  }
  if (farmType.includes('Beef grower')) {
    res.redirect('/vetvisits/bvd-eligibility')
  } else {
    res.redirect('/vetvisits/beef-housing')
  }
})

router.post('/ahwr-date-answer', function (req, res) {
  let ahwrdateanswer = req.body['ahwr-date-answer']
  if (ahwrdateanswer === 'yes') {
    res.redirect('/vetvisitconfirmation/biosecurity-accept')
  } else if (ahwrdateanswer === 'no') {
    res.redirect('/vetvisitconfirmation/rejection')
  } else {
    res.redirect('/vetvisitconfirmation/ahwr-date-accept')
  }
})

router.post('/biosecurity-answer', function (req, res) {
  let biosecurityanswer = req.body['biosecurity-answer']
  if (biosecurityanswer === 'yes') {
    res.redirect('/vetvisitconfirmation/cattle-antibiotics')
  } else if (biosecurityanswer === 'no') {
    res.redirect('/vetvisitconfirmation/rejection')
  } else {
    res.redirect('/vetvisitconfirmation/biosecurity-accept')
  }
})

router.post('/status-answer', function (req, res) {
  const bvdStatus = req.session.data['bvdStatus']
  if (!bvdStatus) {
    const error = {
      text: 'Select a BVD status',
      href: '#bvdStatus'
    }
    return res.render('bvdvetconfirmation/status', {
      errorList: [error],
      bvdStatusError: error
    })
  } else if (bvdStatus === 'positive') {
    res.redirect('/bvdvetconfirmation/confirmation')
  } else {
    res.redirect('/bvdvetconfirmation/change-reason')
  }
})

module.exports = router
