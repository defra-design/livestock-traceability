const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/movements/version1/sign-in-account', function (request, response) {
  var signIn = request.session.data['signIn']
  if (signIn == "login") {
    response.redirect("/movements/version1/sign-in-account")
  } else {
    response.redirect("/movements/version1b/select-animal")
  }
})

router.post('/movements/version1/recently-used', function (request, response) {
  var destination = request.session.data['destination']
  if (destination == "recent") {
    response.redirect("/movements/version1/recently-used")
  } else if (destination == "cph") {
    response.redirect("/movements/version1/cph-search")
  } else {
    response.redirect("/movements/version1b/manual-search")
  }
})

router.post('/movements/version1/bluetooth-tag-reader', function (request, response) {
  var count = request.session.data['count']
  if (count == "scan") {
    response.redirect("/movements/version1/bluetooth-tag-reader")
  } else if (count == "batch") {
    response.redirect("/movements/version1b/batch")
  } else {
    response.redirect("/movements/version1b/individual-tags")
  }
})

router.post('/movements/version1/check-your-answers', function (request, response) {
  var transport = request.session.data['transport']
  if (transport == "self") {
    response.redirect("/movements/version1/check-your-answers")
  } else {
    response.redirect("/movements/version1/helper-choice")
  }
})

router.post('/movements/version1b/self-move-details', function (request, response) {
  var transportb = request.session.data['transportb']
  if (transportb == "self") {
    response.redirect("/movements/version1b/self-move-details")
  } else {
    response.redirect("/movements/version1b/helper-choice")
  }
})

router.post('/movements/version2/check-recipient-move', function (request, response) {
  var submitted = request.session.data['submitted']
  if (submitted == "submitted") {
    response.redirect("/movements/version2/check-recipient-move")
  } else {
    response.redirect("/movements/version2/movement-date")
  }
})

router.post('/movements/version3/check-recipient-move', function (request, response) {
  var submitted = request.session.data['submitted']
  if (submitted == "submitted") {
    response.redirect("/movements/version3/check-recipient-move")
  } else {
    response.redirect("/movements/version3/movement-from")
  }
})

router.post('/movements/version3/select-vehicle', function (request, response) {
  var submitted = request.session.data['transport']
  if (submitted == "self") {
    response.redirect("/movements/version3/select-vehicle")
  } else {
    response.redirect("/movements/version3/haulier-detail-choice")
  }
})

router.post('/movements/version3/helper-details', function (request, response) {
  var submitted = request.session.data['haulier']
  if (submitted == "yes") {
    response.redirect("/movements/version3/helper-details")
  } else {
    response.redirect("/movements/version3/check-your-answers-minus-haulier")
  }
})

module.exports = router
