'use strict'

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// GOV.UK Prototype Kit router extension. No separate Express dependency.
const BASE = '/evolution/record-full-movement'
const ROOT = BASE + '/movements'
const VIEW = 'evolution/record-full-movement/review/'
const KEY = 'rfmReviewV2'
// Demo register is scoped to Oakfield Farm. Replace with the selected holding in a multi-holding prototype.
const CURRENT_HOLDING = '37/123/4567'
// The demonstration premises match the registered addresses used in the V2 reporting journey.
// Keep premises identifiers separate from address lines: a premises name is not always an address.
const PREMISES_ADDRESSES = {
  '37/123/4567': 'Oakfield Lane, Exampleton, EX1 2AB',
  '56/312/0056': 'Mill Lane, Exampleton, EX2 3CD',
  '15/628/0067': 'High Road, Exampleton, EX2 4DE',
  '31/672/0158': 'Market Road, Exampleton, EX3 5EF',
  '44/209/0317': 'Market Street, Exampleton, EX3 6FG',
  '66/204/0141': 'Showground Road, Exampleton, EX5 9JK',
  '22/100/0044': 'Station Road, Exampleton, EX6 1MN',
  '12/345/9999': '1 Brick Lane, Shrewsbury, SY1 1AA'
}
const escape = s => String(s == null ? '' : s).trim()
const cleanTags = text => [...new Set(escape(text).split(/[\n,;]+/).map(v => v.trim()).filter(Boolean))]
const seed = () => [
  { id:'MOV-1001',direction:'off', from:'37/123/4567',to:'56/312/0056',date:'21 Oct 2026',tags:['UK 371234 000001','UK 371234 000003','UK 371234 000005'],status:'awaiting',initiator:'you',origin:'You reported a movement off',history:[] },
  { id:'MOV-1002',direction:'on',from:'15/628/0067',to:'37/123/4567',date:'20 Oct 2026',tags:['UK 371234 000018','UK 371234 000022'],status:'changes',initiator:'you',origin:'You reported a movement on',proposal:{date:'20 Oct 2026',tags:['UK 371234 000018'],note:'One animal did not arrive'},history:[] },
  { id:'MOV-1003',direction:'off',from:'37/123/4567',to:'31/672/0158',date:'19 Oct 2026',tags:['UK 371234 000006','UK 371234 000007'],status:'confirmed',initiator:'you',origin:'You reported a movement off',history:[] },
  { id:'MOV-1004',direction:'on',from:'44/209/0317',to:'37/123/4567',date:'18 Oct 2026',tags:['UK 371234 000011'],status:'rejected',initiator:'you',origin:'You reported a movement on',reason:'The other keeper says the cattle did not leave their holding.',history:[] },
  { id:'MOV-1005',direction:'off',from:'37/123/4567',to:'66/204/0141',date:'17 Oct 2026',tags:['UK 371234 000012'],status:'unconfirmed',initiator:'you',origin:'You reported a movement off',history:[] },
  { id:'MOV-1006',direction:'off',from:'37/123/4567',to:'22/100/0044',date:'16 Oct 2026',tags:['UK 371234 000015'],status:'disputed',initiator:'you',origin:'You reported a movement off',reason:'The parties disagree about the cattle received.',history:[] },
  { id:'MOV-1007',direction:'on',from:'56/312/0056',to:'37/123/4567',date:'22 Oct 2026',tags:['UK 371234 000032','UK 371234 000033'],status:'awaiting',initiator:'other',origin:'Other keeper reported a movement off',history:[] }
]
const LABELS={awaiting:'Awaiting confirmation',changes:'Changes proposed',confirmed:'Confirmed',rejected:'Rejected – awaiting response',disputed:'Disputed',unconfirmed:'Unconfirmed',withdrawn:'Withdrawn'}
const COLOURS={awaiting:'govuk-tag--blue',changes:'govuk-tag--purple',confirmed:'govuk-tag--green',rejected:'govuk-tag--orange',disputed:'govuk-tag--red',unconfirmed:'govuk-tag--yellow',withdrawn:'govuk-tag--grey'}
function records(req){const s=req.session.data;if(!Array.isArray(s[KEY]))s[KEY]=seed();const d=s.recordFullMovementV2;if(d&&d.confirmation){const c=d.confirmation;if(!s[KEY].some(x=>x.id===c.reference)){s[KEY].unshift({id:c.reference,direction:c.direction,from:c.direction==='off'?'37/123/4567':c.destination.identifier,to:c.direction==='on'?'37/123/4567':c.destination.identifier,date:c.date,offDate:c.offDate || null,onDate:c.onDate || null,fromAddress:c.direction==='on'?c.destination.address:PREMISES_ADDRESSES['37/123/4567'],toAddress:c.direction==='off'?c.destination.address:PREMISES_ADDRESSES['37/123/4567'],tags:c.animals||[],status:'awaiting',initiator:'you',origin:'You submitted this movement',reportedAt:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Europe/London'}).format(new Date()),history:[]})}}return s[KEY]}
function find(req){return records(req).find(x=>x.id===req.params.id)}
function animalRow(tag) {
  const index = Number((String(tag).match(/(\d{6})$/) || [,''])[1]) - 1
  if (!Number.isInteger(index) || index < 0 || index >= 180 || !String(tag).startsWith('UK 371234 ')) {
    return {tag, breed:{code:'—',name:'Breed not available'}, sex:'Not available', dateOfBirth:'Not available'}
  }
  return {tag, breed:[{code:'HF',name:'Holstein Friesian'},{code:'BRB',name:'British Blue'},{code:'AA',name:'Aberdeen Angus'},{code:'HE',name:'Hereford'}][index % 4], sex:index % 2 === 0 ? 'Female' : 'Male', dateOfBirth:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(2020+(index % 5),index % 12,1+(index % 28))))}
}
function proposalDiff(r) {
  if (!r.proposal) return null
  const original = new Set(r.tags)
  const proposed = new Set(r.proposal.tags)
  return {
    removed: r.tags.filter(tag => !proposed.has(tag)).map(animalRow),
    added: r.proposal.tags.filter(tag => !original.has(tag)).map(animalRow),
    dateChanged: r.date !== r.proposal.date,
    originalCount: r.tags.length,
    proposedCount: r.proposal.tags.length
  }
}
function decorate(r){
 const holdingDirection = r.to === CURRENT_HOLDING ? 'on' : r.from === CURRENT_HOLDING ? 'off' : null
 const otherHolding = holdingDirection === 'on' ? r.from : holdingDirection === 'off' ? r.to : null
 return {...r,holdingDirection,otherHolding,offDate:r.offDate || (r.direction === 'off' ? r.date : null),onDate:r.onDate || (r.direction === 'on' ? r.date : null),proposalDiff:proposalDiff(r),fromAddress:r.fromAddress || PREMISES_ADDRESSES[r.from] || '',toAddress:r.toAddress || PREMISES_ADDRESSES[r.to] || '',animals:r.tags.map(animalRow),reportedBy:r.reportedBy || (r.initiator === 'you' ? 'You (keeper)' : 'Opposing keeper'),reportedAt:r.reportedAt || 'Not recorded in demonstration data',label:LABELS[r.status],colour:COLOURS[r.status],count:r.tags.length,isMine:r.initiator==='you',canReview:r.status==='awaiting'&&r.initiator==='other',canRespondChanges:r.status==='changes'&&r.initiator==='you',canRespondRejection:r.status==='rejected'&&r.initiator==='you'}}
// Responsibility belongs to the current holding, not an individual user.
function actionWith(r) {
  if (r.status === 'confirmed' || r.status === 'withdrawn') return 'none'
  if (r.status === 'disputed' || r.status === 'unconfirmed') return 'bcms'
  if (r.canReview || r.canRespondChanges || r.canRespondRejection) return 'you'
  if (['awaiting', 'changes', 'rejected'].includes(r.status)) return 'other'
  return 'none'
}
function render(req,res,page,vars={}){return res.render(VIEW+page,{base:BASE,root:ROOT,currentHolding:CURRENT_HOLDING,pageName:vars.pageName||'Movements',...vars})}
function redirect(res,path=''){return res.redirect(ROOT+path)}
function recordEvent(r,text,note='',actor='Keeper') {
 const now=new Date()
 r.history.unshift({text,note,actor,datetime:now.toISOString(),when:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Europe/London'}).format(now)})
}

function must(req,res){const r=find(req);if(!r){res.status(404).send('Movement not found');return null}return r}
function issue(res,page,req,r,message,extras={}){res.status(400);return render(req,res,page,{movement:decorate(r),error:message,...extras})}

 router.get(ROOT, (req, res) => {
  const statuses = ['all', 'action', 'awaiting', 'changes', 'confirmed', 'rejected', 'disputed', 'unconfirmed', 'withdrawn']
  const responsibilities = ['all', 'you', 'other', 'bcms']
  const filter = statuses.includes(req.query.status) ? req.query.status : 'all'
  const actionFilter = responsibilities.includes(req.query.actionWith) ? req.query.actionWith : 'all'

  const allMovements = records(req).map(record => {
    const movement = decorate(record)
    return { ...movement, actionWith: actionWith(movement) }
  })

  // Counts do not change with the filters: the cards always describe the holding's whole register.
  const actionCounts = {
    you: allMovements.filter(m => m.actionWith === 'you').length,
    other: allMovements.filter(m => m.actionWith === 'other').length,
    bcms: allMovements.filter(m => m.actionWith === 'bcms').length
  }

  const movements = allMovements.filter(m => {
    const matchesStatus = filter === 'all' || (filter === 'action' ? m.actionWith === 'you' : m.status === filter)
    const matchesAction = actionFilter === 'all' || m.actionWith === actionFilter
    return matchesStatus && matchesAction
  })

  return render(req, res, 'index', { movements, filter, actionFilter, actionCounts, labels: LABELS })
})
 router.get(ROOT+'/:id',(req,res)=>{const r=must(req,res);if(r)return render(req,res,'detail',{movement:decorate(r),pageName:'Movement '+r.id})})
 router.get(ROOT+'/:id/activity',(req,res)=>{const r=must(req,res);if(r)return render(req,res,'activity',{movement:decorate(r),pageName:'Movement activity'})})
 router.get(ROOT+'/:id/review',(req,res)=>{const r=must(req,res);if(r)return res.redirect(ROOT+'/'+encodeURIComponent(r.id)+'#movement-action')})
 router.post(ROOT+'/:id/review',(req,res)=>{const r=must(req,res);if(!r)return;if(r.status!=='awaiting'||r.initiator!=='other')return redirect(res,'/'+encodeURIComponent(r.id));const choice=escape(req.body['review-action']);if(!['confirm','amend','reject'].includes(choice))return issue(res,'detail',req,r,'Select what you want to do');if(choice==='amend')return redirect(res,'/'+encodeURIComponent(r.id)+'/propose');if(choice==='reject')return redirect(res,'/'+encodeURIComponent(r.id)+'/reject');r.status='confirmed';recordEvent(r,'Movement confirmed','The opposing keeper confirmed the reported movement.','Opposing keeper (keeper)');return redirect(res,'/'+encodeURIComponent(r.id)+'/outcome')})
 // Draft proposal journey. Draft data is distinct from the recorded movement and its audit history.
 function eligible(r) { return r.status === 'awaiting' && r.initiator === 'other' }
 function draft(req, r, reset) {
   const drafts = req.session.data.rfmProposalDrafts || (req.session.data.rfmProposalDrafts = {})
   if (reset || !drafts[r.id]) drafts[r.id] = { changes: [], tags: r.tags.slice(), date: r.date, note: '' }
   return drafts[r.id]
 }
 function show(req, res, page, r, extras = {}) {
   const d = draft(req, r)
   return render(req, res, page, {
     movement: decorate(r), draft: d,
     proposedAnimals: d.tags.map(tag => ({ ...animalRow(tag), encodedTag: encodeURIComponent(tag) })),
     dateSelected: d.changes.includes('date'),
     animalsSelected: d.changes.includes('animals'),
     newTags: d.newTags || [],
     failures: d.failures || [],
     failureCount: (d.failures || []).length,
     ...extras
   })
 }
 function stage(req, res, r, page) {
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   return show(req, res, page, r)
 }
 router.get(ROOT + '/:id/propose', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   // GET does not reset a draft, enabling normal back navigation.
   return stage(req, res, r, 'propose')
 })
 router.post(ROOT + '/:id/propose/choose', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const values = [].concat(req.body.changes || []).filter(v => ['animals', 'date'].includes(v))
   if (!values.length) return show(req, res, 'propose', r, {error: 'Select what you want to change'})
   const d = draft(req, r)
   d.changes = [...new Set(values)]
   return redirect(res, '/' + encodeURIComponent(r.id) + (d.changes.includes('animals') ? '/propose/animals' : '/propose/date'))
 })
 router.get(ROOT + '/:id/propose/animals', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   if (!d.changes.includes('animals')) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose')
   return show(req, res, 'propose-animals', r)
 })
 // GET link follows the same remove pattern as the reporting cattle list.
 router.get(ROOT + '/:id/propose/animals/:tag/remove', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   if (!d.changes.includes('animals')) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose')
   const tag = escape(req.params.tag)
   if (!d.tags.includes(tag)) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose/animals')
   if (d.tags.length === 1) return show(req, res, 'propose-animals', r, {error: 'You cannot remove the last animal. Reject the movement if no cattle arrived.'})
   d.tags = d.tags.filter(t => t !== tag)
   d.newTags = (d.newTags || []).filter(t => t !== tag)
   return redirect(res, '/' + encodeURIComponent(r.id) + '/propose/animals')
 })
 router.post(ROOT + '/:id/propose/animals/remove', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   const tag = escape(req.body.tag)
   if (!d.tags.includes(tag)) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose/animals')
   if (d.tags.length === 1) return show(req, res, 'propose-animals', r, {error: 'You cannot remove the last animal. Reject the movement if no cattle arrived.'})
   d.tags = d.tags.filter(t => t !== tag)
   d.newTags = (d.newTags || []).filter(t => t !== tag)
   return redirect(res, '/' + encodeURIComponent(r.id) + '/propose/animals')
 })
 // Adding cattle follows the same method -> manual/upload -> check -> add-to-list pattern as reporting.
 function proposalUrl(r, suffix) { return '/' + encodeURIComponent(r.id) + '/propose/animals' + suffix }
 function normaliseEarTag(value) {
   const compact = escape(value).toUpperCase().replace(/\s+/g, '')
   const match = compact.match(/^UK(\d{6})(\d{6})$/)
   return match ? 'UK ' + match[1] + ' ' + match[2] : null
 }
 function prepareProposalTags(text, d) {
   const good = [], issues = [], seen = new Set()
   for (const value of escape(text).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)) {
     const tag = normaliseEarTag(value)
     if (!tag) { issues.push({value, message:'Enter a valid cattle ear tag number, for example UK 371234 000001'}); continue }
     if (seen.has(tag) || d.tags.includes(tag)) { issues.push({value, message:'This animal is already in the list'}); continue }
     if (!/^UK 371234 000(0[0-9]{2}|1[0-7][0-9]|180)$/.test(tag) || Number(tag.slice(-6)) < 1) {
       issues.push({value, message:'This ear tag number was not found in the demonstration cattle register'}); continue
     }
     seen.add(tag); good.push(tag)
   }
   return {good,issues}
 }
 function addProposalTags(d, checked) {
   d.newTags = checked.good.filter(tag => !d.tags.includes(tag))
   d.tags = [...new Set([...d.tags, ...d.newTags])]
   d.failures = checked.issues.slice()
   delete d.pending
 }
 router.get(ROOT + '/:id/propose/animals/add-method', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   return show(req,res,'propose-add-method',r)
 })
 router.post(ROOT + '/:id/propose/animals/add-method', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   const method=escape(req.body.method)
   if (!['manual','upload'].includes(method)) return show(req,res,'propose-add-method',r,{error:'Select how you want to add cattle'})
   return redirect(res,proposalUrl(r,method==='manual'?'/manual':'/upload'))
 })
 router.get(ROOT + '/:id/propose/animals/manual', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   return show(req,res,'propose-manual',r)
 })
 router.post(ROOT + '/:id/propose/animals/manual', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   const d=draft(req,r), entered=escape(req.body.tags)
   if (!entered) return show(req,res,'propose-manual',r,{error:'Enter at least one ear tag number',postedTags:entered})
   addProposalTags(d, prepareProposalTags(entered,d))
   return redirect(res,proposalUrl(r,''))
 })
 router.get(ROOT + '/:id/propose/animals/upload', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   return show(req,res,'propose-upload',r)
 })
 router.post(ROOT + '/:id/propose/animals/upload', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   const file=escape(req.body['rfm-file'])
   if (!file) return show(req,res,'propose-upload',r,{error:'Select a file to upload'})
   if (!/\.(csv|xlsx)$/i.test(file)) return show(req,res,'propose-upload',r,{error:'Choose a CSV or XLSX file'})
   const d=draft(req,r)
   // Matches the reporting prototype: filename triggers sample data, not a genuine upload.
   addProposalTags(d, prepareProposalTags('UK 371234 000041\nUK 371234 000042\nUK 371234 000043',d))
   return redirect(res,proposalUrl(r,''))
 })
 router.get(ROOT + '/:id/propose/animals/check', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   const d=draft(req,r)
   if (!d.pending) return redirect(res,proposalUrl(r,'/add-method'))
   return show(req,res,'propose-check-animals',r,{pending:d.pending,matchedAnimals:d.pending.good.map(animalRow)})
 })
 router.post(ROOT + '/:id/propose/animals/check/correct', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   const d=draft(req,r)
   if (!d.pending) return redirect(res,proposalUrl(r,'/add-method'))
   const corrected=prepareProposalTags(req.body.corrections,d)
   d.pending.good=[...new Set([...d.pending.good,...corrected.good])]
   d.pending.issues=corrected.issues.filter(x=>!d.pending.good.includes(normaliseEarTag(x.value)))
   return redirect(res,proposalUrl(r,'/check'))
 })
 router.post(ROOT + '/:id/propose/animals/check/add', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   const d=draft(req,r)
   if (!d.pending) return redirect(res,proposalUrl(r,'/add-method'))
   addProposalTags(d, d.pending)
   return redirect(res,proposalUrl(r,''))
 })
 router.get(ROOT + '/:id/propose/animals/not-added', (req,res) => {
   const r=must(req,res); if (!r) return
   if (!eligible(r)) return redirect(res,'/'+encodeURIComponent(r.id))
   return show(req,res,'propose-animals-not-added',r)
 })
 router.post(ROOT + '/:id/propose/animals/continue', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   if (!d.tags.length) return show(req,res,'propose-animals',r,{error:'The proposed movement must include at least one animal'})
   if (!d.changes.includes('date') && d.tags.length === r.tags.length && d.tags.every(tag => r.tags.includes(tag))) return show(req,res,'propose-animals',r,{error:'You have not made any changes to the cattle in this movement'})
   delete d.pending
   return redirect(res, '/' + encodeURIComponent(r.id) + (d.changes.includes('date') ? '/propose/date' : '/propose/check'))
 })
 router.get(ROOT + '/:id/propose/date', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   if (!draft(req, r).changes.includes('date')) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose')
   return show(req, res, 'propose-date', r)
 })
 router.post(ROOT + '/:id/propose/date', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   const day = Number(req.body.day), month = Number(req.body.month), year = Number(req.body.year)
   const date = new Date(Date.UTC(year, month - 1, day))
   if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year) ||
       year < 2000 || year > 2100 || date.getUTCDate() !== day || date.getUTCMonth() + 1 !== month || date.getUTCFullYear() !== year || date > new Date()) {
     return show(req, res, 'propose-date', r, {error: 'Enter a real movement date that is not in the future'})
   }
   d.date = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).format(date)
   return redirect(res, '/' + encodeURIComponent(r.id) + '/propose/check')
 })
 router.get(ROOT + '/:id/propose/check', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   if (!d.changes.length) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose')
   return show(req, res, 'propose-check', r)
 })
 router.post(ROOT + '/:id/propose/submit', (req, res) => {
   const r = must(req, res); if (!r) return
   if (!eligible(r)) return redirect(res, '/' + encodeURIComponent(r.id))
   const d = draft(req, r)
   if (!d.changes.length || !d.tags.length) return redirect(res, '/' + encodeURIComponent(r.id) + '/propose')
   if (d.tags.length === r.tags.length && d.tags.every(t => r.tags.includes(t)) && d.date === r.date) {
     return show(req, res, 'propose-check', r, {error: 'You have not made any changes to this movement'})
   }
   const note = escape(req.body.reason)
   if (!note) return show(req, res, 'propose-check', r, {error: 'Explain why you are proposing these changes'})
   r.proposal = {date: d.date, tags: d.tags.slice(), note}
   r.status = 'changes'
   recordEvent(r, 'Changes proposed', note + '; proposed date: ' + d.date + '; proposed ear tags: ' + d.tags.join(', '), 'Opposing keeper (keeper)')
   delete req.session.data.rfmProposalDrafts[r.id]
   return redirect(res, '/' + encodeURIComponent(r.id) + '/outcome')
 })
 router.get(ROOT + '/:id/propose/cancel', (req, res) => {
   const r = must(req, res); if (!r) return
   if (req.session.data.rfmProposalDrafts) delete req.session.data.rfmProposalDrafts[r.id]
   return redirect(res, '/' + encodeURIComponent(r.id))
 })
 router.get(ROOT+'/:id/reject',(req,res)=>{const r=must(req,res);if(r)return render(req,res,'reject',{movement:decorate(r),pageName:'Reject movement'})})
 router.post(ROOT+'/:id/reject',(req,res)=>{const r=must(req,res);if(!r)return;if(r.status!=='awaiting'||r.initiator!=='other')return redirect(res,'/'+encodeURIComponent(r.id));const reason=escape(req.body.reason);if(!reason)return issue(res,'reject',req,r,'Explain why you are rejecting the movement');r.reason=reason;r.status='rejected';recordEvent(r,'Movement rejected',reason,'Opposing keeper (keeper)');return redirect(res,'/'+encodeURIComponent(r.id)+'/outcome')})
 router.get(ROOT+'/:id/respond-changes',(req,res)=>{const r=must(req,res);if(r)return res.redirect(ROOT+'/'+encodeURIComponent(r.id)+'#movement-action')})
 router.post(ROOT+'/:id/respond-changes',(req,res)=>{const r=must(req,res);if(!r)return;if(r.status!=='changes'||r.initiator!=='you')return redirect(res,'/'+encodeURIComponent(r.id));const action=escape(req.body.decision);if(!['accept','dispute'].includes(action))return issue(res,'detail',req,r,'Select whether you accept the changes');if(action==='accept'){r.date=r.proposal.date;r.tags=r.proposal.tags.slice();r.status='confirmed';recordEvent(r,'Proposed changes accepted',r.proposal.note,'Original reporter (keeper)')}else{r.status='disputed';recordEvent(r,'Proposed changes disputed','Referred for back-office review.','Original reporter (keeper)')}return redirect(res,'/'+encodeURIComponent(r.id)+'/outcome')})
 router.get(ROOT+'/:id/respond-rejection',(req,res)=>{const r=must(req,res);if(r)return res.redirect(ROOT+'/'+encodeURIComponent(r.id)+'#movement-action')})
 router.post(ROOT+'/:id/respond-rejection',(req,res)=>{const r=must(req,res);if(!r)return;if(r.status!=='rejected'||r.initiator!=='you')return redirect(res,'/'+encodeURIComponent(r.id));const action=escape(req.body.decision);if(!['correct','withdraw','dispute'].includes(action))return issue(res,'detail',req,r,'Select how you want to respond');if(action==='correct')return redirect(res,'/'+encodeURIComponent(r.id)+'/correct');if(action==='withdraw'){r.status='withdrawn';recordEvent(r,'Movement report withdrawn','Original declaration retained in audit history.','Original reporter (keeper)')}else{r.status='disputed';recordEvent(r,'Movement rejection disputed','Referred for back-office review.','Original reporter (keeper)')}return redirect(res,'/'+encodeURIComponent(r.id)+'/outcome')})
 router.get(ROOT+'/:id/correct',(req,res)=>{const r=must(req,res);if(r)return render(req,res,'correct',{movement:decorate(r),pageName:'Correct movement'})})
 router.post(ROOT+'/:id/correct',(req,res)=>{const r=must(req,res);if(!r)return;if(r.status!=='rejected'||r.initiator!=='you')return redirect(res,'/'+encodeURIComponent(r.id));const from=escape(req.body.from),to=escape(req.body.to),date=escape(req.body.date),tags=cleanTags(req.body.tags);if(!from||!to||!date||!tags.length)return issue(res,'correct',req,r,'Enter both CPHs, movement date and at least one animal');r.original=r.original||{from:r.from,to:r.to,date:r.date,tags:r.tags.slice()};r.from=from;r.to=to;r.date=date;r.tags=tags;r.reason='';r.status='awaiting';recordEvent(r,'Movement report corrected','Report corrected and sent for confirmation again. Original submission reference retained.','Original reporter (keeper)');return redirect(res,'/'+encodeURIComponent(r.id)+'/outcome')})
 router.get(ROOT+'/:id/outcome',(req,res)=>{const r=must(req,res);if(r)return render(req,res,'outcome',{movement:decorate(r),pageName:'Movement updated'})})
 router.post(ROOT+'/reset',(req,res)=>{req.session.data[KEY]=seed();return redirect(res)})

module.exports = router;