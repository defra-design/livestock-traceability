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
  { id:'hilltop',name:'Hilltop Farm',identifier:'56/312/0056',status:'active',address:'Mill Lane, Exampleton, EX2 3CD',type:'holding',idLabel:'CPH number' },
  { id:'brook',name:'Brook Farm',identifier:'15/628/0067',status:'active',address:'High Road, Exampleton, EX2 4DE',type:'holding',idLabel:'CPH number' },
  { id:'market',name:'Example Livestock Market',identifier:'31/672/0158',address:'Market Road, Exampleton, EX3 5EF',type:'market',idLabel:'CPH number' },
  { id:'show',name:'County Showground',identifier:'66/204/0141',status:'active',address:'Showground Road, Exampleton, EX5 9JK',type:'showground',idLabel:'CPH number' },
  { id:'abattoir',name:'Example Abattoir',identifier:'UK 1234',status:'active',address:'Industrial Estate, Exampleton, EX4 7GH',type:'slaughterhouse',idLabel:'Approval number' },
  { id:'hampstead',name:'Hampstead Farm',identifier:'56/312/0056',status:'closed',address:'Hampstead hill, Exampleton, EX2 3CD',type:'holding',idLabel:'CPH number' }
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
      destination: null
    }
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

  // Take the user to the page to confirm the destination
  return res.redirect(BASE + '/confirm-destination')
})

router.get(BASE + '/confirm-destination', (req, res) => {
  const draft = req.session.data[SESSION].movementDraft

  return res.render(VIEW + 'confirm-destination', {
    destination: draft.destination
  })
})
// reviews


module.exports=router
