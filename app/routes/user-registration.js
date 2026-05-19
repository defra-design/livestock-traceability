const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/user-registration/email-address', (req, res) => {
  res.redirect('/user-registration/check-your-email')
})

router.post('/user-registration/check-your-email', (req, res) => {
  res.redirect('/user-registration/create-your-password')
})

router.post('/user-registration/create-your-password', (req, res) => {
  res.redirect('/user-registration/security-code-selection')
})

router.post('/user-registration/authenticator-app-setup', (req, res) => {
  res.redirect('/user-registration/one-login-confirmation')
})

router.post('/user-registration/defra-registration', (req, res) => {
  res.redirect('/user-registration/defra-account-terms')
})

router.post('/user-registration/defra-account-terms', (req, res) => {
  res.redirect('/user-registration/what-we-need')
})

router.post('/user-registration/what-we-need', (req, res) => {
  res.redirect('/user-registration/business-selection')
})

router.post('/user-registration/business-selection', (req, res) => {
  res.redirect('/user-registration/uk-trade-registration')
})

router.post('/user-registration/uk-trade-registration', (req, res) => {
  res.redirect('/user-registration/company-registration-number')
})

router.post('/user-registration/company-registration-number', (req, res) => {
  res.redirect('/user-registration/business-type')
})

router.post('/user-registration/business-type', (req, res) => {
  res.redirect('/user-registration/business-name')
})

router.post('/user-registration/business-name', (req, res) => {
  res.redirect('/user-registration/business-postcode')
})

router.post('/user-registration/business-postcode', (req, res) => {
  res.redirect('/user-registration/business-contact-details')
})

router.post('/user-registration/business-contact-details', (req, res) => {
  res.redirect('/user-registration/name')
})

router.post('/user-registration/name', (req, res) => {
  res.redirect('/user-registration/memorable-word')
})

router.post('/user-registration/memorable-word', (req, res) => {
  res.redirect('/user-registration/check-your-answers')
})

router.post('/user-registration/check-your-answers', (req, res) => {
  res.redirect('/user-registration/registration-confirmation')
})

router.post('/user-registration/sign-in-selection', (req, res) => {
  const loginType = req.session.data['login-type']
  if (loginType === 'govuk-one-login') {
    res.redirect('/user-registration/one-login')
  } else {
    res.redirect('/user-registration/gateway-login')
  }
})

router.post('/user-registration/gateway-login', (req, res) => {
  res.redirect('/user-registration/gateway-email-address')
})

router.post('/user-registration/gateway-email-address', (req, res) => {
  res.redirect('/user-registration/gateway-email-confirmation-code')
})

router.post('/user-registration/gateway-email-confirmation-code', (req, res) => {
  res.redirect('/user-registration/email-address-confirmed')
})

router.post('/user-registration/gateway-full-name', (req, res) => {
  res.redirect('/user-registration/gateway-create-a-password')
})

router.post('/user-registration/gateway-create-a-password', (req, res) => {
  res.redirect('/user-registration/gateway-confirmation')
})

module.exports = router
