const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

const baseURL = 'livestock-back-office/steal-thread/v3';



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
  return req.session.data.events_v2 || { events: [] };
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

function getHoldingLocationDetails(req, cph) {
  const holding = getHoldingByCph(req, cph);

  if (!holding) {
    return {
      cph: cph || '',
      id: null,
      name: '',
      address: '',
      holdingType: '',
      holdingTypeCode: ''
    };
  }

  const address = holding.address || {};

  const addressParts = [
    address.addressLine1,
    address.addressLine2,
    address.town,
    address.county,
    address.postcode,
    address.country
  ].filter(Boolean);

  return {
    cph: holding.cph,
    id: holding.id,
    name: holding.holdingName || holding.businessName || '',
    address: addressParts.join(', '),
    holdingType: holding.holdingType || '',
    holdingTypeCode: holding.holdingTypeCode || ''
  };
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

function getEventTimestamp(event) {
  const eventDate = String(event.event_date || '').trim();
  const eventTime = String(event.event_time || '00:00').trim();
  const dateMatch = eventDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  const timeMatch = eventTime.match(/^(\d{1,2}):(\d{2})$/);

  if (!dateMatch) return 0;

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;

  const timestamp = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes
  ).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getEventDateTimeAttribute(event) {
  const eventDate = String(event.event_date || '').trim();
  const eventTime = String(event.event_time || '00:00').trim();
  const dateMatch = eventDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  if (!dateMatch) return '';

  const day = String(dateMatch[1]).padStart(2, '0');
  const month = String(dateMatch[2]).padStart(2, '0');
  const year = dateMatch[3];

  return (
    year
    + '-' + month
    + '-' + day
    + 'T' + eventTime
    + ':00'
  );
}

function getEventTimeDisplay(event) {
  const eventTime = String(event.event_time || '').trim();
  const timeMatch = eventTime.match(/^(\d{1,2}):(\d{2})$/);

  if (!timeMatch) return eventTime;

  const hours = Number(timeMatch[1]);
  const minutes = timeMatch[2];
  const suffix = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;

  return displayHours + ':' + minutes + suffix;
}

function getAnimalHistorySummary(animalEvents) {
  return {
    movementRecords: animalEvents.filter((event) => {
      return event.event_type === 'movement';
    }).length,
    passportEvents: animalEvents.filter((event) => {
      return event.event_type === 'passport';
    }).length,
    registrationChanges: animalEvents.filter((event) => {
      return (
        event.event_type === 'registration_change'
        || event.event_type === 'registration_amendment'
      );
    }).length
  };
}

function getAnimalIssues(animalEvents) {
  const resolvedStatuses = new Set([
    'resolved',
    'closed',
    'complete',
    'completed'
  ]);

  const issues = [];

  animalEvents.forEach((event) => {
    const eventStatus = String(event.details?.status || '')
      .trim()
      .toLowerCase();

    if (
      event.event_type === 'movement_issue'
      && !resolvedStatuses.has(eventStatus)
    ) {
      const details = event.details || {};
      const issueType = details.issue_type || 'movement_issue';
      const direction = details.direction || '';
      const holdingCph = details.holding_cph || '';
      const holdingTypeCode = details.holding_type_code || '';
      const movementPairId = details.movement_pair_id || '';
      const holdingLabel = holdingCph
        + (holdingTypeCode ? ' (' + holdingTypeCode + ')' : '');

      let linkText = 'Movement issue';

      if (issueType === 'missing_movement_off') {
        linkText = 'Missing movement off'
          + (holdingLabel ? ' from ' + holdingLabel : '');
      } else if (issueType === 'missing_movement_on') {
        linkText = 'Missing movement on'
          + (holdingLabel ? ' to ' + holdingLabel : '');
      } else if (issueType === 'missing_movement') {
        linkText = 'Missing movement';
      } else if (issueType === 'movement_history_gap') {
        const fromHoldingCph = details.from_holding_cph || '';
        const fromHoldingTypeCode = details.from_holding_type_code || '';
        const toHoldingCph = details.to_holding_cph || '';
        const toHoldingTypeCode = details.to_holding_type_code || '';
        const fromHoldingLabel = fromHoldingCph
          + (fromHoldingTypeCode ? ' (' + fromHoldingTypeCode + ')' : '');
        const toHoldingLabel = toHoldingCph
          + (toHoldingTypeCode ? ' (' + toHoldingTypeCode + ')' : '');

        linkText = details.label
          || (fromHoldingLabel && toHoldingLabel
            ? 'Movement history gap between ' + fromHoldingLabel + ' and ' + toHoldingLabel
            : 'Movement history gap');
      }

      issues.push({
        id: event.id,
        eventId: event.id,
        area: 'movements',
        issueType,
        direction,
        holdingCph,
        holdingTypeCode,
        movementPairId,
        anchorId: movementPairId
          ? 'movement-' + movementPairId
          : '',
        linkText,
        title: linkText,
        description: details.reason || 'This movement needs attention.'
      });
    }

    const eventIssues = Array.isArray(event.issues)
      ? event.issues
      : [];

    eventIssues.forEach((issue, index) => {
      if (typeof issue === 'string') {
        issues.push({
          id: event.id + '-issue-' + index,
          eventId: event.id,
          area: event.event_type === 'movement' ? 'movements' : 'events',
          linkText: issue,
          title: issue,
          description: ''
        });
        return;
      }

      const issueStatus = String(issue.status || '')
        .trim()
        .toLowerCase();

      if (resolvedStatuses.has(issueStatus)) return;

      const issueTitle = (
        issue.title
        || issue.description
        || issue.code
        || 'Issue'
      );

      issues.push({
        id: issue.id || issue.code || event.id + '-issue-' + index,
        eventId: event.id,
        area: event.event_type === 'movement' ? 'movements' : 'events',
        linkText: issueTitle,
        title: issueTitle,
        description: issue.title
          ? (issue.description || issue.guidance || '')
          : (issue.guidance || '')
      });
    });
  });

  return issues;
}


function getMovementHoldingType(req, cph, rawType, rawCode) {
  if (rawCode) {
    const labelsByCode = {
      AH: 'Agricultural holding',
      MA: 'Market',
      SL: 'Slaughterhouse or abattoir',
      CA: 'Collection or assembly centre',
      CC: 'Showground or temporary holding'
    };

    return {
      code: rawCode,
      label: labelsByCode[rawCode] || rawType || rawCode
    };
  }

  const normalisedType = String(rawType || '').toLowerCase();
  const types = {
    farm: { code: 'AH', label: 'Agricultural holding' },
    'agricultural holding': { code: 'AH', label: 'Agricultural holding' },
    market: { code: 'MA', label: 'Market' },
    abattoir: { code: 'SL', label: 'Slaughterhouse or abattoir' },
    slaughterhouse: { code: 'SL', label: 'Slaughterhouse or abattoir' },
    'collection-centre': { code: 'CA', label: 'Collection or assembly centre' },
    'collection centre': { code: 'CA', label: 'Collection or assembly centre' },
    showground: { code: 'CC', label: 'Showground or temporary holding' }
  };

  if (types[normalisedType]) {
    return types[normalisedType];
  }

  const location = getHoldingLocationDetails(req, cph);

  return {
    code: location.holdingTypeCode || '',
    label: location.holdingType || rawType || ''
  };
}

function getReporterLabel(value) {
  const reporter = String(value || '').trim();

  if (!reporter) return '';
  if (reporter.toLowerCase() === 'keeper') return 'Keeper';
  if (reporter.toLowerCase() === 'abattoir') return 'Abattoir';
  if (reporter.toLowerCase() === 'bcms') return 'BCMS';

  return reporter.charAt(0).toUpperCase() + reporter.slice(1);
}

function getAnimalMovementHistory(req, animalEvents) {
  const groups = new Map();
  const resolvedStatuses = new Set([
    'resolved',
    'closed',
    'complete',
    'completed'
  ]);

  function getGroup(pairId) {
    if (!groups.has(pairId)) {
      groups.set(pairId, {
        pairId,
        offEvent: null,
        onEvent: null,
        issueEvent: null
      });
    }

    return groups.get(pairId);
  }

  animalEvents.forEach((event) => {
    if (event.event_type !== 'movement') return;

    const pairId = event.details?.movement_pair_id || event.id;
    const group = getGroup(pairId);

    if (event.details?.direction === 'off') {
      group.offEvent = event;
    } else if (event.details?.direction === 'on') {
      group.onEvent = event;
    }
  });

  animalEvents.forEach((event) => {
    if (event.event_type !== 'movement_issue') return;

    const status = String(event.details?.status || '').trim().toLowerCase();
    if (resolvedStatuses.has(status)) return;

    const pairId = event.details?.movement_pair_id;
    if (!pairId) return;

    getGroup(pairId).issueEvent = event;
  });

  return Array.from(groups.values())
    .map((group) => {
      const details = group.issueEvent?.details || {};
      const issueType = details.issue_type || '';
      const isGap = issueType === 'movement_history_gap';
      const missingOff = issueType === 'missing_movement_off';
      const missingOn = issueType === 'missing_movement_on';

      const fromCph = isGap
        ? details.from_holding_cph
        : (
          group.offEvent?.details?.from_cph
          || (missingOff ? details.holding_cph : '')
        );

      const toCph = isGap
        ? details.to_holding_cph
        : (
          group.onEvent?.details?.to_cph
          || (missingOn ? details.holding_cph : '')
        );

      const fromType = getMovementHoldingType(
        req,
        fromCph,
        isGap ? details.from_holding_type : group.offEvent?.details?.off_holding_type,
        isGap
          ? details.from_holding_type_code
          : (missingOff ? details.holding_type_code : '')
      );

      const toType = getMovementHoldingType(
        req,
        toCph,
        isGap ? details.to_holding_type : group.onEvent?.details?.to_holding_type,
        isGap
          ? details.to_holding_type_code
          : (missingOn ? details.holding_type_code : '')
      );

      const movementTimestamps = [group.offEvent, group.onEvent]
        .filter(Boolean)
        .map((event) => getEventTimestamp(event));

      let sortTimestamp = movementTimestamps.length
        ? Math.min(...movementTimestamps)
        : 0;

      if (isGap && details.history_sort_date) {
        sortTimestamp = getEventTimestamp({
          event_date: details.history_sort_date,
          event_time: '00:00'
        });
      }

      return {
        pairId: group.pairId,
        offEvent: group.offEvent,
        onEvent: group.onEvent,
        issueEvent: group.issueEvent,
        issueType,
        hasIssue: Boolean(group.issueEvent),
        missingOff,
        missingOn,
        fromCph,
        toCph,
        fromType,
        toType,
        offReportedBy: getReporterLabel(group.offEvent?.reported_by),
        onReportedBy: getReporterLabel(group.onEvent?.reported_by),
        sortTimestamp
      };
    })
    .filter((movement) => {
      return movement.fromCph || movement.toCph;
    })
    .sort((a, b) => {
      return a.sortTimestamp - b.sortTimestamp;
    });
}

function enrichEvent(req, event) {
  const enrichedEvent = {
    ...event,
    event_datetime: getEventDateTimeAttribute(event),
    event_time_display: getEventTimeDisplay(event),
    animal: getAnimalByEarTag(req, event.animal_id),
    holdings: {}
  };

  if (event.event_type === 'birth') {
    enrichedEvent.holding = getHoldingByCph(
      req,
      event.details?.holding_cph
    );

    enrichedEvent.holdings.location = getHoldingLocationDetails(
      req,
      event.details?.holding_cph
    );
  }

  if (event.event_type === 'movement') {
    enrichedEvent.fromHolding = getHoldingByCph(
      req,
      event.details?.from_cph
    );

    enrichedEvent.toHolding = getHoldingByCph(
      req,
      event.details?.to_cph
    );

    enrichedEvent.holdings.from = getHoldingLocationDetails(
      req,
      event.details?.from_cph
    );

    enrichedEvent.holdings.to = getHoldingLocationDetails(
      req,
      event.details?.to_cph
    );
  }

  if (event.event_type === 'death') {
    enrichedEvent.holding = getHoldingByCph(
      req,
      event.details?.holding_cph
    );

    enrichedEvent.holdings.location = getHoldingLocationDetails(
      req,
      event.details?.holding_cph
    );
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
      return getEventTimestamp(a) - getEventTimestamp(b);
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

function getAnimalLocations(req, animal, animalEvents) {
  const birthEvent = animalEvents.find((event) => {
    return (
      event.event_type === 'birth'
      && event.details?.holding_cph
    );
  });

  const birthCph = birthEvent?.details?.holding_cph || animal.cph;

  const latestLocationEvent = [...animalEvents]
    .reverse()
    .find((event) => {
      return getEventLocationCph(event);
    });

  const currentCph = latestLocationEvent
    ? getEventLocationCph(latestLocationEvent)
    : animal.cph;

  const latestMovementToCurrent = [...animalEvents]
    .reverse()
    .find((event) => {
      return (
        event.event_type === 'movement'
        && event.details?.to_cph === currentCph
      );
    });

  return {
    current: {
      ...getHoldingLocationDetails(req, currentCph),
      movementDate: latestMovementToCurrent
        ? latestMovementToCurrent.event_date
        : null
    },
    birth: getHoldingLocationDetails(req, birthCph)
  };
}


/**
 * Event search and export
 */

function getQueryValues(value) {
  if (!value) return [];

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => {
      return String(item).split(',');
    })
    .map((item) => {
      return item.trim();
    })
    .filter((item) => {
      return item && item !== '_unchecked';
    })
    .filter((item, index, items) => {
      return items.indexOf(item) === index;
    });
}

function normaliseFilterValue(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
}

function parseFilterDate(value, useEndOfDay) {
  const input = String(value || '').trim();

  if (!input) return null;

  let year;
  let month;
  let day;

  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const ukMatch = input.match(/^(\d{1,2})[\/\-.\s](\d{1,2})[\/\-.\s](\d{4})$/);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (ukMatch) {
    day = Number(ukMatch[1]);
    month = Number(ukMatch[2]);
    year = Number(ukMatch[3]);
  } else {
    const parsedDate = new Date(input);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  const hours = useEndOfDay ? 23 : 0;
  const minutes = useEndOfDay ? 59 : 0;
  const seconds = useEndOfDay ? 59 : 0;
  const milliseconds = useEndOfDay ? 999 : 0;

  const parsedDate = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    seconds,
    milliseconds
  );

  const isValidDate = (
    parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day
  );

  return isValidDate ? parsedDate : null;
}

function getEventStatusValues(event) {
  const values = [
    event.status,
    event.event_status,
    event.details?.status,
    event.details?.registration?.status
  ];

  if (event.completed === true) {
    values.push('completed');
  }

  if (event.completed === false) {
    values.push('in-progress');
  }

  return values
    .filter(Boolean)
    .map((value) => {
      return normaliseFilterValue(value);
    });
}

function getEventAttentionValues(event) {
  const explicitValues = getQueryValues(
    event.attention || event.attention_type || event.attentionType
  ).map((value) => {
    return normaliseFilterValue(value);
  });

  const issues = Array.isArray(event.issues) ? event.issues : [];

  const movementIssueStatus = String(event.details?.status || '')
    .trim()
    .toLowerCase();

  const movementIssueIsOpen = (
    event.event_type === 'movement_issue'
    && ![
      'resolved',
      'closed',
      'complete',
      'completed'
    ].includes(movementIssueStatus)
  );

  const hasIssue = (
    explicitValues.includes('issue')
    || event.has_issue === true
    || event.hasIssue === true
    || issues.length > 0
    || movementIssueIsOpen
  );

  const needsReview = (
    explicitValues.includes('review')
    || event.needs_review === true
    || event.needsReview === true
    || event.review_required === true
  );

  const values = [];

  if (hasIssue) values.push('issue');
  if (needsReview) values.push('review');

  if (!hasIssue && !needsReview) {
    values.push('none');
  }

  return values;
}

function eventMatchesSearch(event, search) {
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
    event.details?.movement_pair_id,
    event.details?.issue_type,
    event.details?.direction,
    event.details?.holding_type_code,

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
}

function eventMatchesHolding(event, holdingSearch) {
  if (!holdingSearch) return true;

  const holdingValues = [
    event.details?.holding_cph,
    event.details?.from_cph,
    event.details?.to_cph,

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

  return holdingValues.some((value) => {
    return normalise(value).includes(normalise(holdingSearch));
  });
}

function getFilteredEvents(req) {
  const eventsData = getEventsData(req);

  const criteria = {
    search: String(req.query.search || '').trim(),
    eventTypes: getQueryValues(req.query.eventType),
    attention: getQueryValues(req.query.attention),
    statuses: getQueryValues(req.query.status),
    dateFrom: String(req.query.dateFrom || '').trim(),
    dateTo: String(req.query.dateTo || '').trim(),
    holding: String(req.query.holding || '').trim(),
    reportedBy: String(req.query.reportedBy || '').trim(),
    sort: req.query.sort === 'oldest' ? 'oldest' : 'newest'
  };

  const selectedEventTypes = criteria.eventTypes.map((value) => {
    return normaliseFilterValue(value);
  });

  const selectedAttention = criteria.attention.map((value) => {
    return normaliseFilterValue(value);
  });

  const selectedStatuses = criteria.statuses.map((value) => {
    return normaliseFilterValue(value);
  });

  const dateFrom = parseFilterDate(criteria.dateFrom, false);
  const dateTo = parseFilterDate(criteria.dateTo, true);

  const events = eventsData.events
    .map((event) => {
      return enrichEvent(req, event);
    })
    .filter((event) => {
      return eventMatchesSearch(event, criteria.search);
    })
    .filter((event) => {
      if (selectedEventTypes.length === 0) return true;

      return selectedEventTypes.includes(
        normaliseFilterValue(event.event_type)
      );
    })
    .filter((event) => {
      if (selectedAttention.length === 0) return true;

      const eventAttention = getEventAttentionValues(event);

      return selectedAttention.some((value) => {
        return eventAttention.includes(value);
      });
    })
    .filter((event) => {
      if (selectedStatuses.length === 0) return true;

      const eventStatuses = getEventStatusValues(event);

      return selectedStatuses.some((value) => {
        return eventStatuses.includes(value);
      });
    })
    .filter((event) => {
      const eventDate = new Date(event.event_date);

      if (Number.isNaN(eventDate.getTime())) {
        return !dateFrom && !dateTo;
      }

      if (dateFrom && eventDate < dateFrom) return false;
      if (dateTo && eventDate > dateTo) return false;

      return true;
    })
    .filter((event) => {
      return eventMatchesHolding(event, criteria.holding);
    })
    .filter((event) => {
      if (!criteria.reportedBy) return true;

      return normaliseFilterValue(event.reported_by)
        === normaliseFilterValue(criteria.reportedBy);
    })
    .sort((a, b) => {
      const aDate = new Date(a.event_date).getTime();
      const bDate = new Date(b.event_date).getTime();
      const safeADate = Number.isNaN(aDate) ? 0 : aDate;
      const safeBDate = Number.isNaN(bDate) ? 0 : bDate;

      if (criteria.sort === 'oldest') {
        return safeADate - safeBDate;
      }

      return safeBDate - safeADate;
    });

  return {
    events,
    criteria,
    selectedEventTypes: criteria.eventTypes,
    selectedAttention: criteria.attention,
    selectedStatuses: criteria.statuses
  };
}

function appendQueryValue(params, name, value) {
  const values = getQueryValues(value);

  values.forEach((item) => {
    params.append(name, item);
  });
}

function createEventsExportUrl(req) {
  const params = new URLSearchParams();

  Object.entries(req.query).forEach(([name, value]) => {
    if (name === 'page') return;

    appendQueryValue(params, name, value);
  });

  const queryString = params.toString();

  return (
    '/' + baseURL + '/events/export'
    + (queryString ? '?' + queryString : '')
  );
}

function csvValue(value) {
  const text = String(value ?? '');

  return '"' + text.replace(/"/g, '""') + '"';
}

function getEventIssueCodes(event) {
  const codes = [];

  if (
    event.event_type === 'movement_issue'
    && event.details?.issue_type
  ) {
    codes.push(event.details.issue_type);
  }

  if (Array.isArray(event.issues)) {
    event.issues.forEach((issue) => {
      if (typeof issue === 'string') {
        codes.push(issue);
        return;
      }

      const code = issue.code || issue.id || issue.type || '';
      if (code) codes.push(code);
    });
  }

  return codes.join('; ');
}

function createEventsCsv(events) {
  const headings = [
    'Event reference',
    'Event date',
    'Event type',
    'Animal ear tag',
    'Event status',
    'Attention',
    'Issue codes',
    'Holding CPH',
    'From CPH',
    'To CPH',
    'Reported by',
    'Reason or cause'
  ];

  const rows = events.map((event) => {
    const statuses = getEventStatusValues(event).join('; ');
    const attention = getEventAttentionValues(event).join('; ');

    return [
      event.id,
      event.event_date,
      event.event_type,
      event.animal_id,
      statuses,
      attention,
      getEventIssueCodes(event),
      event.details?.holding_cph,
      event.details?.from_cph,
      event.details?.to_cph,
      event.reported_by,
      event.details?.reason || event.details?.cause
    ].map(csvValue).join(',');
  });

  return '\uFEFF' + [
    headings.map(csvValue).join(','),
    ...rows
  ].join('\r\n');
}

function registerEventsRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath, (req, res) => {
    const eventResults = getFilteredEvents(req);

    return res.render(baseURL + '/' + viewPath, {
      events: eventResults.events,
      criteria: eventResults.criteria,
      search: eventResults.criteria.search,
      selectedEventTypes: eventResults.selectedEventTypes,
      selectedAttention: eventResults.selectedAttention,
      selectedStatuses: eventResults.selectedStatuses,
      exportUrl: createEventsExportUrl(req),
      query: req.query,
      sort: eventResults.criteria.sort,
      baseURL
    });
  });
}

function registerEventsExportRoute() {
  router.get('/' + baseURL + '/events/export', (req, res) => {
    const eventResults = getFilteredEvents(req);
    const csv = createEventsCsv(eventResults.events);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="filtered-events.csv"'
    );

    return res.status(200).send(csv);
  });
}


/**
 * Cattle search
 */
function getHoldingForAnimal(req, animal) {
  const holdingsData = getHoldingsData(req);

  return holdingsData.holdings.find((holding) => {
    return normalise(holding.cph) === normalise(animal.cph);
  });
}
function getFilteredCattle(req) {
  const search = String(req.query.search || '').trim();
  const cattleData = getCattleData(req);
  const searchTerm = normalise(search);

  const cattle = cattleData.animals
    .map((animal) => {
      const holding = getHoldingForAnimal(req, animal);

      return {
        ...animal,
        holding
      };
    })
    .filter((animal) => {
      if (!search) return true;

      const earTagMatches = normalise(
        animal.earTagNumber
      ).includes(searchTerm);

      const cphMatches = normalise(
        animal.cph
      ) === searchTerm;
      // just so I can see all
       const statusMatches = normalise(
          animal.status
       ) === searchTerm;

      return earTagMatches || cphMatches || statusMatches;
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
  const historySummary = getAnimalHistorySummary(animalEvents);

  const animalIssues = getAnimalIssues(animalEvents);
  const issueCount = animalIssues.length;

  const currentLocation = getCurrentLocation(req, animal, animalEvents);
  const animalLocations = getAnimalLocations(
    req,
    animal,
    animalEvents
  );

  const hasRecordedDeathLocation = animalEvents.some((event) => {
    return (
      event.event_type === 'death'
      && event.details?.holding_cph
    );
  });

  let locationHeading = 'Last known location';

  if (animal.status === 'Alive') {
    locationHeading = 'Current location';
  } else if (
    animal.status === 'Deceased'
    && hasRecordedDeathLocation
  ) {
    locationHeading = 'Location at death';
  }

  return {
    animal,
    offspring,
    animalEvents,
    currentLocation,
    animalLocations,
    locationHeading,
    historySummary,
    animalIssues,
    issueCount
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
      animalLocations: cattleDetails.animalLocations,
      locationHeading: cattleDetails.locationHeading,
      historySummary: cattleDetails.historySummary,
      animalIssues: cattleDetails.animalIssues,
      issueCount: cattleDetails.issueCount,
      baseURL
    });
  });
}

