const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const baseURL = 'livestock-back-office/claim-cph/v1'

const RECOVERY_QUESTIONS = {
  sbi: {
    key: 'sbi',
    type: 'single',
    heading: 'What is the Single Business Identifier (SBI) for the business linked to this holding?',
    shortLabel: 'SBI',
    hint: 'The SBI is a 9-digit number issued by the Rural Payments Agency. For example, 123456789.',
    inputMode: 'numeric',
    classes: 'govuk-input--width-10',
    riskLabel: 'Higher confidence'
  },
  lastBirthEarTag: {
    key: 'lastBirthEarTag',
    type: 'single',
    heading: 'What is the full ear tag number of the last calf birth recorded for this holding?',
    shortLabel: 'Last recorded calf birth',
    hint: 'Enter the full ear tag number, including UK. For example, UK 123456 123456.',
    classes: 'govuk-input--width-20',
    riskLabel: 'Higher confidence'
  },
  lastMovementOn: {
    key: 'lastMovementOn',
    type: 'movement',
    heading: 'What was the last cattle movement onto this holding?',
    shortLabel: 'Last movement onto the holding',
    dateLabel: 'Date of the movement',
    tagLabel: 'Last 4 digits of the ear tag number',
    riskLabel: 'Higher confidence'
  },
  lastMovementOff: {
    key: 'lastMovementOff',
    type: 'movement',
    heading: 'What was the last cattle movement off this holding?',
    shortLabel: 'Last movement off the holding',
    dateLabel: 'Date of the movement',
    tagLabel: 'Last 4 digits of the ear tag number',
    riskLabel: 'Higher confidence'
  },
  memorableWord: {
    key: 'memorableWord',
    type: 'single',
    heading: 'What is the memorable word for the existing account?',
    shortLabel: 'Memorable word',
    hint: 'Enter the memorable word that was set up on the existing account. It is not case sensitive.',
    inputType: 'password',
    autocomplete: 'off',
    classes: 'govuk-input--width-20',
    riskLabel: 'Medium confidence'
  },
  herdMark: {
    key: 'herdMark',
    type: 'single',
    heading: 'What is the cattle herd mark for this holding?',
    shortLabel: 'Cattle herd mark',
    hint: 'The herd mark is the first 6 digits of a cattle ear tag number. For example, 123456.',
    inputMode: 'numeric',
    classes: 'govuk-input--width-10',
    riskLabel: 'Medium confidence'
  },
  animalCount: {
    key: 'animalCount',
    type: 'single',
    heading: 'How many cattle are shown on this holding?',
    shortLabel: 'Number of cattle shown',
    hint: 'Enter the total currently shown in the existing cattle service.',
    inputMode: 'numeric',
    classes: 'govuk-input--width-5',
    riskLabel: 'Medium confidence'
  }
}

const RECOVERY_QUESTION_ORDER = [
  'sbi',
  'lastBirthEarTag',
  'lastMovementOn',
  'lastMovementOff',
  'memorableWord',
  'herdMark',
  'animalCount'
]

const DEFAULT_RECOVERY_QUESTION_KEYS = [
  'sbi',
  'lastBirthEarTag',
  'lastMovementOff'
]

