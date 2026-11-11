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
const CATTLE = Array.from({length:15},(_,i)=>({
  tag:'UK 371234 '+String(i+1).padStart(6,'0'),
  breed:BREEDS[i%4], sex:i%2?'Male':'Female',
  dateOfBirth:String(i+1).padStart(2,'0')+'-'+String(i%12+1).padStart(2,'0')+'-2022',
  encodedTag:encodeURIComponent('UK 371234 '+String(i+1).padStart(6,'0'))
}))

// to the propose amend journey
const REVIEW_CATTLE = [
  {
    tag: 'UK 371234 000006',
    breed: { code: 'HE', name: 'Hereford' },
    sex: 'Male',
    dateOfBirth: '04-08-2021'
  },
  {
    tag: 'UK 371234 000007',
    breed: { code: 'HF', name: 'Holstein Friesian' },
    sex: 'Female',
    dateOfBirth: '05-09-2022'
  },
  {
    tag: 'UK 371234 000042',
    breed: { code: 'HF', name: 'Holstein Friesian' },
    sex: 'Female',
    dateOfBirth: '18-06-2022'
  }
]


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

  // Keep the movement type available to shared Nunjucks templates
  req.session.data['rfm-movement-type'] = movementType

  if (movementType === 'off') {
    return res.redirect(BASE + '/start-off')
  } else if (movementType === 'on') {
    return res.redirect(BASE + '/start-on')
  } else {
    return res.redirect(BASE + '/movement-type')
  }
})
router.get(BASE + '/start-off', (req, res) => {
      req.session.data['rfm-movement-type'] = 'off'
     // Initialise the session object if it doesn't exist
      req.session.data[SESSION] = req.session.data[SESSION] || {}
      // Start a fresh movement draft
      req.session.data[SESSION].movementDraft = {
        direction: 'off',
        animals: [],
        movementDate: null,
        destination: null,
        destinationSource: null
      }
      res.redirect(BASE + '/add-method')
})

router.get(BASE + '/start-on', (req, res) => {
      req.session.data['rfm-movement-type'] = 'on'

    // Initialise the session object if it doesn't exist
          req.session.data[SESSION] = req.session.data[SESSION] || {}
          // Start a fresh movement draft
      req.session.data[SESSION].movementDraft = {
        direction: 'on',
        animals: [],
        movementDate: null,
        destination: null,
        destinationSource: null
      }
       // For movement on, identify the sending holding before adding cattle
       res.redirect(BASE + '/previous-destinations')
})

router.post(BASE + '/add-method', (req, res) => {
  const movementType = req.body['rfm-method']

  if (movementType === 'upload') {
    return res.redirect(BASE + '/upload')
  }
  if (movementType === 'manual') {

    return res.redirect(BASE + '/manual')
  }

  if (movementType === 'select' && req.session.data[SESSION].movementDraft.direction === 'off') {
    return res.redirect(BASE + '/select-cattle')
  }
  res.redirect(BASE + '/add-method')
})

router.get(BASE + '/select-cattle', (req, res) => {
  if (req.session.data[SESSION].movementDraft.direction === 'on') {
    return res.redirect(BASE + '/add-method')
  }

  // Get the animals already added to this movement
  const draft = req.session.data[SESSION].movementDraft

  // Only show cattle that have not already been added
  const availableCattle = CATTLE.filter(animal =>
    !draft.animals.some(added => added.tag === animal.tag)
  )

  return res.render(VIEW + 'select-cattle', {
    availableCattle
  })
})


