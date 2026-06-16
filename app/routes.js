//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
// Each journey has its own routes file in the app/routes/ folder.
// Add new journeys there — do not add routes directly to this file.
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const journeys = [
  './routes/movements',
  './routes/cattle-birth',
  './routes/vetvisits',
  './routes/add-a-delegate-v2',
  './routes/user-registration',
  './routes/livestock-usability-v1',
  './routes/livestock-usability-v2',
  './routes/livestock-usability-v3',
  './routes/livestock-usability-v4',
  './routes/livestock-usability-v5',
  './routes/livestock-usability-v6',
  './routes/livestock-back-office-old-v1',
]

journeys.forEach(journey => {
  try {
    router.use(require(journey))
  } catch (err) {
    console.error(`[routes] Failed to load ${journey}:`, err.message)
  }
})

module.exports = router
