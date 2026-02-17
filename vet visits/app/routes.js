//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// 1. Initial Branching Logic
// Check specific options in order: Beef -> Dairy -> Sheep -> Pigs
router.post('/farm-type-answer', function(request, response) {
  
  // Use '|| []' to handle the case where farmtypes is undefined (no boxes checked)
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("beef")) {
    response.redirect("/beef-farm-type")
  } else if (farmtypes.includes("dairy")) {
    response.redirect("/dairy-farm-type")
  } else if (farmtypes.includes("sheep")) {
    response.redirect("/sheep-farm-type")
  } else if (farmtypes.includes("pigs")) {
    response.redirect("/pigs-farm-type")
  } else {
    response.redirect("/farm-structure") // Redirect back to the same page if no options are selected
  }
})

// 2. Logic after 'Beef' page is submitted
// Check remaining options: Dairy -> Sheep -> Pigs
router.post('/beef-farm-type-answer', function(request, response) {
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("dairy")) {
    response.redirect("/dairy-farm-type")
  } else if (farmtypes.includes("sheep")) {
    response.redirect("/sheep-farm-type")
  } else if (farmtypes.includes("pigs")) {
    response.redirect("/pigs-farm-type")
  } else {
    response.redirect("/check-answers")
  }
})

// 3. Logic after 'Dairy' page is submitted
// Check remaining options: Sheep -> Pigs
router.post('/dairy-farm-type-answer', function(request, response) {
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("sheep")) {
    response.redirect("/sheep-farm-type")
  } else if (farmtypes.includes("pigs")) {
    response.redirect("/pigs-farm-type")
  } else {
    response.redirect("/check-answers")
  }
})

// 4. Logic after 'Sheep' page is submitted
// Check remaining options: Pigs
router.post('/sheep-farm-type-answer', function(request, response) {
  var farmtypes = request.session.data['farmtypes'] || []

  if (farmtypes.includes("pigs")) {
    response.redirect("/pigs-farm-type")
  } else {
    response.redirect("/check-answers")
  }
})

// 5. Logic after 'Pigs' page is submitted
// End of chain
router.post('/pigs-farm-type-answer', function(request, response) {
  response.redirect("/check-answers")
})

module.exports = router