 'use strict'

// Version 2: small happy-path routes, retaining the original page design.
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const BASE = '/evolution/record-full-movement-v2'
const VIEW = 'evolution/record-full-movement-v2/'
// use session to keep each session data independent from other versions and other teams data.
const SESSION = 'recordFullMovementV2'
const SENDER = { name: 'Oakfield Farm', cph: '37/123/4567', address: 'Oakfield Lane, Exampleton, EX1 2AB' }

//look up for locations
const LOCATIONS = [
  { id: 'hilltop', type: 'holding', name: 'Hilltop Farm', identifier: '56/312/0056', idLabel: 'CPH number', address: 'Mill Lane, Exampleton, EX2 3CD', status: 'active' },
  { id: 'brook', type: 'holding', name: 'Brook Farm', identifier: '15/628/0067', idLabel: 'CPH number', address: 'High Road, Exampleton, EX2 4DE' , status: 'active'},
  { id: 'closed-holding', type: 'holding', name: 'Old Manor Farm', identifier: '12/345/9999', idLabel: 'CPH number', address: '1 Brick Lane, Shrewsbury, SY1 1AA', status: 'closed' },
  { id: 'market', type: 'market', name: 'Example Livestock Market', identifier: '31/672/0158', idLabel: 'CPH number', address: 'Market Road, Exampleton, EX3 5EF', status: 'active'},
  { id: 'mart', type: 'market', name: 'Valley Livestock Market', identifier: '44/209/0317', idLabel: 'CPH number', address: 'Market Street, Exampleton, EX2 4DE' , status: 'active'},
  { id: 'abattoir', type: 'slaughterhouse', name: 'Valley Meats', identifier: 'UK 5678', idLabel: 'Approval number', address: 'Abbey Road, Exampleton, EX4 8HJ' , status: 'active'},
  { id: 'show', type: 'showground', name: 'County Showground', identifier: '66/204/0141', idLabel: 'CPH number', address: 'Showground Road, Exampleton, EX5 9JK' , status: 'active'},
  { id: 'collection', type: 'collection-centre', name: 'Example Collection Centre', identifier: '22/100/0044', idLabel: 'CPH number', address: 'Station Road, Exampleton, EX6 1MN' , status: 'active'}
]
// Ten identifiable fictional cattle, without restriction or authorisation fields.
const BREEDS = [{code:'HF',name:'Holstein Friesian'},{code:'BRB',name:'British Blue'},{code:'AA',name:'Aberdeen Angus'},{code:'HE',name:'Hereford'}]
//Create cattle array to check against when adding animals
const CATTLE = Array.from({length:10},(_,i)=>({
  tag:'UK 371234 '+String(i+1).padStart(6,'0'),
  breed:BREEDS[i%4], sex:i%2?'Male':'Female',
  dateOfBirth:String(i+1).padStart(2,'0')+'-'+String(i%12+1).padStart(2,'0')+'-2022',
  encodedTag:encodeURIComponent('UK 371234 '+String(i+1).padStart(6,'0'))
}))


//Middleware


//
// Set up session data for this movement journey
//
// This allows you to open pages directly without
// having to complete the previous steps first.
//

router.use(BASE, (req, res, next) => {

  // Create a space for this version's data if it doesn't exist
  if (!req.session.data[SESSION]) {
    req.session.data[SESSION] = {}
  }

  const movementSession = req.session.data[SESSION]

  // Create an empty movement if one hasn't been started
  if (!movementSession.movementDraft) {
    movementSession.movementDraft = {
      direction: null,
      animals: [],
      movementDate: null,
      destination: null,
      destinationSource: null
    }
  }
    // Create a list to store reported movements
    if (!movementSession.movements) {
      movementSession.movements = []
    }
  // Continue to the requested page
  next()
})


// add movement
router.post(BASE + '/movement-type', (req, res) => {
  const movementType = req.body['rfm-movement-type']

  if (movementType === 'off') {
    return res.redirect(BASE + '/start-off')
  } else if (movementType === 'on') {
    return res.redirect(BASE + '/start-on')
  } else {
    return res.redirect(BASE + '/movement-type')
  }
})
router.get(BASE + '/start-off', (req, res) => {
     // Initialise the session object if it doesn't exist
      req.session.data[SESSION] = req.session.data[SESSION] || {}
      // Start a fresh movement draft
      req.session.data[SESSION].movementDraft = {
        direction: 'off',
        animals: []
      }
      res.redirect(BASE + '/add-method')
})

