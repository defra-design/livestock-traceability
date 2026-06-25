const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();


const baseURL = 'livestock-back-office/v1'

module.exports = router

router.get('/' + baseURL + '/cattle', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const cattleData = req.session.data.livestock;

  const cattle = cattleData.animals.filter((animal) => {
    if (!search) return true;
    const searchableValues = [
      animal.cph,
      animal.earTagNumber,
      animal.dateOfBirth,
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
    return searchableValues.some((value) =>
      String(value || '').toLowerCase().includes(search)
    );
  });

  res.render(baseURL + '/cattle', { cattle, search });
});

router.get('/' + baseURL + '/cattle/:earTagNumber', (req, res) => {
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

  return res.render(baseURL + '/cattle-details', { animal, offspring });
});

router.get('/' + baseURL + '/holdings', (req, res) => {
  const holdingsData = req.session.data.holdings;
  const search = String(req.query.search || '').trim().toLowerCase();

  const holdings = holdingsData.holdings.filter((holding) => {
    if (!search) return true;
    const searchableValues = [
      holding.cph,
      holding.holdingName,
      holding.address?.town,
      holding.address?.county,
      holding.address?.postcode,
      holding.status,
      ...(holding.species || [])
    ];
    return searchableValues.some((value) =>
      String(value || '').toLowerCase().includes(search)
    );
  });

  res.render(baseURL + '/holdings', { holdings, search });
});

router.get('/' + baseURL + '/holdings/:id', (req, res) => {
  const holdingsData = req.session.data.holdings;
  const holding = holdingsData.holdings.find((holding) => holding.id === req.params.id);

  if (!holding) {
    return res.status(404).render(baseURL + '/404', { pageName: 'Holding not found' });
  }

  return res.render(baseURL + '/holding-details', { holding });
});