// These values let the prototype demonstrate all 3 outcomes before the
// holdings fixture has recoveryAnswers added to each holding record.
const DEFAULT_DEMO_RECOVERY_ANSWERS = {
  sbi: '123456789',
  lastBirthEarTag: 'UK123456123456',
  lastMovementOn: {
    date: '2026-06-15',
    earTagLast4: '3456'
  },
  lastMovementOff: {
    date: '2026-06-20',
    earTagLast4: '7890'
  },
  memorableWord: 'bluebell',
  herdMark: '123456',
  animalCount: '42'
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// The holdings fixture is loaded into session data elsewhere in the prototype.
// Expected shape: request.session.data.holdings = { holdings: [...] }
function getHoldingsData (request) {
  return request.session.data.holdings || { holdings: [] }
}

function getSourceHoldings (request) {
  const holdingsData = getHoldingsData(request)
  return Array.isArray(holdingsData.holdings) ? holdingsData.holdings : []
}

function getSourceHoldingById (request, holdingId) {
  return getSourceHoldings(request).find(holding => holding.id === holdingId)
}

function normaliseCph (value = '') {
  const digits = String(value).trim().replace(/[\s/-]/g, '')

  if (!/^\d{9}$/.test(digits)) {
    return null
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 5)}/${digits.slice(5)}`
}

function normalisePostcode (value = '') {
  const compact = String(value).toUpperCase().replace(/\s+/g, '')
  const postcodePattern = /^(GIR0AA|(?:[A-PR-UWYZ][0-9][0-9A-HJKSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9][0-9ABEHMNPRV-Y]?)[0-9][ABD-HJLNP-UW-Z]{2})$/

  if (!postcodePattern.test(compact)) {
    return null
  }

  return `${compact.slice(0, -3)} ${compact.slice(-3)}`
}

function findHolding (request, cphNumber, postcode) {
  return getSourceHoldings(request).find(holding => {
    const storedCph = normaliseCph(holding.cph)
    const storedPostcode = normalisePostcode(holding.address?.postcode)

    return storedCph === cphNumber && storedPostcode === postcode
  })
}

function getHoldingsToLink (request) {
  return Array.isArray(request.session.data.holdingsToLink)
    ? request.session.data.holdingsToLink
    : []
}

function getRecoverySettings (request) {
  const savedQuestions = request.session.data.claimCphSettings?.questions
  const validSavedQuestions = Array.isArray(savedQuestions) &&
    savedQuestions.length === 3 &&
    savedQuestions.every(key => RECOVERY_QUESTIONS[key])

  return {
    questions: validSavedQuestions
      ? RECOVERY_QUESTION_ORDER.filter(key => savedQuestions.includes(key))
      : [...DEFAULT_RECOVERY_QUESTION_KEYS]
  }
}

function getRecoveryAnswers (request) {
  const answers = request.session.data.claimCphRecoveryAnswers
  return answers && typeof answers === 'object' ? answers : {}
}

function clearRecoveryJourney (request) {
  delete request.session.data.claimCphRecoveryAnswers
  delete request.session.data.claimCphRecoveryResult
}

function normaliseEarTag (value = '') {
  const compact = String(value).toUpperCase().replace(/[\s/-]/g, '')
  return /^UK\d{12}$/.test(compact) ? compact : null
}

function formatEarTag (value = '') {
  const compact = normaliseEarTag(value)
  if (!compact) return String(value)
  return `${compact.slice(0, 2)} ${compact.slice(2, 8)} ${compact.slice(8)}`
}

function normaliseHerdMark (value = '') {
  const compact = String(value).toUpperCase().replace(/[\s/-]/g, '')
  const digits = compact.startsWith('UK') ? compact.slice(2) : compact
  return /^\d{6}$/.test(digits) ? digits : null
}

function normaliseSbi (value = '') {
  const compact = String(value).replace(/\s+/g, '')
  return /^\d{9}$/.test(compact) ? compact : null
}

function normaliseLast4 (value = '') {
  const compact = String(value).replace(/\s+/g, '')
  return /^\d{4}$/.test(compact) ? compact : null
}

function normaliseAnimalCount (value = '') {
  const compact = String(value).trim()
  if (!/^\d+$/.test(compact)) return null

  const number = Number(compact)
  return Number.isSafeInteger(number) && number >= 0 ? String(number) : null
}

function normaliseMemorableWord (value = '') {
  const normalised = String(value).trim().toLowerCase()
  return normalised || null
}

function parseDateParts (dayValue, monthValue, yearValue) {
  const dayText = String(dayValue || '').trim()
  const monthText = String(monthValue || '').trim()
  const yearText = String(yearValue || '').trim()

  if (!dayText && !monthText && !yearText) {
    return { error: 'Enter the date of the movement' }
  }

  if (!dayText || !monthText || !yearText) {
    return { error: 'Enter a complete date for the movement' }
  }

  if (!/^\d{1,2}$/.test(dayText) || !/^\d{1,2}$/.test(monthText) || !/^\d{4}$/.test(yearText)) {
    return { error: 'Enter a real date for the movement' }
  }

  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  const date = new Date(Date.UTC(year, month - 1, day))

  const isRealDate = date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  if (!isRealDate) {
    return { error: 'Enter a real date for the movement' }
  }

  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  if (date.getTime() > todayUtc) {
    return { error: 'The movement date must be today or in the past' }
  }

  return {
    day: String(day),
    month: String(month),
    year: String(year),
    iso: `${yearText}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    display: `${day} ${MONTH_NAMES[month - 1]} ${year}`
  }
}

