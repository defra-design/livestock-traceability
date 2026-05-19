const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/cattle-birth/v2/breed-details-beef', function (request, response) {
  var submitted = request.session.data['calf1prod']
  if (submitted == "beef") {
    response.redirect("/cattle-birth/v2/breed-details-beef")
  } else {
    response.redirect("/cattle-birth/v2/breed-details-dairy")
  }
})

router.post('/cattle-birth/v2/calf-details', function (request, response) {
  var submitted = request.session.data['quantity']
  if (submitted == "multiple") {
    response.redirect("/cattle-birth/v2/add-multi-tags")
  } else {
    response.redirect("/cattle-birth/v2/calf-details")
  }
})

module.exports = router
