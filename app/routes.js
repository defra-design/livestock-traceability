//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
// Each journey has its own routes file in the app/routes/ folder.
// Add new journeys there — do not add routes directly to this file.
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

//Add middleware to include query to all pages
router.use(function(req, res, next) {
    if (req.query.cleardata === 'true') {
            return req.session.destroy(function(err) {
                if (err) {
                    return next(err);
                }

                return res.redirect(req.path);
            });
    }
    res.locals.query = req.query;
    res.locals.host = req.headers.host;
    next();
});

//Add middleware to include radio redirects, This is taken from
//https://github.com/abbott567/radio-button-redirect/tree/master
router.use((req, res, next) => {
   const obj = Object.keys(req.body).length ? req.body : req.query;
     for (const k in obj) {
       const v = obj[k];
       if (v.includes('~')) {
         const parts = v.split('~');
         req.session.data[k] = parts[0];
         const href = parts[1];
         return res.redirect(href);
       }
     }
     next();
})

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