function getExpectedRecoveryAnswers (request, holdingId) {
  const sourceHolding = getSourceHoldingById(request, holdingId)
  const sourceAnswers = sourceHolding?.recoveryAnswers || {}

  return {
    ...DEFAULT_DEMO_RECOVERY_ANSWERS,
    ...sourceAnswers,
    lastMovementOn: {
      ...DEFAULT_DEMO_RECOVERY_ANSWERS.lastMovementOn,
      ...(sourceAnswers.lastMovementOn || {})
    },
    lastMovementOff: {
      ...DEFAULT_DEMO_RECOVERY_ANSWERS.lastMovementOff,
      ...(sourceAnswers.lastMovementOff || {})
    }
  }
}

function answerMatchesExpected (questionKey, submittedAnswer, expectedAnswers) {
  const expected = expectedAnswers[questionKey]

  if (!submittedAnswer || expected === undefined || expected === null) {
    return false
  }

  switch (questionKey) {
    case 'sbi':
      return submittedAnswer.normalised === normaliseSbi(expected)
    case 'lastBirthEarTag':
      return submittedAnswer.normalised === normaliseEarTag(expected)
    case 'lastMovementOn':
    case 'lastMovementOff':
      return submittedAnswer.date === expected.date &&
        submittedAnswer.earTagLast4 === normaliseLast4(expected.earTagLast4)
    case 'memorableWord':
      return submittedAnswer.normalised === normaliseMemorableWord(expected)
    case 'herdMark':
      return submittedAnswer.normalised === normaliseHerdMark(expected)
    case 'animalCount':
      return submittedAnswer.normalised === normaliseAnimalCount(expected)
    default:
      return false
  }
}

function renderAddHolding (request, response, options = {}) {
  const data = request.session.data
  const holdingsToLink = getHoldingsToLink(request)

  response.render(`${baseURL}/add-holding`, {
    baseURL,
    backLink: holdingsToLink.length
      ? `/${baseURL}/holdings`
      : `/${baseURL}/before-you-link-a-holding`,
    errors: options.errors || [],
    cphError: options.cphError,
    postcodeError: options.postcodeError,
    values: {
      cphNumber: options.cphNumber ?? data['cph-number'] ?? '',
      postcode: options.postcode ?? data['holding-postcode'] ?? ''
    }
  })
}

