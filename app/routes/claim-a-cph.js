const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const baseURL = 'livestock-back-office/claim-cph/v1'

const VERIFICATION_QUESTIONS = {
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
    heading: 'What are the last 4 digits of the ear tag number of the last calf birth recorded for this holding?',
    shortLabel: 'Last recorded calf birth',
    hint: 'For example, 3456.',
    inputMode: 'numeric',
    classes: 'govuk-input--width-4',
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

const VERIFICATION_QUESTION_ORDER = [
  'sbi',
  'lastBirthEarTag',
  'lastMovementOn',
  'lastMovementOff',
  'memorableWord',
  'herdMark',
  'animalCount'
]

const DEFAULT_VERIFICATION_QUESTION_KEYS = [
  'sbi',
  'lastBirthEarTag',
  'lastMovementOff'
]

const EMAIL_MATCH_SCENARIOS = {
  'no-match': 0,
  'one-holding': 1,
  'three-holdings': 3
}

const DEFAULT_EMAIL_MATCH_SCENARIO = 'no-match'

// These values let the prototype demonstrate all 3 outcomes before the
// holdings fixture has verificationAnswers added to each holding record.
const DEFAULT_DEMO_VERIFICATION_ANSWERS = {
  sbi: '123456789',
  lastBirthEarTag: '3456',
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

function getVerificationSettings (request) {
  const savedSettings = request.session.data.claimCphSettings || {}
  const savedQuestions = savedSettings.verificationQuestions
  const validSavedQuestions = Array.isArray(savedQuestions) &&
    savedQuestions.length === 3 &&
    savedQuestions.every(key => VERIFICATION_QUESTIONS[key])
  const emailMatchScenario = Object.hasOwn(EMAIL_MATCH_SCENARIOS, savedSettings.emailMatchScenario)
    ? savedSettings.emailMatchScenario
    : DEFAULT_EMAIL_MATCH_SCENARIO

  return {
    verificationQuestions: validSavedQuestions
      ? VERIFICATION_QUESTION_ORDER.filter(key => savedQuestions.includes(key))
      : [...DEFAULT_VERIFICATION_QUESTION_KEYS],
    emailMatchScenario
  }
}

function getEmailMatchedHoldings (request) {
  const scenario = getVerificationSettings(request).emailMatchScenario
  const candidateCount = EMAIL_MATCH_SCENARIOS[scenario] || 0

  if (candidateCount === 0) return []

  const completedIds = new Set(getHoldingsToLink(request).map(holding => holding.id))
  const blockedIds = new Set(
    Array.isArray(request.session.data.claimCphBlockedHoldingIds)
      ? request.session.data.claimCphBlockedHoldingIds
      : []
  )

  return getSourceHoldings(request)
    .slice(0, candidateCount)
    .filter(holding => !completedIds.has(holding.id) && !blockedIds.has(holding.id))
    .map(holding => ({
      id: holding.id,
      cphNumber: normaliseCph(holding.cph) || holding.cph,
      postcode: normalisePostcode(holding.address?.postcode) || holding.address?.postcode || '',
      holdingName: holding.holdingName,
      businessName: holding.businessName,
      recordedRole: holding.role,
      status: holding.status,
      holdingType: holding.holdingType
    }))
}

function buildPendingHolding (holding, claimRoute) {
  return {
    id: holding.id,
    cphNumber: normaliseCph(holding.cphNumber || holding.cph) || holding.cphNumber || holding.cph,
    postcode: normalisePostcode(holding.postcode || holding.address?.postcode) || holding.postcode || holding.address?.postcode || '',
    holdingName: holding.holdingName,
    businessName: holding.businessName,
    recordedRole: holding.recordedRole || holding.role,
    status: holding.status,
    holdingType: holding.holdingType,
    claimRoute
  }
}

function getVerificationAnswers (request) {
  const answers = request.session.data.claimCphVerificationAnswers
  return answers && typeof answers === 'object' ? answers : {}
}

function clearVerificationJourney (request) {
  delete request.session.data.claimCphVerificationAnswers
  delete request.session.data.claimCphVerificationResult
}

function resetClaimCphJourney (request) {
  const data = request.session.data

  delete data.holdingsToLink
  delete data.pendingHoldingToLink
  delete data.claimCphVerificationAnswers
  delete data.claimCphVerificationResult
  delete data.claimCphBlockedHoldingIds
  delete data['cph-number']
  delete data['holding-postcode']
  delete data['is-cph-registered-to-user']
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

function normaliseBirthEarTagLast4 (value = '') {
  const last4 = normaliseLast4(value)
  if (last4) return last4

  const fullEarTag = normaliseEarTag(value)
  return fullEarTag ? fullEarTag.slice(-4) : null
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

function getExpectedVerificationAnswers (request, holdingId) {
  const sourceHolding = getSourceHoldingById(request, holdingId)
  const sourceAnswers = sourceHolding?.verificationAnswers || {}

  return {
    ...DEFAULT_DEMO_VERIFICATION_ANSWERS,
    ...sourceAnswers,
    lastMovementOn: {
      ...DEFAULT_DEMO_VERIFICATION_ANSWERS.lastMovementOn,
      ...(sourceAnswers.lastMovementOn || {})
    },
    lastMovementOff: {
      ...DEFAULT_DEMO_VERIFICATION_ANSWERS.lastMovementOff,
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
      return submittedAnswer.normalised === normaliseBirthEarTagLast4(expected)
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
  const hasMatchingEmailScenario = getVerificationSettings(request).emailMatchScenario !== 'no-match'

  response.render(`${baseURL}/add-holding`, {
    baseURL,
    backLink: holdingsToLink.length || hasMatchingEmailScenario
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

function renderCphRegisteredToYou (request, response, options = {}) {
  const data = request.session.data
  const pendingHolding = data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/cph-registered-to-you`, {
    baseURL,
    backLink: pendingHolding.claimRoute === 'matched-email'
      ? `/${baseURL}/holdings`
      : `/${baseURL}/add-holding`,
    pendingHolding,
    errors: options.errors || [],
    registeredToUserError: options.registeredToUserError,
    selectedRegisteredToUser: options.selectedRegisteredToUser ??
      data['is-cph-registered-to-user'] ??
      pendingHolding.registeredToUser ??
      ''
  })
}

function renderHoldings (request, response) {
  response.render(`${baseURL}/holdings`, {
    baseURL,
    linkedHoldings: getHoldingsToLink(request),
    emailMatchedHoldings: getEmailMatchedHoldings(request),
    emailMatchScenario: getVerificationSettings(request).emailMatchScenario
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

function renderVerificationQuestion (request, response, questionNumber, options = {}) {
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  const selectedQuestions = getVerificationSettings(request).verificationQuestions
  const questionKey = selectedQuestions[questionNumber - 1]
  const question = VERIFICATION_QUESTIONS[questionKey]

  if (!question) {
    return response.redirect(`/${baseURL}/verification-question/1`)
  }

  const savedAnswer = getVerificationAnswers(request)[questionKey]
  const returnToCheck = options.returnToCheck ?? request.query.return === 'check'
  const backLink = returnToCheck
    ? `/${baseURL}/check-verification-answers`
    : questionNumber === 1
      ? `/${baseURL}/before-holding-checks`
      : `/${baseURL}/verification-question/${questionNumber - 1}`

  response.render(`${baseURL}/verification-question`, {
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

function getVerificationSummaryRows (request) {
  const answers = getVerificationAnswers(request)
  const questionKeys = getVerificationSettings(request).verificationQuestions

  return questionKeys.map((questionKey, index) => {
    const question = VERIFICATION_QUESTIONS[questionKey]
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
            href: `/${baseURL}/verification-question/${index + 1}?return=check`,
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
  const withoutExisting = holdingsToLink.filter(holding => holding.id !== completedHolding.id)
  request.session.data.holdingsToLink = [...withoutExisting, completedHolding]
}

function finishVerificationJourney (request, outcome) {
  const data = request.session.data
  const pendingHolding = data.pendingHoldingToLink
  const selectedQuestions = getVerificationSettings(request).verificationQuestions
  if (!pendingHolding) return null

  const completedHolding = {
    ...pendingHolding,
    verificationOutcome: outcome,
    verificationQuestionKeys: selectedQuestions,
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

  data.claimCphVerificationResult = {
    outcome,
    holding: completedHolding
  }

  delete data.pendingHoldingToLink
  delete data.claimCphVerificationAnswers
  data['cph-number'] = ''
  data['holding-postcode'] = ''
  data['is-cph-registered-to-user'] = ''

  return completedHolding
}

router.get(`/${baseURL}/prototype-settings`, function (request, response) {
  const settings = getVerificationSettings(request)

  response.render(`${baseURL}/prototype-settings`, {
    baseURL,
    selectedQuestions: settings.verificationQuestions,
    emailMatchScenario: settings.emailMatchScenario,
    errors: [],
    questionsError: null,
    emailMatchScenarioError: null
  })
})

router.post(`/${baseURL}/prototype-settings`, function (request, response) {
  const submittedQuestions = Array.isArray(request.body['verification-questions'])
    ? request.body['verification-questions']
    : request.body['verification-questions']
      ? [request.body['verification-questions']]
      : []

  const selectedQuestions = submittedQuestions.filter(key => VERIFICATION_QUESTIONS[key])
  const submittedScenario = String(request.body['email-match-scenario'] || '')
  const emailMatchScenario = Object.hasOwn(EMAIL_MATCH_SCENARIOS, submittedScenario)
    ? submittedScenario
    : ''
  const errors = []
  let questionsError
  let emailMatchScenarioError

  if (!emailMatchScenario) {
    emailMatchScenarioError = { text: 'Select an email matching scenario' }
    errors.push({ text: emailMatchScenarioError.text, href: '#email-match-scenario' })
  }

  if (selectedQuestions.length !== 3) {
    questionsError = { text: 'Select 3 holding verification questions' }
    errors.push({ text: questionsError.text, href: '#verification-questions' })
  }

  if (errors.length) {
    return response.render(`${baseURL}/prototype-settings`, {
      baseURL,
      selectedQuestions,
      emailMatchScenario: submittedScenario,
      questionsError,
      emailMatchScenarioError,
      errors
    })
  }

  request.session.data.claimCphSettings = {
    verificationQuestions: VERIFICATION_QUESTION_ORDER.filter(key => selectedQuestions.includes(key)),
    emailMatchScenario
  }
  resetClaimCphJourney(request)

  if (emailMatchScenario === 'no-match') {
    return response.redirect(`/${baseURL}/before-you-link-a-holding`)
  }

  response.redirect(`/${baseURL}/holdings`)
})

// Retained so existing prototype links to /start continue to work.
router.get(`/${baseURL}/start`, function (request, response) {
  const scenario = getVerificationSettings(request).emailMatchScenario

  if (scenario === 'no-match') {
    return response.redirect(`/${baseURL}/before-you-link-a-holding`)
  }

  response.redirect(`/${baseURL}/holdings`)
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

router.get(`/${baseURL}/cph-registered-to-you`, function (request, response) {
  renderCphRegisteredToYou(request, response)
})

router.get(`/${baseURL}/before-holding-checks`, function (request, response) {
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/before-holding-checks`, {
    baseURL,
    backLink: `/${baseURL}/cph-registered-to-you`
  })
})

router.get(`/${baseURL}/verification-question/:number`, function (request, response) {
  const questionNumber = Number(request.params.number)
  renderVerificationQuestion(request, response, questionNumber)
})

router.get(`/${baseURL}/check-verification-answers`, function (request, response) {
  const pendingHolding = request.session.data.pendingHoldingToLink
  const selectedQuestions = getVerificationSettings(request).verificationQuestions
  const answers = getVerificationAnswers(request)
  const hasAllAnswers = selectedQuestions.every(key => answers[key])

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  if (!hasAllAnswers) {
    const firstMissingIndex = selectedQuestions.findIndex(key => !answers[key])
    return response.redirect(`/${baseURL}/verification-question/${firstMissingIndex + 1}`)
  }

  response.render(`${baseURL}/check-verification-answers`, {
    baseURL,
    pendingHolding,
    rows: getVerificationSummaryRows(request),
    backLink: `/${baseURL}/verification-question/${selectedQuestions.length}`
  })
})

router.get(`/${baseURL}/verification-success`, function (request, response) {
  const verificationResult = request.session.data.claimCphVerificationResult
  if (!verificationResult || verificationResult.outcome !== 'success') {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/verification-success`, { baseURL, verificationResult })
})

router.get(`/${baseURL}/verification-manual-check`, function (request, response) {
  const verificationResult = request.session.data.claimCphVerificationResult
  if (!verificationResult || verificationResult.outcome !== 'manual-check') {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/verification-manual-check`, { baseURL, verificationResult })
})

router.get(`/${baseURL}/verification-blocked`, function (request, response) {
  const verificationResult = request.session.data.claimCphVerificationResult
  if (!verificationResult || verificationResult.outcome !== 'blocked') {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  response.render(`${baseURL}/verification-blocked`, { baseURL, verificationResult })
})

router.get(`/${baseURL}/holdings`, function (request, response) {
  renderHoldings(request, response)
})

router.get(`/${baseURL}/link-email-holding/:holdingId`, function (request, response) {
  const matchedHolding = getEmailMatchedHoldings(request)
    .find(holding => holding.id === request.params.holdingId)

  if (!matchedHolding) {
    return response.redirect(`/${baseURL}/holdings`)
  }

  request.session.data.pendingHoldingToLink = buildPendingHolding(matchedHolding, 'matched-email')
  request.session.data['is-cph-registered-to-user'] = ''
  clearVerificationJourney(request)

  response.redirect(`/${baseURL}/cph-registered-to-you`)
})

router.get(`/${baseURL}/check-email-matched-holding`, function (request, response) {
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding || pendingHolding.claimRoute !== 'matched-email' || !pendingHolding.registeredToUser) {
    return response.redirect(`/${baseURL}/holdings`)
  }

  response.render(`${baseURL}/check-email-matched-holding`, {
    baseURL,
    pendingHolding,
    backLink: `/${baseURL}/cph-registered-to-you`
  })
})

router.post(`/${baseURL}/check-email-matched-holding`, function (request, response) {
  const data = request.session.data
  const pendingHolding = data.pendingHoldingToLink

  if (!pendingHolding || pendingHolding.claimRoute !== 'matched-email' || !pendingHolding.registeredToUser) {
    return response.redirect(`/${baseURL}/holdings`)
  }

  const completedHolding = {
    ...pendingHolding,
    verificationMethod: 'matched-email',
    verificationOutcome: 'success',
    linkStatus: 'linked',
    linkStatusLabel: 'Linked',
    linkStatusTagColour: 'green'
  }

  addCompletedHolding(request, completedHolding)
  data.claimCphVerificationResult = {
    outcome: 'success',
    holding: completedHolding
  }

  delete data.pendingHoldingToLink
  data['is-cph-registered-to-user'] = ''

  response.redirect(`/${baseURL}/verification-success`)
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
    request.session.data.claimCphVerificationResult = {
      outcome: 'blocked',
      holding: {
        id: matchedHolding.id,
        cphNumber,
        postcode,
        holdingName: matchedHolding.holdingName
      }
    }
    return response.redirect(`/${baseURL}/verification-blocked`)
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
  request.session.data['is-cph-registered-to-user'] = ''
  clearVerificationJourney(request)

  response.redirect(`/${baseURL}/cph-registered-to-you`)
})

router.post(`/${baseURL}/cph-registered-to-you`, function (request, response) {
  const selectedAnswer = String(request.body['is-cph-registered-to-user'] || '')
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  const allowedAnswers = {
    yes: 'Yes',
    no: 'No'
  }

  if (!allowedAnswers[selectedAnswer]) {
    const registeredToUserError = {
      text: 'Select yes if the CPH is registered to you or your business'
    }

    return renderCphRegisteredToYou(request, response, {
      errors: [{
        text: registeredToUserError.text,
        href: '#is-cph-registered-to-user'
      }],
      registeredToUserError,
      selectedRegisteredToUser: selectedAnswer
    })
  }

  request.session.data.pendingHoldingToLink = {
    ...pendingHolding,
    registeredToUser: selectedAnswer,
    registeredToUserLabel: allowedAnswers[selectedAnswer]
  }

  request.session.data['is-cph-registered-to-user'] = selectedAnswer
  clearVerificationJourney(request)

  if (pendingHolding.claimRoute === 'matched-email') {
    return response.redirect(`/${baseURL}/check-email-matched-holding`)
  }

  response.redirect(`/${baseURL}/before-holding-checks`)
})

router.post(`/${baseURL}/verification-question/:number`, function (request, response) {
  const questionNumber = Number(request.params.number)
  const selectedQuestions = getVerificationSettings(request).verificationQuestions
  const questionKey = selectedQuestions[questionNumber - 1]
  const question = VERIFICATION_QUESTIONS[questionKey]
  const returnToCheck = String(request.body['return-to-check'] || '') === 'true'

  if (!question) {
    return response.redirect(`/${baseURL}/verification-question/1`)
  }

  const errors = []
  let answerError
  let dateError
  let last4Error
  let savedAnswer
  let postedValues = {}

  if (question.type === 'movement') {
    const day = String(request.body['verification-date-day'] || '').trim()
    const month = String(request.body['verification-date-month'] || '').trim()
    const year = String(request.body['verification-date-year'] || '').trim()
    const earTagLast4Raw = String(request.body['verification-ear-tag-last4'] || '').trim()
    const parsedDate = parseDateParts(day, month, year)
    const earTagLast4 = normaliseLast4(earTagLast4Raw)

    postedValues = { day, month, year, earTagLast4: earTagLast4Raw }

    if (parsedDate.error) {
      dateError = { text: parsedDate.error }
      errors.push({ text: dateError.text, href: '#verification-date-day' })
    }

    if (!earTagLast4Raw) {
      last4Error = { text: 'Enter the last 4 digits of the ear tag number' }
      errors.push({ text: last4Error.text, href: '#verification-ear-tag-last4' })
    } else if (!earTagLast4) {
      last4Error = { text: 'Enter exactly 4 digits from the end of the ear tag number' }
      errors.push({ text: last4Error.text, href: '#verification-ear-tag-last4' })
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
    const rawAnswer = String(request.body['verification-answer'] || '').trim()
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
          normalised = normaliseLast4(rawAnswer)
          if (!normalised) answerError = { text: 'Enter exactly 4 digits from the end of the ear tag number' }
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
      errors.push({ text: answerError.text, href: '#verification-answer' })
    } else {
      savedAnswer = {
        raw: rawAnswer,
        normalised,
        display: questionKey === 'lastBirthEarTag'
          ? normalised
          : questionKey === 'herdMark'
            ? normalised
            : questionKey === 'animalCount'
              ? normalised
              : rawAnswer
      }
    }
  }

  if (errors.length) {
    return renderVerificationQuestion(request, response, questionNumber, {
      returnToCheck,
      errors,
      answerError,
      dateError,
      last4Error,
      values: postedValues
    })
  }

  request.session.data.claimCphVerificationAnswers = {
    ...getVerificationAnswers(request),
    [questionKey]: savedAnswer
  }

  if (returnToCheck) {
    return response.redirect(`/${baseURL}/check-verification-answers`)
  }

  if (questionNumber < selectedQuestions.length) {
    return response.redirect(`/${baseURL}/verification-question/${questionNumber + 1}`)
  }

  response.redirect(`/${baseURL}/check-verification-answers`)
})

router.post(`/${baseURL}/check-verification-answers`, function (request, response) {
  const pendingHolding = request.session.data.pendingHoldingToLink

  if (!pendingHolding) {
    return response.redirect(`/${baseURL}/add-holding`)
  }

  const questionKeys = getVerificationSettings(request).verificationQuestions
  const submittedAnswers = getVerificationAnswers(request)
  const expectedAnswers = getExpectedVerificationAnswers(request, pendingHolding.id)
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

  finishVerificationJourney(request, outcome)

  if (outcome === 'success') {
    return response.redirect(`/${baseURL}/verification-success`)
  }

  if (outcome === 'manual-check') {
    return response.redirect(`/${baseURL}/verification-manual-check`)
  }

  response.redirect(`/${baseURL}/verification-blocked`)
})


module.exports = router