function registerCattleHistoryRoute(urlPath, viewPath) {
  router.get(
    '/' + baseURL + '/' + urlPath + '/:earTagNumber/cattle-history',
    (req, res) => {
      const cattleDetails = getCattleDetails(
        req,
        req.params.earTagNumber
      );

      if (!cattleDetails) {
        return res.status(404).render(baseURL + '/404', {
          pageTitle: 'Cattle record not found'
        });
      }

      const movementHistory = getAnimalMovementHistory(
        req,
        cattleDetails.animalEvents
      );

      const deathEvent = [...cattleDetails.animalEvents]
        .reverse()
        .find((event) => {
          return event.event_type === 'death';
        });

      return res.render(baseURL + '/' + viewPath, {
        animal: cattleDetails.animal,
        movementHistory,
        deathEvent,
        animalLocations: cattleDetails.animalLocations,
        animalIssues: cattleDetails.animalIssues,
        issueCount: cattleDetails.issueCount,
        baseURL
      });
    }
  );
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
 * Global search
 */
function getGlobalSearchResults(req) {
  const search = String(req.query.search || '').trim();
  const searchTerm = normalise(search);
  const previewLimit = 5;

  if (!search) {
    return {
      search,
      animals: [],
      holdings: [],
      keepers: [],
      animalCount: 0,
      holdingCount: 0,
      keeperCount: 0,
      totalResults: 0,
      previewLimit
    };
  }

  const cattleData = getCattleData(req);
  const holdingsData = getHoldingsData(req);
  const usersData = getUsersData(req);

  const animalResults = cattleData.animals
    .map((animal) => {
      return {
        ...animal,
        holding: getHoldingForAnimal(req, animal)
      };
    })
    .filter((animal) => {
      const earTagMatches = normalise(
        animal.earTagNumber
      ).includes(searchTerm);

      const cphMatches = normalise(
        animal.cph
      ) === searchTerm;

      return earTagMatches || cphMatches;
    });

  const holdingResults = holdingsData.holdings.filter((holding) => {
    const herdAndFlockMarks = (holding.herdAndFlockMarks || []).map((item) => {
      return item.mark;
    });

    const searchableValues = [
      holding.cph,
      holding.holdingName,
      holding.businessName,
      holding.address?.town,
      holding.address?.county,
      holding.address?.postcode,
      ...herdAndFlockMarks
    ];

    return searchableValues.some((value) => {
      return normalise(value).includes(searchTerm);
    });
  });

  const keeperResults = usersData.users.filter((user) => {
    const searchableValues = [
      user.name,
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.address?.postcode,
      user.postcode
    ];

    return searchableValues.some((value) => {
      return normalise(value).includes(searchTerm);
    });
  });

  return {
    search,
    animals: animalResults.slice(0, previewLimit),
    holdings: holdingResults.slice(0, previewLimit),
    keepers: keeperResults.slice(0, previewLimit),
    animalCount: animalResults.length,
    holdingCount: holdingResults.length,
    keeperCount: keeperResults.length,
    totalResults: (
      animalResults.length
      + holdingResults.length
      + keeperResults.length
    ),
    previewLimit
  };
}

function registerGlobalSearchRoute(urlPath, viewPath) {
  router.get('/' + baseURL + '/' + urlPath, (req, res) => {
    const results = getGlobalSearchResults(req);

    return res.render(baseURL + '/' + viewPath, {
      search: results.search,
      animals: results.animals,
      holdings: results.holdings,
      keepers: results.keepers,
      animalCount: results.animalCount,
      holdingCount: results.holdingCount,
      keeperCount: results.keeperCount,
      totalResults: results.totalResults,
      previewLimit: results.previewLimit,
      encodedSearch: encodeURIComponent(results.search),
      baseURL
    });
  });
}


/**
 * Register list/search routes first
 */

registerEventsRoute('events', 'events');
registerEventsExportRoute();

registerCattleRoute('cattle', 'cattle');
registerCattleRoute('cattle2', 'cattle2');
registerCattleRoute('cattle3', 'cattle3');
registerCattleRoute('cattle4', 'cattle4');
registerCattleRoute('holdings/cattle-register', 'holding-cattle-register');
registerCattleRoute('cattle-with-filter', 'cattle-with-filter');

registerHoldingsRoute('holdings', 'holdings');
registerHoldingsRoute('holding-search', 'holding-search');

registerUsersRoute('users', 'users');
registerGlobalSearchRoute('search','global-search');


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
 * Cattle register for a holding
 */
router.get('/' + baseURL + '/holdings/:id/cattle-register', (req, res) => {
   const cattleResults = getFilteredCattle(req);
   const holdingsData = getHoldingsData(req);


        const holding = holdingsData.holdings.find((holding) => {
            return holding.id === req.params.id;
        });

        if (!holding) {
            return res.status(404).render(baseURL + '/404', {
                pageTitle: 'Holding not found'
            });
        }
   return res.render(baseURL + '/holding-cattle-register', {
      cattle: cattleResults.cattle,
      search: cattleResults.search,
      holding,
      baseURL
    });
});
/**
 * Animal error record
 */
router.get('/' + baseURL + '/holdings/:id/animal-error-record', (req, res) => {
    const holdingsData = getHoldingsData(req);

    const holding = holdingsData.holdings.find((holding) => {
        return holding.id === req.params.id;
    });

    if (!holding) {
        return res.status(404).render(baseURL + '/404', {
            pageTitle: 'Holding not found'
        });
    }

    return res.render(baseURL + '/holding-error-record', {
        holding,
        baseURL
    });
});

function registerCattleActivityRoute(urlPath, viewPath) {
  router.get(
    '/' + baseURL + '/' + urlPath + '/:earTagNumber/cattle-activity',
    (req, res) => {
      const cattleDetails = getCattleDetails(
        req,
        req.params.earTagNumber
      );

      if (!cattleDetails) {
        return res.status(404).render(baseURL + '/404', {
          pageTitle: 'Cattle record not found'
        });
      }

      return res.render(baseURL + '/' + viewPath, {
        animal: cattleDetails.animal,
        animalIssues: cattleDetails.animalIssues,
        issueCount: cattleDetails.issueCount,
        baseURL
      });
    }
  );
}
/**
 * Register cattle detail routes
 */

registerCattleDetailsRoute('cattle', 'cattle-details');
registerCattleHistoryRoute('cattle', 'cattle-history');
registerCattleActivityRoute('cattle', 'cattle-activity');

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


/**
 * Keeper holdings
 */
router.get('/' + baseURL + '/users/:id/holdings', (req, res) => {
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

  return res.render(baseURL + '/user-holdings', {
    user,
    userHoldings,
    baseURL
  });
});


/**
 * Keeper activity
 */
router.get('/' + baseURL + '/users/:id/activity', (req, res) => {
  const usersData = getUsersData(req);

  const user = usersData.users.find((user) => {
    return user.id === req.params.id;
  });

  if (!user) {
    return res.status(404).render(baseURL + '/404', {
      pageName: 'User not found'
    });
  }

  return res.render(baseURL + '/user-activity', {
    user,
    baseURL
  });
});