router.post(BASE + '/select-cattle', (req, res) => {
  if (req.session.data[SESSION].movementDraft.direction === 'on') {
    return res.redirect(BASE + '/add-method')
  }

  // Get the selected ear tag numbers
  const selectedTags = req.body['rfm-selected-cattle'] || []

  // Make sure we always have an array, even if only one is selected
  const tags = Array.isArray(selectedTags)
    ? selectedTags
    : [selectedTags]

  // Find the selected cattle that are not already in the movement
  const draft = req.session.data[SESSION].movementDraft

  const animalsAdded = CATTLE.filter(animal =>
    tags.includes(animal.tag) &&
    !draft.animals.some(added => added.tag === animal.tag)
  )

  // Add them to the movement
  draft.animals.push(...animalsAdded)

  // Save the results for the review page
  draft.selectionResults = {
    animalsAdded,
    animalsNotAdded: []
  }

  return res.redirect(BASE + '/animals?notification=selected')
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
      : notification === 'selected'
        ? draft.selectionResults
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

  // Movement on already captured its sending location.
  // Movement off finds its destination after the movement date.
  if (draft.direction === 'on') {
    return res.redirect(BASE + '/check-answers')
  }

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

  // Get the current movement and the location selected by the user
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

  // Store the selected location (sending location for 'on', destination for 'off')
  draft.destination = destination
  draft.destinationSource = 'previous-destinations'
  // Take the user to the page to confirm this location
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
    return res.redirect(BASE + '/location-not-found')
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

  // If only one location matches, go straight to confirmation
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

  // Movement on needs to add cattle next; off moves to Check your answers
  if (answer === 'yes') {
    if (draft.direction === 'on') {
      return res.redirect(BASE + '/add-method')
    }
    return res.redirect(BASE + '/check-answers')
  }

  // If the destination is incorrect, return to where it was selected
  if (answer === 'no') {

    const previousPage = draft.destinationSource

    // Only allow destinations from our known search pages
    const allowedPages = [
      'previous-destinations',
      'find-holding-by-id',
       'find-holding-by-address'
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
  // Keep the existing field names so the register can display both directions.
  // For movement on, draft.destination contains the sending location found earlier.
  const sendingLocation = draft.direction === 'on' ? draft.destination : SENDER
  const receivingLocation = draft.direction === 'on' ? SENDER : draft.destination

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
    sender: sendingLocation,
    destination: receivingLocation,
    status: 'Awaiting confirmation',
    actionWith: 'Other keeper'
  }

  // Add the reported movement to the list
  movements.push(movement)

  // Clear the draft so it cannot be submitted again
  movementSession.movementDraft = null

  // Show the confirmation for this movement
  return res.redirect(
    BASE + '/confirmation?reference=' + encodeURIComponent(reference)
  )
})

// Confirmation uses the saved movement, including its direction and locations
router.get(BASE + '/confirmation', (req, res) => {
  const movements = req.session.data[SESSION].movements
  const movement = movements.find(item => item.reference === req.query.reference)

  return res.render(VIEW + 'confirmation', { movement })
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


// Start proposing changes to the reported movement
router.get(BASE + '/review/start-proposal', (req, res) => {

  const movementSession = req.session.data[SESSION]

  // Start with the three animals originally reported
  // might want to set the reference more dynamically
  movementSession.proposedChanges = {
    reference: '8R2T 9W1F',
    animals: REVIEW_CATTLE.map(animal => ({ ...animal }))
  }

  return res.redirect(BASE + '/review/propose-animals')
})


// Display the animals being reviewed
router.get(BASE + '/review/propose-animals', (req, res) => {

  const proposedChanges = req.session.data[SESSION].proposedChanges

  if (!proposedChanges) {
    return res.redirect(BASE + '/review/start-proposal')
  }

  return res.render(VIEW + 'review/propose-animals', {
    animals: proposedChanges.animals,
    reference: proposedChanges.reference,
    removedAnimal: req.query.removed
  })
})

router.get(BASE + '/review/remove-animal', (req, res) => {

  // Get the proposed changes and animal being removed
  const proposedChanges = req.session.data[SESSION].proposedChanges
  const tag = req.query.tag

  // Remove the animal from the proposed movement
  proposedChanges.animals = proposedChanges.animals.filter(
    animal => animal.tag !== tag
  )

  // Return to the review page with a success notification
  return res.redirect(
    BASE + '/review/propose-animals?removed=' + tag
  )
})

router.post(BASE + '/review/add-method', (req, res) => {
  const movementType = req.body['rfm-method']

  if (movementType === 'upload') {
    return res.redirect(BASE + '/review/add-upload')
  }
  if (movementType === 'manual') {

    return res.redirect(BASE + '/review/add-manual')
  }

  res.redirect(BASE + 'review/add-method')
})



router.post(BASE + '/review/upload', (req, res) => {
  // Add the five fictional cattle from the simulated upload
  const uploadedCattle = CATTLE.slice(0, 5)

  uploadedCattle.forEach(animal => {
    if (!proposedChanges.animals.some(
      existing => existing.tag === animal.tag
    )) {
      proposedChanges.animals.push(animal)
    }
  })

  return res.redirect(BASE + '/review/propose-animals')
})

router.post(BASE + '/review/add-manual', (req, res) => {

  const proposedChanges = req.session.data[SESSION].proposedChanges

  // Get the ear tags entered by the keeper
  const tags = (req.body['rfm-tags'] || '').split(/\r?\n/)

  // Add matching cattle that are not already included
  tags.forEach(tag => {

    const cleanTag = tag.replace(/\s/g, '').toUpperCase()

    const animal = CATTLE.find(
      cattle => cattle.tag.replace(/\s/g, '') === cleanTag
    )

    if (animal && !proposedChanges.animals.some(
      existing => existing.tag === animal.tag
    )) {
      proposedChanges.animals.push(animal)
    }

  })

  return res.redirect(BASE + '/review/propose-animals')
})

router.get(BASE + '/review/changes-proposed', (req, res) => {

  const proposedChanges = req.session.data[SESSION].proposedChanges

  return res.render(VIEW + 'review/changes-proposed', {
    reference: proposedChanges.reference
  })
})

router.post(BASE + '/review/submit-proposal', (req, res) => {

  // Get the keeper's proposed changes
  const proposedChanges = req.session.data[SESSION].proposedChanges

  // Record that the changes are awaiting the other keeper
  proposedChanges.status = 'Changes proposed'
  proposedChanges.actionWith = 'Other keeper'

  // Continue to the confirmation page
  return res.redirect(BASE + '/review/proposed-changes-confirmation.')
})


router.get(BASE + '/review/propose-change-cya', (req, res) => {

  // Get the changes being proposed by the receiving keeper
  const proposedChanges = req.session.data[SESSION].proposedChanges

  if (!proposedChanges) {
    return res.redirect(BASE + '/review/start-proposal')
  }

  // The original cattle reported by the other keeper
  const originalAnimals = REVIEW_CATTLE

  // The cattle remaining after the keeper's changes
  const proposedAnimals = proposedChanges.animals

  // Find cattle removed from the original report
  const animalsRemoved = originalAnimals.filter(animal =>
    !proposedAnimals.some(proposed => proposed.tag === animal.tag)
  )

  // Find cattle added to the original report
  const animalsAdded = proposedAnimals.filter(animal =>
    !originalAnimals.some(original => original.tag === animal.tag)
  )

  // Build the comparison table, including unchanged cattle
  const animalChanges = originalAnimals.map(animal => ({
    ...animal,
    change: animalsRemoved.some(removed => removed.tag === animal.tag)
      ? 'removed'
      : 'unchanged'
  }))

  // Add the newly proposed cattle to the comparison table
  animalsAdded.forEach(animal => {
    animalChanges.push({
      ...animal,
      change: 'added'
    })
  })

  // Pass everything to the Check your answers page
  return res.render(VIEW + 'review/propose-change-cya', {
    reference: proposedChanges.reference,
    originalAnimals,
    proposedAnimals,
    animalsRemoved,
    animalsAdded,
    animalChanges,
    SENDER
  })
})

router.get(BASE + '/review/proposed-changes-confirmation.', (req, res) => {

  // Get the movement reference
  const proposedChanges = req.session.data[SESSION].proposedChanges

  return res.render(VIEW + 'review/proposed-changes-confirmation.', {
    reference: proposedChanges.reference
  })
})

// helper routes
router.get(BASE + '/clear-test-movements', (req, res) => {

  // Clear reported movements created during testing
  req.session.data[SESSION].movements = []

  return res.redirect(BASE + '/movements')
})
module.exports=router