router.get(BASE + '/start-on', (req, res) => {

    // Initialise the session object if it doesn't exist
          req.session.data[SESSION] = req.session.data[SESSION] || {}
          // Start a fresh movement draft
      req.session.data[SESSION].movementDraft = {
        direction: 'on',
        animals: []
      }
      res.redirect(BASE + '/animals')
})

router.post(BASE + '/add-method', (req, res) => {
  const movementType = req.body['rfm-method']

  if (movementType === 'upload') {
    return res.redirect(BASE + '/upload')
  } else if (movementType === 'manual') {
    return res.redirect(BASE + '/manual')
  }
})




router.post(BASE + '/upload', (req, res) => {
  const draft = req.session.data[SESSION].movementDraft
  const uploadedCattle = CATTLE.slice(0, 5)

  const animalsAdded = []
  const animalsNotAdded = []

  uploadedCattle.forEach(animal => {
    if (draft.animals.some(existing => existing.tag === animal.tag)) {
      animalsNotAdded.push({
        ...animal,
        reason: 'This animal is already included'
      })
    } else {
      draft.animals.push(animal)
      animalsAdded.push(animal)
    }
  })

  draft.uploadResults = { animalsAdded, animalsNotAdded }

  return res.redirect(BASE + '/animals?notification=uploaded')
})



router.post(BASE + '/manual', (req, res) => {
  const draft = req.session.data[SESSION].movementDraft
  const tags = (req.session.data['rfm-tags'] || '').split(/\r?\n/)

  const animalsAdded = []
  const animalsNotAdded = []

  tags.forEach(tag => {
    tag = tag.trim()
    if (!tag) return

    // Remove spaces and convert to uppercase
    const cleanTag = tag.replace(/\s/g, '').toUpperCase()

    // Check UK ear tag format
    if (!/^UK\d{12}$/.test(cleanTag)) {
      animalsNotAdded.push({
        tag,
        reason: 'UK ear tag number not in the correct format'
      })
      return
    }

    // Find animal in our cattle list
    const animal = CATTLE.find(
      cattle => cattle.tag.replace(/\s/g, '') === cleanTag
    )

    if (!animal) {
      animalsNotAdded.push({
        tag,
        reason: 'Animal tag not found'
      })
    } else if (draft.animals.some(a => a.tag === animal.tag)) {
      animalsNotAdded.push({
        tag,
        reason: 'This animal is already included'
      })
    } else {
      draft.animals.push(animal)
      animalsAdded.push(animal)
    }
  })

  draft.manualResults = { animalsAdded, animalsNotAdded }

  return res.redirect(BASE + '/animals?notification=manual')
})




router.get(BASE + '/animals', (req, res) => {
  const draft = req.session.data[SESSION]?.movementDraft

  if (!draft) {
    return res.redirect(BASE + '/movement-type')
  }

  const notification = req.query.notification

  const results = notification === 'uploaded'
    ? draft.uploadResults
    : notification === 'manual'
      ? draft.manualResults
      : null

  const { animalsAdded = [], animalsNotAdded = [] } = results || {}

  return res.render(VIEW + 'animals', {
    animals: draft.animals,
    animalsAdded,
    animalsNotAdded,
    hasAnimalsAdded: animalsAdded.length > 0,
    hasAnimalsNotAdded: animalsNotAdded.length > 0,
    removedAnimal: notification === 'removed'
      ? req.query.tag
      : null
  })
})



// if you use the "do you want to remove?" page then change this to a post
router.get(BASE + '/remove', (req, res) => {
  const draft = req.session.data[SESSION].movementDraft
  const { tag, returnTo } = req.query

  draft.animals = draft.animals.filter(animal => animal.tag !== tag)

  const page = returnTo === 'check-answers' ? 'check-answers' : 'animals'

  return res.redirect(
    BASE + '/' + page + '?notification=removed&tag=' + tag
  )
})



router.post(BASE + '/manual', (req, res) => {
  return res.redirect(BASE + '/review-animals')
})

router.post(BASE + '/animals', (req, res) => {
  const addAnother = req.body['rfm-another']
  if (addAnother === 'yes'){
  return res.redirect(BASE + '/add-method')
  }else if (addAnother === 'no'){
  return res.redirect(BASE + '/movement-date')
  }else{
  return res.redirect(BASE + '/animals?hasError')
  }
})