function renderHoldingRole (request, response, options = {}) {
  const data = request.session.data
  const pendingHolding = data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/role-on-holding`, {
    baseURL,
    backLink: `/${baseURL}/add-holding`,
    pendingHolding,
    errors: options.errors || [],
    roleError: options.roleError,
    selectedRole: options.selectedRole ?? data['holding-role'] ?? pendingHolding.claimedRole ?? ''
  })
}

function renderHoldings (request, response) {
  response.render(`${baseURL}/holdings`, {
    baseURL,
    holdings: getHoldingsToLink(request)
  })
}

function buildQuestionValues (question, savedAnswer, postedValues = {}) {
  if (question.type === 'movement') {
    return {
      day: postedValues.day ?? savedAnswer?.day ?? '',
      month: postedValues.month ?? savedAnswer?.month ?? '',
      year: postedValues.year ?? savedAnswer?.year ?? '',
      earTagLast4: postedValues.earTagLast4 ?? savedAnswer?.earTagLast4 ?? ''
    }
  }

  return {
    answer: postedValues.answer ?? savedAnswer?.raw ?? ''
  }
}

function renderRecoveryQuestion (request, response, questionNumber, options = {}) {
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  const selectedQuestions = getRecoverySettings(request).questions
  const questionKey = selectedQuestions[questionNumber - 1]
  const question = RECOVERY_QUESTIONS[questionKey]

  if (!question) {
    return response.redirect(`/${baseURL}/recovery-question/1`)
  }

  const savedAnswer = getRecoveryAnswers(request)[questionKey]
  const returnToCheck = options.returnToCheck ?? request.query.return === 'check'
  const backLink = returnToCheck
    ? `/${baseURL}/check-recovery-answers`
    : questionNumber === 1
      ? `/${baseURL}/role-on-holding`
      : `/${baseURL}/recovery-question/${questionNumber - 1}`

  response.render(`${baseURL}/recovery-question`, {
    baseURL,
    backLink,
    question,
    questionNumber,
    totalQuestions: selectedQuestions.length,
    returnToCheck,
    values: buildQuestionValues(question, savedAnswer, options.values || {}),
    errors: options.errors || [],
    answerError: options.answerError,
    dateError: options.dateError,
    last4Error: options.last4Error
  })
}

function getRecoverySummaryRows (request) {
  const answers = getRecoveryAnswers(request)
  const questionKeys = getRecoverySettings(request).questions

  return questionKeys.map((questionKey, index) => {
    const question = RECOVERY_QUESTIONS[questionKey]
    const answer = answers[questionKey]
    let valueHtml = ''

    if (question.type === 'movement') {
      valueHtml = `${answer?.dateDisplay || ''}<br>Ear tag ending ${answer?.earTagLast4 || ''}`
    } else if (questionKey === 'memorableWord') {
      valueHtml = '<span aria-label="Answer hidden">••••••••</span>'
    } else {
      valueHtml = answer?.display || answer?.raw || ''
    }

    return {
      key: { text: question.shortLabel },
      value: { html: valueHtml },
      actions: {
        items: [
          {
            href: `/${baseURL}/recovery-question/${index + 1}?return=check`,
            text: 'Change',
            visuallyHiddenText: question.shortLabel.toLowerCase()
          }
        ]
      }
    }
  })
}

function addCompletedHolding (request, completedHolding) {
  const holdingsToLink = getHoldingsToLink(request)
  request.session.data.holdingsToLink = [...holdingsToLink, completedHolding]
}

function finishRecoveryJourney (request, outcome) {
  const data = request.session.data
  const pendingHolding = data.pendingHoldingToLink
  const selectedQuestions = getRecoverySettings(request).questions
  if (!pendingHolding) return null

  const completedHolding = {
    ...pendingHolding,
    recoveryOutcome: outcome,
    recoveryQuestionKeys: selectedQuestions,
    linkStatus: outcome === 'success'
      ? 'linked'
      : outcome === 'manual-check'
        ? 'pending-manual-check'
        : 'blocked',
    linkStatusLabel: outcome === 'success'
      ? 'Linked'
      : outcome === 'manual-check'
        ? 'Pending manual check'
        : 'Online claim blocked',
    linkStatusTagColour: outcome === 'success'
      ? 'green'
      : outcome === 'manual-check'
        ? 'yellow'
        : 'red'
  }

  if (outcome === 'success' || outcome === 'manual-check') {
    addCompletedHolding(request, completedHolding)
  }

  if (outcome === 'blocked') {
    const blockedIds = Array.isArray(data.claimCphBlockedHoldingIds)
      ? data.claimCphBlockedHoldingIds
      : []

    data.claimCphBlockedHoldingIds = [...new Set([...blockedIds, pendingHolding.id])]
  }

  data.claimCphRecoveryResult = {
    outcome,
    holding: completedHolding
  }

  delete data.pendingHoldingToLink
  delete data.claimCphRecoveryAnswers
  data['cph-number'] = ''
  data['holding-postcode'] = ''
  data['holding-role'] = ''

  return completedHolding
}

router.get(`/${baseURL}/prototype-settings`, function (request, response) {
  response.render(`${baseURL}/prototype-settings`, {
    baseURL,
    saved: request.query.saved === 'true',
    reset: request.query.reset === 'true',
    selectedQuestions: getRecoverySettings(request).questions,
    errors: [],
    questionsError: null
  })
})

router.post(`/${baseURL}/prototype-settings`, function (request, response) {
  const submittedQuestions = Array.isArray(request.body['recovery-questions'])
    ? request.body['recovery-questions']
    : request.body['recovery-questions']
      ? [request.body['recovery-questions']]
      : []

  const selectedQuestions = submittedQuestions.filter(key => RECOVERY_QUESTIONS[key])

  if (selectedQuestions.length !== 3) {
    const questionsError = { text: 'Select 3 account recovery questions' }

    return response.render(`${baseURL}/prototype-settings`, {
      baseURL,
      saved: false,
      reset: false,
      selectedQuestions,
      questionsError,
      errors: [{ text: questionsError.text, href: '#recovery-questions' }]
    })
  }

  request.session.data.claimCphSettings = {
    questions: RECOVERY_QUESTION_ORDER.filter(key => selectedQuestions.includes(key))
  }
  clearRecoveryJourney(request)

  response.redirect(`/${baseURL}/prototype-settings?saved=true`)
})

router.post(`/${baseURL}/prototype-settings/reset`, function (request, response) {
  const data = request.session.data
  const preservedData = {
    holdings: data.holdings,
    claimCphSettings: data.claimCphSettings
  }

  Object.keys(data).forEach(key => {
    delete data[key]
  })

  Object.assign(data, preservedData)
  response.redirect(`/${baseURL}/prototype-settings?reset=true`)
})

router.get(`/${baseURL}/before-you-link-a-holding`, function (request, response) {
  response.render(`${baseURL}/before-you-link-a-holding`, { baseURL })
})

router.get(`/${baseURL}/add-holding`, function (request, response) {
  renderAddHolding(request, response)
})

router.get(`/${baseURL}/could-not-match-holding`, function (request, response) {
  response.render(`${baseURL}/could-not-match-holding`, { baseURL })
})

router.get(`/${baseURL}/role-on-holding`, function (request, response) {
  renderHoldingRole(request, response)
})

router.get(`/${baseURL}/recovery-question/:number`, function (request, response) {
  const questionNumber = Number(request.params.number)
  renderRecoveryQuestion(request, response, questionNumber)
})

router.get(`/${baseURL}/check-recovery-answers`, function (request, response) {
  const pendingHolding = request.session.data.pendingHoldingToLink
  const selectedQuestions = getRecoverySettings(request).questions
  const answers = getRecoveryAnswers(request)
  const hasAllAnswers = selectedQuestions.every(key => answers[key])

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  if (!hasAllAnswers) {
    const firstMissingIndex = selectedQuestions.findIndex(key => !answers[key])
    return response.redirect(`/${baseURL}/recovery-question/${firstMissingIndex + 1}`)
  }

  response.render(`${baseURL}/check-recovery-answers`, {
    baseURL,
    pendingHolding,
    rows: getRecoverySummaryRows(request),
    backLink: `/${baseURL}/recovery-question/${selectedQuestions.length}`
  })
})

router.get(`/${baseURL}/recovery-success`, function (request, response) {
  const result = request.session.data.claimCphRecoveryResult
  if (!result || result.outcome !== 'success') {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/recovery-success`, { baseURL, result })
})

