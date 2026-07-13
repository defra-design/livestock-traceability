const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

const baseURL = 'livestock-back-office/v2';

module.exports = router;


/**
 * Shared helpers
 */

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\//g, '');
}

function getAnimalByEarTag(req, earTagNumber) {
  const cattleData = req.session.data.livestock || { animals: [] };

  return cattleData.animals.find((animal) => {
    return animal.earTagNumber.toLowerCase() === String(earTagNumber).toLowerCase();
  });
}

function getOffspring(req, animal) {
  const cattleData = req.session.data.livestock || { animals: [] };

  return cattleData.animals.filter((record) => {
    return record.dam?.geneticDam?.earTagNumber === animal.earTagNumber;
  });
}

function getAnimalEvents(req, animal) {
  const eventsData = req.session.data.events_livestock || { events: [] };

  return eventsData.events
    .filter((event) => {
      return event.animal_id === animal.earTagNumber;
    })
    .sort((a, b) => {
      return new Date(a.event_date) - new Date(b.event_date);
    });
}


/**
 * Cattle search
 */

function getFilteredCattle(req) {
  const search = String(req.query.search || '').trim();
  const cattleData = req.session.data.livestock || { animals: [] };

  const cattle = cattleData.animals.filter((animal) => {
    if (!search) return true;

    const searchableValues = [
      animal.cph,
      animal.earTagNumber,
      animal.dateOfBirth,
      animal.dateOfRegistration,
      animal.sex,
      animal.breed?.name,
      animal.breed?.code,
      animal.status,
      animal.dam?.type,
      animal.dam?.geneticDam?.earTagNumber,
      animal.dam?.surrogateDam?.earTagNumber,
      animal.sire?.earTagNumber,
      animal.sire?.name
    ];

    return searchableValues.some((value) => {
      return normalise(value).includes(normalise(search));
    });
  });

  return {
    cattle,
    search
  };
}

function registerCattleRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath, (req, res) => {
    const cattleResults = getFilteredCattle(req);

    return res.render(baseURL + '/' + viewPath, {
      cattle: cattleResults.cattle,
      search: cattleResults.search,
      baseURL
    });
  });
}


/**
 * Cattle details
 */

function getCattleDetails(req, earTagNumber) {
  const animal = getAnimalByEarTag(req, earTagNumber);

  if (!animal) {
    return null;
  }

  const offspring = getOffspring(req, animal);
  const animalEvents = getAnimalEvents(req, animal);

  return {
    animal,
    offspring,
    animalEvents
  };
}

function registerCattleDetailsRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath + '/:earTagNumber', (req, res) => {
    const cattleDetails = getCattleDetails(req, req.params.earTagNumber);

    if (!cattleDetails) {
      return res.status(404).render(baseURL + '/404', {
        pageTitle: 'Cattle record not found'
      });
    }

    return res.render(baseURL + '/' + viewPath, {
      animal: cattleDetails.animal,
      offspring: cattleDetails.offspring,
      animalEvents: cattleDetails.animalEvents,
      baseURL
    });
  });
}


/**
 * Holdings search
 */

function getFilteredHoldings(req) {
  const holdingsData = req.session.data.holdings_v2 || { holdings: [] };
  const search = String(req.query.search || '').trim();

  const holdings = holdingsData.holdings.filter((holding) => {
    if (!search) return true;

    const herdAndFlockMarks = (holding.herdAndFlockMarks || []).flatMap((item) => [
      item.species,
      item.mark
    ]);

    const searchableValues = [
      holding.cph,
      holding.holdingName,
      holding.businessName,
      holding.address?.addressLine1,
      holding.address?.addressLine2,
      holding.address?.town,
      holding.address?.county,
      holding.address?.postcode,
      holding.status,
      holding.holdingType,
      ...(holding.species || []),
      ...herdAndFlockMarks
    ];

    return searchableValues.some((value) => {
      return normalise(value).includes(normalise(search));
    });
  });

  return {
    holdings,
    search
  };
}

function registerHoldingsRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath, (req, res) => {
    const holdingResults = getFilteredHoldings(req);

    return res.render(baseURL + '/' + viewPath, {
      holdings: holdingResults.holdings,
      search: holdingResults.search,
      baseURL
    });
  });
}


/**
 * Users search
 */

function getFilteredUsers(req) {
  const usersData = req.session.data.users_v2 || { users: [] };
  const search = String(req.query.search || '').trim();

  const users = usersData.users.filter((user) => {
    if (!search) return true;

    const searchableValues = [
      user.name,
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.address?.postcode,
      user.securityWord
    ];

    return searchableValues.some((value) => {
      return normalise(value).includes(normalise(search));
    });
  });

  return {
    users,
    search
  };
}

function registerUsersRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath, (req, res) => {
    const userResults = getFilteredUsers(req);

    return res.render(baseURL + '/' + viewPath, {
      users: userResults.users,
      search: userResults.search,
      baseURL
    });
  });
}


/**
 * Register list/search routes first
 */

registerCattleRoute('cattle', 'cattle');
registerCattleRoute('holdings/cattle-register', 'holding-cattle-register');

registerHoldingsRoute('holdings', 'holdings');
registerHoldingsRoute('holding-search', 'holding-search');

registerUsersRoute('users', 'users');


/**
 * Register cattle detail routes
 */

registerCattleDetailsRoute('cattle', 'cattle-details');
registerCattleDetailsRoute('holdings/cattle', 'holding-cattle-details');


/**
 * Holding details
 */

router.get('/' + baseURL + '/holdings/:id', (req, res) => {
  const holdingsData = req.session.data.holdings_v2 || { holdings: [] };
  const usersData = req.session.data.users_v2 || { users: [] };

  const holding = holdingsData.holdings.find((holding) => {
    return holding.id === req.params.id;
  });

  if (!holding) {
    return res.status(404).render(baseURL + '/404', {
      pageName: 'Holding not found'
    });
  }

  const users = usersData.users
    .map((user) => {
      const holdingMembership = (user.holdings || []).find((membership) => {
        return membership.holdingId === holding.id;
      });

      if (!holdingMembership) {
        return null;
      }

      return {
        ...user,
        holdingRole: holdingMembership.role,
        speciesManagedByRole: holdingMembership.speciesManagedByRole,
        cph: holdingMembership.cph
      };
    })
    .filter(Boolean);

  const cattleHerdMarks = (holding.herdAndFlockMarks || []).filter((item) => {
    return item.species === 'Cattle';
  });

  return res.render(baseURL + '/holding-details', {
    holding,
    users,
    cattleHerdMarks,
    baseURL
  });
});


/**
 * User details
 */

router.get('/' + baseURL + '/users/:id', (req, res) => {
  const usersData = req.session.data.users_v2 || { users: [] };
  const holdingsData = req.session.data.holdings_v2 || { holdings: [] };

  const user = usersData.users.find((user) => {
    return user.id === req.params.id;
  });

  if (!user) {
    return res.status(404).render(baseURL + '/404', {
      pageName: 'User not found'
    });
  }

  const userHoldings = (user.holdings || []).map((membership) => {
    const holding = holdingsData.holdings.find((holding) => {
      return holding.id === membership.holdingId;
    });

    return {
      ...membership,
      holding
    };
  });

  return res.render(baseURL + '/user-details', {
    user,
    userHoldings,
    baseURL
  });
});