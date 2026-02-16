//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

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