router.get(`/${baseURL}/recovery-manual-check`, function (request, response) {
  const result = request.session.data.claimCphRecoveryResult
  if (!result || result.outcome !== 'manual-check') {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/recovery-manual-check`, { baseURL, result })
})

router.get(`/${baseURL}/recovery-blocked`, function (request, response) {
  const result = request.session.data.claimCphRecoveryResult
  if (!result || result.outcome !== 'blocked') {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/recovery-blocked`, { baseURL, result })
})

router.get(`/${baseURL}/holdings`, function (request, response) {
  renderHoldings(request, response)
})

// Keep the previous prototype URL working while the journey is updated.
router.get(`/${baseURL}/holdings-added`, function (request, response) {
  response.redirect(`/${baseURL}/holdings`)
})

router.post(`/${baseURL}/add-holding`, function (request, response) {
  const enteredCph = String(request.body['cph-number'] || '').trim()
  const enteredPostcode = String(request.body['holding-postcode'] || '').trim()
  const cphNumber = normaliseCph(enteredCph)
  const postcode = normalisePostcode(enteredPostcode)
  const errors = []
  let cphError
  let postcodeError

  if (!enteredCph) {
    cphError = { text: 'Enter the CPH number' }
    errors.push({ text: cphError.text, href: '#cph-number' })
  } else if (!cphNumber) {
    cphError = { text: 'Enter a CPH number in the correct format' }
    errors.push({ text: cphError.text, href: '#cph-number' })
  }

  if (!enteredPostcode) {
    postcodeError = { text: 'Enter the postcode of the holding' }
    errors.push({ text: postcodeError.text, href: '#holding-postcode' })
  } else if (!postcode) {
    postcodeError = { text: 'Enter a full UK postcode' }
    errors.push({ text: postcodeError.text, href: '#holding-postcode' })
  }

  const holdingsToLink = getHoldingsToLink(request)

  if (cphNumber && holdingsToLink.some(holding => holding.cphNumber === cphNumber)) {
    cphError = { text: 'This CPH number has already been added' }
    errors.push({ text: cphError.text, href: '#cph-number' })
  }

  if (errors.length) {
    return renderAddHolding(request, response, {
      errors,
      cphError,
      postcodeError,
      cphNumber: enteredCph,
      postcode: enteredPostcode
    })
  }

  const matchedHolding = findHolding(request, cphNumber, postcode)

  if (!matchedHolding) {
    request.session.data['cph-number'] = enteredCph
    request.session.data['holding-postcode'] = enteredPostcode
    return response.redirect(`/${baseURL}/could-not-match-holding`)
  }

  const blockedIds = Array.isArray(request.session.data.claimCphBlockedHoldingIds)
    ? request.session.data.claimCphBlockedHoldingIds
    : []

  if (blockedIds.includes(matchedHolding.id)) {
    request.session.data.claimCphRecoveryResult = {
      outcome: 'blocked',
      holding: {
        id: matchedHolding.id,
        cphNumber,
        postcode,
        holdingName: matchedHolding.holdingName
      }
    }
    return response.redirect(`/${baseURL}/recovery-blocked`)
  }

  request.session.data.pendingHoldingToLink = {
    id: matchedHolding.id,
    cphNumber,
    postcode,
    holdingName: matchedHolding.holdingName,
    businessName: matchedHolding.businessName,
    recordedRole: matchedHolding.role,
    status: matchedHolding.status,
    holdingType: matchedHolding.holdingType
  }

  request.session.data['cph-number'] = enteredCph
  request.session.data['holding-postcode'] = enteredPostcode
  request.session.data['holding-role'] = ''
  clearRecoveryJourney(request)

  response.redirect(`/${baseURL}/role-on-holding`)
})

