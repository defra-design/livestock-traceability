//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// SGD routes

router.post('/version1/sign-in-account', function(request, response) {

	var signIn = request.session.data['signIn']
	if (signIn == "login"){
		response.redirect("/version1/sign-in-account")
	} else {
		response.redirect("/version1b/select-animal")
	}
})

router.post('/version1/recently-used', function(request, response) {

	var destination = request.session.data['destination']
	if (destination == "recent"){
		response.redirect("/version1/recently-used")
	} 
	else if (destination == "cph"){
		response.redirect("/version1/cph-search")
	}
	else {
		response.redirect("/version1b/manual-search")
	}
})

router.post('/version1/bluetooth-tag-reader', function(request, response) {

	var count = request.session.data['count']
	if (count == "scan"){
		response.redirect("/version1/bluetooth-tag-reader")
	} 
	else if (count == "batch"){
		response.redirect("/version1b/batch")
	}
	else {
		response.redirect("/version1b/individual-tags")
	}
})

router.post('/version1/check-your-answers', function(request, response) {

	var transport = request.session.data['transport']
	if (transport == "self"){
		response.redirect("/version1/check-your-answers")
	} 
	else {
		response.redirect("/version1/helper-choice")
	}
})

router.post('/version1b/self-move-details', function(request, response) {

	var transportb = request.session.data['transportb']
	if (transportb == "self"){
		response.redirect("/version1b/self-move-details")
	} 
	else {
		response.redirect("/version1b/helper-choice")
	}
})

// Vet visits routes

// 1. Initial Branching Logic
// Check specific options in order: Beef -> Dairy -> Sheep -> Pigs
router.post('/farm-type-answer', function(request, response) {
  
  // Use '|| []' to handle the case where farmtypes is undefined (no boxes checked)
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("beef")) {
    response.redirect("/vetvisits/beef-farm-type")
  } else if (farmtypes.includes("dairy")) {
    response.redirect("/vetvisits/dairy-farm-type")
  } else if (farmtypes.includes("sheep")) {
    response.redirect("/vetvisits/sheep-farm-type")
  } else if (farmtypes.includes("pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/farm-structure") // Redirect back to the same page if no options are selected
  }
})

// 2. Logic after 'Beef' page is submitted
// Check remaining options: Dairy -> Sheep -> Pigs
router.post('/beef-farm-type-answer', function(request, response) {
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("dairy")) {
    response.redirect("/vetvisits/dairy-farm-type")
  } else if (farmtypes.includes("sheep")) {
    response.redirect("/vetvisits/sheep-farm-type")
  } else if (farmtypes.includes("pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/mastitis")
  }
})

// 3. Logic after 'Dairy' page is submitted
// Check remaining options: Sheep -> Pigs
router.post('/dairy-farm-type-answer', function(request, response) {
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("sheep")) {
    response.redirect("/vetvisits/sheep-farm-type")
  } else if (farmtypes.includes("pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/check-answers")
  }
})

// 4. Logic after 'Sheep' page is submitted
// Check remaining options: Pigs
router.post('/sheep-farm-type-answer', function(request, response) {
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("pigs")) {
    response.redirect("/vetvisits/pigs-farm-type")
  } else {
    response.redirect("/vetvisits/check-answers")
  }
})

// 5. Logic after 'Pigs' page is submitted
// End of chain
router.post('/pigs-farm-type-answer', function(request, response) {
  response.redirect("/vetvisits/check-answers")
})

router.post('/next-step-in-journey', function (req, res) {
  // Get the answer from session data
  const isCorrect = req.session.data['isCorrectAccount']

  if (isCorrect === 'no') {
    // Send them back to the search page if it's wrong
    res.redirect('/vetvisits/rcvs-number')
  } else {
    // Send them to the next step if it's right
    res.redirect('/vetvisits/farm-assurance-scheme')
  }
})

module.exports = router