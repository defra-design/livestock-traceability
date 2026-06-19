//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
// Each journey has its own routes file in the app/routes/ folder.
// Add new journeys there — do not add routes directly to this file.
//

const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const fs = require('fs');
const path = require('path');

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


//include all routes files from the routes folder.
//
const journeysPath = path.join(__dirname, 'routes');

function loadRouteFile(router, routePath, label) {
    try {
        console.log(`[routes] Loading ${label}`);
        router.use(require(routePath));
    } catch (err) {
        console.error(`[routes] Failed to load ${label}:`, err.message);
    }
}

function loadRoutesFromFolder(router, folderPath) {
    fs.readdirSync(folderPath)
        .sort()
        .forEach(item => {
            const itemPath = path.join(folderPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isFile() && item.endsWith('.js') && item !== path.basename(__filename)) {
                loadRouteFile(router, itemPath, item);
            }

            if (stats.isDirectory()) {
                fs.readdirSync(itemPath)
                    .filter(file => file.endsWith('.js'))
                    .sort()
                    .forEach(file => {
                        const childRoutePath = path.join(itemPath, file);
                        const label = `${item}/${file}`;

                        loadRouteFile(router, childRoutePath, label);
                    });
            }
        });
}

loadRoutesFromFolder(router, journeysPath);


module.exports = router