//Use this to format correct dates
function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}


router.post(BASE + '/movement-date', (req, res) => {
  const draft = req.session.data[SESSION].movementDraft
  const choice = req.body['rfm-date-choice']

  const days = {
    today: 0,
    yesterday: 1,
    '2-days': 2,
    '3-days': 3
  }

  draft.movementDate = choice === 'different'
    ? `${req.body['rfm-day']}-${req.body['rfm-month']}-${req.body['rfm-year']}`
    : daysAgo(days[choice] ?? 0)

  return res.redirect(BASE + '/previous-destinations')
})


router.get(BASE + '/previous-destinations', (req, res) => {
  const PREVIOUS_LOCATIONS = ['hilltop', 'brook', 'market', 'abattoir', 'show']
  // used basic dynamic content to populate the location details
  const previousLocations = LOCATIONS.filter(
    location => PREVIOUS_LOCATIONS.includes(location.id)
  )

  return res.render(VIEW + 'previous-destinations', {
    previousLocations
  })
})

router.post(BASE + '/previous-destinations', (req, res) => {

  // Get the current movement and the destination selected by the user
  const draft = req.session.data[SESSION].movementDraft
  const choice = req.body['rfm-previous']

  // If they choose a new destination, take them to the search page
  if (choice === 'new') {
    return res.redirect(BASE + '/find-destination')
  }

  // Find the selected destination in our list of locations
  const destination = LOCATIONS.find(
    location => location.id === choice
  )

  // If no matching destination is found, return to the selection page
  if (!destination) {
    return res.redirect(BASE + '/previous-destinations')
  }

  // Save the destination details to the current movement
  draft.destination = destination
  draft.destinationSource = 'previous-destinations'
  // Take the user to the page to confirm the destination
  return res.redirect(BASE + '/confirm-destination')
})

router.get(BASE + '/confirm-destination', (req, res) => {
  const draft = req.session.data[SESSION].movementDraft

  return res.render(VIEW + 'confirm-destination', {
    destination: draft.destination,
    destinationSource: draft.destinationSource
  })
})

router.post(BASE + '/find-destination', (req, res) => {

  // Get the search method chosen by the user
  const findMethod = req.body['rfm-find-method']

  // Send the user to the appropriate search page
  if (findMethod === 'identifier') {
    return res.redirect(BASE + '/find-holding-by-id')
  }

  if (findMethod === 'address') {
    return res.redirect(BASE + '/find-holding-by-address')
  }

  // Return to this page if no option was selected add errors if needed
  return res.redirect(BASE + '/find-destination')
})


router.post(BASE + '/find-holding-by-id', (req, res) => {

  // Get the number entered and remove spaces, slashes and UK
  const enteredNumber = (req.body['rfm-destination-id'] || '')
    .replace(/[\s/]/g, '')
    .replace(/^UK/i, '')
    .toUpperCase()

  // Find a matching CPH or abattoir approval number
  const destination = LOCATIONS.find(location => {
    const locationNumber = location.identifier
      .replace(/[\s/]/g, '')
      .replace(/^UK/i, '')
      .toUpperCase()

    return locationNumber === enteredNumber
  })

  // If no matching destination is found, return to the search page
  if (!destination) {
    return res.redirect(BASE + '/find-holding-by-id?notFound=true')
  }

  // Save the destination to the current movement
  const draft = req.session.data[SESSION].movementDraft
  draft.destination = destination
  draft.destinationSource = 'find-holding-by-id'

  // Take the user to the confirmation page
  return res.redirect(BASE + '/confirm-destination')
})



router.post(BASE + '/find-holding-by-address', (req, res) => {

  // Get the postcode entered by the user
  const postcode = (req.body['rfm-location-postcode'] || '')
    .replace(/\s/g, '')
    .toUpperCase()

  // Find registered locations matching the postcode
  const results = LOCATIONS.filter(location => {

    const address = location.address.replace(/\s/g, '').toUpperCase()

    return postcode !== '' && address.endsWith(postcode)
  })

  // Save the search results for the next page
  const movementSession = req.session.data[SESSION]
  movementSession.addressResults = results
  movementSession.addressSearch = req.body['rfm-location-postcode']

  // If only one destination matches, go straight to confirmation
  if (results.length === 1) {
    movementSession.movementDraft.destination = results[0]
    movementSession.movementDraft.destinationSource = 'find-holding-by-address'

    return res.redirect(BASE + '/confirm-destination')
  }

  // Multiple matches or no matches: show the results page
  return res.redirect(BASE + '/select-destination-location')
})

