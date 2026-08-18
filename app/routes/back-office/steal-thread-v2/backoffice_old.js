const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();


const baseURL = 'livestock-back-office/steal-thread/v2OLD'



module.exports = router

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\//g, '');
}

function getFilteredCattle(req) {
  const search = String(req.query.search || '').trim();
  const cattleData = req.session.data.livestock || { animals: [] };

  const cattle = cattleData.animals.filter((animal) => {
    if (!search) return true;

    const searchableValues = [
      animal.cph,
      animal.earTagNumber,
      animal.sex,
      animal.breed?.name,
      animal.breed?.code,
      animal.status
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




function getCattleDetails(req, earTagNumber) {
  const cattleData = req.session.data.livestock || { animals: [] };

  const animal = cattleData.animals.find((animal) => {
    return animal.earTagNumber.toLowerCase() === String(earTagNumber).toLowerCase();
  });

  if (!animal) {
    return null;
  }

  const offspring = cattleData.animals.filter((record) => {
    return record.dam?.geneticDam?.earTagNumber === animal.earTagNumber;
  });

  return {
    animal,
    offspring
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
      baseURL
    });
  });
}

registerCattleRoute('cattle', 'cattle');
registerCattleRoute('holdings/cattle-register', 'holding-cattle-register');
router.get('/' + baseURL + '/holdings/cattle/:earTagNumber', (req, res) => {
  const cattleData = req.session.data.livestock;

  const animal = cattleData.animals.find(
    (animal) =>
      animal.earTagNumber.toLowerCase() === req.params.earTagNumber.toLowerCase()
  );

  if (!animal) {
    return res.status(404).render(baseURL + '/404', { pageTitle: 'Cattle record not found' });
  }

  const offspring = cattleData.animals.filter(
    (record) => record.dam?.geneticDam?.earTagNumber === animal.earTagNumber
  );

  return res.render(baseURL + '/holding-cattle-details', { animal, offspring });
});




function getFilteredHoldings(req) {


  const holdingsData = req.session.data.holdings_v2 || { holdings: [] };
  const search = String(req.query.search || '').trim();
  const searchTerm = normalise(search);

  console.log('search:', req.query.search);
  console.log('holdings:', holdingsData.holdings.length);

  const holdings = holdingsData.holdings.filter((holding) => {
    if (!search) return true;

    const herdMarks = (holding.herdAndFlockMarks || [])
      .filter((item) => {
        return item.species === 'Cattle';
      })
      .map((item) => {
        return item.mark;
      });

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
      ...herdMarks
    ];

    return searchableValues.some((value) => {
      return normalise(value).includes(searchTerm);
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

registerHoldingsRoute('holdings', 'holdings');
registerHoldingsRoute('holding-search', 'holding-search');


router.get('/' + baseURL + '/holdings/:id', (req, res) => {
  const holdingsData = req.session.data.holdings_v2 || { holdings: [] };
  const usersData = req.session.data.users_v2 || { users: [] };

  const holding = holdingsData.holdings.find((holding) => holding.id === req.params.id);

  if (!holding) {
    return res.status(404).render(baseURL + '/404', { pageName: 'Holding not found' });
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


router.get('/' + baseURL + '/users', (req, res) => {
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

  return res.render(baseURL + '/users', {
    users,
    search,
    baseURL
  });
});


router.get('/' + baseURL + '/users/:id', (req, res) => {
  const usersData = req.session.data.users_v2 || { users: [] };
  const holdingsData = req.session.data.holdings_v2 || { holdings: [] };

  const user = usersData.users.find((user) => user.id === req.params.id);

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