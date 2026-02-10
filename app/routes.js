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

router.post('/version1/cph-search', function(request, response) {

	var destination = request.session.data['destination']
	if (destination == "cph"){
		response.redirect("/version1/cph-search")
	} else {
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