router.get(BASE + '/select-destination-location', (req, res) => {

  // Get the results from the previous address search
  const movementSession = req.session.data[SESSION]

  return res.render(VIEW + 'select-destination-location', {
    results: movementSession.addressResults || [],
    search: movementSession.addressSearch || ''
  })
})
router.post(BASE + '/select-destination-location', (req, res) => {

  // Get the destination selected by the user
  const choice = req.body['rfm-address-destination']
  const movementSession = req.session.data[SESSION]

  // Find the selected destination in the search results
  const destination = (movementSession.addressResults || []).find(
    location => location.id === choice
  )

  // Return to the results page if no destination was selected
  if (!destination) {
    return res.redirect(BASE + '/select-destination-location?hasError=true')
  }

  // Save the selected destination and where it was found
  const draft = movementSession.movementDraft
  draft.destination = destination
  draft.destinationSource = 'find-holding-by-address'

  return res.redirect(BASE + '/confirm-destination')
})




router.post(BASE + '/confirm-destination', (req, res) => {

  // Get the current movement and the user's answer
  const draft = req.session.data[SESSION].movementDraft
  const answer = req.body['rfm-confirm-destination']

  // If the destination is correct, continue to Check your answers
  if (answer === 'yes') {
    return res.redirect(BASE + '/check-answers')
  }

  // If the destination is incorrect, return to where it was selected
  if (answer === 'no') {

    const previousPage = draft.destinationSource

    // Only allow destinations from our known search pages
    const allowedPages = [
      'previous-destinations',
      'find-holding-by-id',
      'find-by-address'
    ]

    if (allowedPages.includes(previousPage)) {
      return res.redirect(BASE + '/' + previousPage)
    }

    // Default to previous destinations if no source is recorded
    return res.redirect(BASE + '/previous-destinations')
  }

  // Return to the confirmation page if no answer was selected
  return res.redirect(BASE + '/confirm-destination')
})

router.get(BASE + '/check-answers', (req, res) => {

  // Get the movement details saved during the journey
  const draft = req.session.data[SESSION].movementDraft

  // Pass the movement details to the Check your answers page
  return res.render(VIEW + 'check-answers', {
    sender: SENDER,
    destination: draft.destination,
    movementDate: draft.movementDate,
    animals: draft.animals,
    removedAnimal: req.query.notification === 'removed'
      ? req.query.tag
      : null
  })
})
function generateMovementReference() {

  // Characters used in the movement reference
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let reference = ''

  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    reference += characters[randomIndex]
  }

  // Add a space after the first 4 characters
  return reference.slice(0, 4) + ' ' + reference.slice(4)
}

router.post(BASE + '/submit', (req, res) => {

  // Get the current movement and the list of reported movements
  const movementSession = req.session.data[SESSION]
  const draft = movementSession.movementDraft
  const movements = movementSession.movements
  const destination = draft.destination

  //stop multiple submits of empty drafts
    if (draft.animals.length === 0) {
      return res.redirect(BASE + '/animals')
    }
  // Generate a unique movement reference
  let reference

  do {
    reference = generateMovementReference()
  } while (movements.some(movement => movement.reference === reference))

  // Create the reported movement using the draft details
  const movement = {
    ...JSON.parse(JSON.stringify(draft)),
    reference: reference,
    sender: SENDER,
    status: 'Awaiting confirmation',
    actionWith: 'Other keeper'
  }

  // Add the reported movement to the list
  movements.push(movement)

  // Clear the draft so it cannot be submitted again
  movementSession.movementDraft = null

  // Show the confirmation for this movement
  return res.redirect(
    BASE + '/confirmation?reference=' + reference+'&sender='+destination
  )
})

// reviews
router.get(BASE + '/movements', (req, res) => {

  // Get movements reported during this prototype session
  const reportedMovements = req.session.data[SESSION].movements

  // Pass the reported movements to the page
  return res.render(VIEW + 'movements', {
    reportedMovements
  })
})
// helper routes
router.get(BASE + '/clear-test-movements', (req, res) => {

  // Clear reported movements created during testing
  req.session.data[SESSION].movements = []

  return res.redirect(BASE + '/movements')
})
module.exports=router
