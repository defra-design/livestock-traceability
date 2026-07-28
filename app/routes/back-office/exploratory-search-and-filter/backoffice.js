const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

const baseURL = 'livestock-back-office/search-and-filter';

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

function getHoldingsData(req) {
  return req.session.data.holdings_v2 || { holdings: [] };
}

function getUsersData(req) {
  return req.session.data.users_v2 || { users: [] };
}

function getCattleData(req) {
  return req.session.data.livestock || { animals: [] };
}

function getEventsData(req) {
  return req.session.data.events_livestock
    || req.session.data.events_livestock
    || { events: [] };
}

function getHoldingByCph(req, cph) {
  const holdingsData = getHoldingsData(req);

  return holdingsData.holdings.find((holding) => {
    return holding.cph === cph;
  });
}

function getAnimalByEarTag(req, earTagNumber) {
  const cattleData = getCattleData(req);

  return cattleData.animals.find((animal) => {
    return String(animal.earTagNumber || '').toLowerCase() === String(earTagNumber || '').toLowerCase();
  });
}

function getOffspring(req, animal) {
  const cattleData = getCattleData(req);

  return cattleData.animals.filter((record) => {
    return record.dam?.geneticDam?.earTagNumber === animal.earTagNumber;
  });
}


/**
 * Event helpers
 */

function enrichEvent(req, event) {
  const enrichedEvent = {
    ...event,
    animal: getAnimalByEarTag(req, event.animal_id)
  };

  if (event.event_type === 'birth') {
    enrichedEvent.holding = getHoldingByCph(req, event.details?.holding_cph);
  }

  if (event.event_type === 'movement') {
    enrichedEvent.fromHolding = getHoldingByCph(req, event.details?.from_cph);
    enrichedEvent.toHolding = getHoldingByCph(req, event.details?.to_cph);
  }

  if (event.event_type === 'death') {
    enrichedEvent.holding = getHoldingByCph(req, event.details?.holding_cph);
  }

  return enrichedEvent;
}

function getAnimalEvents(req, animal) {
  const eventsData = getEventsData(req);

  return eventsData.events
    .filter((event) => {
      return event.animal_id === animal.earTagNumber;
    })
    .sort((a, b) => {
      return new Date(a.event_date) - new Date(b.event_date);
    })
    .map((event) => {
      return enrichEvent(req, event);
    });
}

function getEventLocationCph(event) {
  if (event.event_type === 'death') {
    return event.details?.holding_cph;
  }

  if (event.event_type === 'movement') {
    return event.details?.to_cph;
  }

  if (event.event_type === 'birth') {
    return event.details?.holding_cph;
  }

  return null;
}

function getCurrentLocation(req, animal, animalEvents) {
  const latestLocationEvent = [...animalEvents]
    .reverse()
    .find((event) => {
      return getEventLocationCph(event);
    });

  const currentCph = latestLocationEvent
    ? getEventLocationCph(latestLocationEvent)
    : animal.cph;

  return {
    cph: currentCph,
    holding: getHoldingByCph(req, currentCph)
  };
}


/**
 * Event search
 */

function getFilteredEvents(req) {
  const eventsData = getEventsData(req);
  const search = String(req.query.search || '').trim();

  const events = eventsData.events
    .map((event) => {
      return enrichEvent(req, event);
    })
    .filter((event) => {
      if (!search) return true;

      const registration = event.details?.registration || {};

      const searchableValues = [
        event.id,
        event.animal_id,
        event.event_type,
        event.event_date,
        event.reported_by,

        event.details?.holding_cph,
        event.details?.from_cph,
        event.details?.to_cph,
        event.details?.reason,
        event.details?.cause,
        event.details?.linked_movement_id,

        registration.status,
        registration.registered_date,
        registration.batch_id,
        registration.defra_reference,

        event.animal?.earTagNumber,
        event.animal?.cph,
        event.animal?.status,
        event.animal?.breed?.name,
        event.animal?.breed?.code,

        event.holding?.holdingName,
        event.holding?.businessName,
        event.holding?.address?.postcode,

        event.fromHolding?.holdingName,
        event.fromHolding?.businessName,
        event.fromHolding?.address?.postcode,

        event.toHolding?.holdingName,
        event.toHolding?.businessName,
        event.toHolding?.address?.postcode
      ];

      return searchableValues.some((value) => {
        return normalise(value).includes(normalise(search));
      });
    })
    .sort((a, b) => {
      return new Date(b.event_date) - new Date(a.event_date);
    });

  return {
    events,
    search
  };
}

function registerEventsRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath, (req, res) => {
    const eventResults = getFilteredEvents(req);

    return res.render(baseURL + '/' + viewPath, {
      events: eventResults.events,
      search: eventResults.search,
      baseURL
    });
  });
}


/**
 * Cattle search
 */

function getFilteredCattle(req) {
  const search = String(req.query.search || '').trim();
  const cattleData = getCattleData(req);

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
  const currentLocation = getCurrentLocation(req, animal, animalEvents);

  return {
    animal,
    offspring,
    animalEvents,
    currentLocation
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
      currentLocation: cattleDetails.currentLocation,
      baseURL
    });
  });
}


/**
 * Holdings search
 */

function getFilteredHoldings(req) {
  const holdingsData = getHoldingsData(req);
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
  const usersData = getUsersData(req);
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
      user.securityWord,
      user.dateJoined,
      user.lastActivityDate
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

registerEventsRoute('events', 'events');

registerCattleRoute('cattle', 'cattle');
registerCattleRoute('cattle2', 'cattle2');
registerCattleRoute('cattle3', 'cattle3');
registerCattleRoute('cattle4', 'cattle4');
registerCattleRoute('holdings/cattle-register', 'holding-cattle-register');
registerCattleRoute('cattle-with-filter', 'cattle-with-filter');

registerHoldingsRoute('holdings', 'holdings');
registerHoldingsRoute('holding-search', 'holding-search');

registerUsersRoute('users', 'users');


/**
 * Event details
 */

router.get('/' + baseURL + '/events/:id', (req, res) => {
  const eventsData = getEventsData(req);

  const event = eventsData.events.find((event) => {
    return event.id === req.params.id;
  });

  if (!event) {
    return res.status(404).render(baseURL + '/404', {
      pageTitle: 'Event not found'
    });
  }

  const enrichedEvent = enrichEvent(req, event);

  let linkedMovement = null;

  if (enrichedEvent.details?.linked_movement_id) {
    const linkedMovementEvent = eventsData.events.find((event) => {
      return event.id === enrichedEvent.details.linked_movement_id;
    });

    if (linkedMovementEvent) {
      linkedMovement = enrichEvent(req, linkedMovementEvent);
    }
  }

  return res.render(baseURL + '/event-details', {
    event: enrichedEvent,
    animal: enrichedEvent.animal,
    linkedMovement,
    baseURL
  });
});


/**
 * Register cattle detail routes
 */

registerCattleDetailsRoute('cattle', 'cattle-details');
registerCattleDetailsRoute('holdings/cattle', 'holding-cattle-details');


/**
 * Holding details
 */

router.get('/' + baseURL + '/holdings/:id', (req, res) => {
  const holdingsData = getHoldingsData(req);
  const usersData = getUsersData(req);

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
  const usersData = getUsersData(req);
  const holdingsData = getHoldingsData(req);

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