router.post(`/${baseURL}/role-on-holding`, function (request, response) {
  const selectedRole = String(request.body['holding-role'] || '')
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  const allowedRoles = {
    'cph-holder': 'CPH holder',
    keeper: 'Keeper',
    delegate: 'Delegate',
    agent: 'Agent',
    'not-sure': 'I’m not sure'
  }

  if (!allowedRoles[selectedRole]) {
    const roleError = { text: 'Select your role for this holding' }

    return renderHoldingRole(request, response, {
      errors: [{ text: roleError.text, href: '#holding-role' }],
      roleError,
      selectedRole
    })
  }

  request.session.data.pendingHoldingToLink = {
    ...pendingHolding,
    claimedRole: selectedRole,
    claimedRoleLabel: allowedRoles[selectedRole]
  }
  request.session.data['holding-role'] = selectedRole
  clearRecoveryJourney(request)

  response.redirect(`/${baseURL}/recovery-question/1`)
})

router.post(`/${baseURL}/recovery-question/:number`, function (request, response) {
  const questionNumber = Number(request.params.number)
  const selectedQuestions = getRecoverySettings(request).questions
  const questionKey = selectedQuestions[questionNumber - 1]
  const question = RECOVERY_QUESTIONS[questionKey]
  const returnToCheck = String(request.body['return-to-check'] || '') === 'true'

  if (!question) {
    return response.redirect(`/${baseURL}/recovery-question/1`)
  }

  const errors = []
  let answerError
  let dateError
  let last4Error
  let savedAnswer
  let postedValues = {}

  if (question.type === 'movement') {
    const day = String(request.body['recovery-date-day'] || '').trim()
    const month = String(request.body['recovery-date-month'] || '').trim()
    const year = String(request.body['recovery-date-year'] || '').trim()
    const earTagLast4Raw = String(request.body['recovery-ear-tag-last4'] || '').trim()
    const parsedDate = parseDateParts(day, month, year)
    const earTagLast4 = normaliseLast4(earTagLast4Raw)

    postedValues = { day, month, year, earTagLast4: earTagLast4Raw }

    if (parsedDate.error) {
      dateError = { text: parsedDate.error }
      errors.push({ text: dateError.text, href: '#recovery-date-day' })
    }

    if (!earTagLast4Raw) {
      last4Error = { text: 'Enter the last 4 digits of the ear tag number' }
      errors.push({ text: last4Error.text, href: '#recovery-ear-tag-last4' })
    } else if (!earTagLast4) {
      last4Error = { text: 'Enter exactly 4 digits from the end of the ear tag number' }
      errors.push({ text: last4Error.text, href: '#recovery-ear-tag-last4' })
    }

    if (!errors.length) {
      savedAnswer = {
        day: parsedDate.day,
        month: parsedDate.month,
        year: parsedDate.year,
        date: parsedDate.iso,
        dateDisplay: parsedDate.display,
        earTagLast4
      }
    }
  } else {
    const rawAnswer = String(request.body['recovery-answer'] || '').trim()
    let normalised

    postedValues = { answer: rawAnswer }

    if (!rawAnswer) {
      answerError = { text: `Enter ${question.shortLabel.toLowerCase()}` }
    } else {
      switch (questionKey) {
        case 'sbi':
          normalised = normaliseSbi(rawAnswer)
          if (!normalised) answerError = { text: 'Enter a 9-digit SBI' }
          break
        case 'lastBirthEarTag':
          normalised = normaliseEarTag(rawAnswer)
          if (!normalised) answerError = { text: 'Enter a full cattle ear tag number in the correct format' }
          break
        case 'memorableWord':
          normalised = normaliseMemorableWord(rawAnswer)
          break
        case 'herdMark':
          normalised = normaliseHerdMark(rawAnswer)
          if (!normalised) answerError = { text: 'Enter a 6-digit cattle herd mark' }
          break
        case 'animalCount':
          normalised = normaliseAnimalCount(rawAnswer)
          if (!normalised) answerError = { text: 'Enter the number of cattle as a whole number' }
          break
      }
    }

    if (answerError) {
      errors.push({ text: answerError.text, href: '#recovery-answer' })
    } else {
      savedAnswer = {
        raw: rawAnswer,
        normalised,
        display: questionKey === 'lastBirthEarTag'
          ? formatEarTag(normalised)
          : questionKey === 'herdMark'
            ? normalised
            : questionKey === 'animalCount'
              ? normalised
              : rawAnswer
      }
    }
  }

  if (errors.length) {
    return renderRecoveryQuestion(request, response, questionNumber, {
      returnToCheck,
      errors,
      answerError,
      dateError,
      last4Error,
      values: postedValues
    })
  }

  request.session.data.claimCphRecoveryAnswers = {
    ...getRecoveryAnswers(request),
    [questionKey]: savedAnswer
  }

  if (returnToCheck) {
    return response.redirect(`/${baseURL}/check-recovery-answers`)
  }

  if (questionNumber < selectedQuestions.length) {
    return response.redirect(`/${baseURL}/recovery-question/${questionNumber + 1}`)
  }

  response.redirect(`/${baseURL}/check-recovery-answers`)
})

router.post(`/${baseURL}/check-recovery-answers`, function (request, response) {
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  const questionKeys = getRecoverySettings(request).questions
  const submittedAnswers = getRecoveryAnswers(request)
  const expectedAnswers = getExpectedRecoveryAnswers(request, pendingHolding.id)
  const correctCount = questionKeys.filter(questionKey =>
    answerMatchesExpected(questionKey, submittedAnswers[questionKey], expectedAnswers)
  ).length

  let outcome
  if (correctCount === questionKeys.length) {
    outcome = 'success'
  } else if (correctCount === 0) {
    outcome = 'blocked'
  } else {
    outcome = 'manual-check'
  }

  finishRecoveryJourney(request, outcome)

  if (outcome === 'success') {
    return response.redirect(`/${baseURL}/recovery-success`)
  }

  if (outcome === 'manual-check') {
    return response.redirect(`/${baseURL}/recovery-manual-check`)
  }

  response.redirect(`/${baseURL}/recovery-blocked`)
})


module.exports = router