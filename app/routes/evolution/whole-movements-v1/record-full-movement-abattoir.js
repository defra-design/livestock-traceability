'use strict'

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const BASE = '/evolution/record-full-movement'
const ROOT = BASE + '/abattoir'
const VIEW = 'evolution/record-full-movement/abattoir/'
const KEY = 'rfmAbattoirDemoV1'
const ABATTOIR = {identifier:'UK 1234', name:'Example Abattoir', address:'Industrial Estate, Exampleton, EX4 7GH'}
const SAMPLE = {id:'MOV-AB-1001', from:'37/123/4567', fromAddress:'Oakfield Lane, Exampleton, EX1 2AB', offDate:'28 October 2026', tags:['UK 371234 000041','UK 371234 000042','UK 371234 000043']}
const text = value => String(value == null ? '' : value).trim()
const url = id => ROOT + '/' + encodeURIComponent(id)
const render = (req,res,page,data={}) => res.render(VIEW+page,{base:BASE,root:ROOT,abattoir:ABATTOIR,...data})
function dateFields(body) {
  const d=Number(body.day), m=Number(body.month), y=Number(body.year)
  if (!text(body.day) || !text(body.month) || !text(body.year) || !Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || y<1900 || y>2100) return null
  const dt=new Date(Date.UTC(y,m-1,d))
  if(dt.getUTCDate()!==d || dt.getUTCMonth()!==m-1 || dt.getUTCFullYear()!==y || dt.getTime()>Date.now()) return null
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(dt)
}
function readRecords(req) {
  const s=req.session.data
  if (!s[KEY]) s[KEY]={}
  const records=s[KEY]
  if(!records[SAMPLE.id]) records[SAMPLE.id]={...SAMPLE, movementStatus:'awaiting', onDate:null, deaths:[], history:[]}
  const reported=s.recordFullMovementV2 && s.recordFullMovementV2.confirmation
  if (reported && reported.direction==='off' && reported.destination && (reported.destination.identifier===ABATTOIR.identifier || reported.destination.id==='abattoir')) {
    const id=reported.reference
    if(id && !records[id]) records[id]={id,from:'37/123/4567',fromAddress:'Oakfield Lane, Exampleton, EX1 2AB',offDate:reported.offDate || reported.date || null,onDate:reported.onDate && reported.onDate!=='Not known' ? reported.onDate:null,tags:(reported.animals || []).map(a=>typeof a==='string'?a:a.tag).filter(Boolean),movementStatus:'awaiting',deaths:[],history:[]}
  }
  return records
}
function get(req,res) {
  const r=readRecords(req)[req.params.id]
  if(!r) {res.status(404).send('Movement not found');return null}
  return r
}
function event(r,message) {r.history.unshift({message,when:new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date())})}
function remaining(r) {const done=new Set(r.deaths.map(d=>d.tag));return r.tags.filter(t=>!done.has(t))}
function page(req,res,name,r,extra={}) {return render(req,res,name,{movement:r,remaining:remaining(r),...extra})}
router.get(ROOT,(req,res)=>render(req,res,'index',{movements:Object.values(readRecords(req))}))
router.get(ROOT+'/:id',(req,res)=>{const r=get(req,res);if(r)page(req,res,'detail',r)})
router.get(ROOT+'/:id/arrival',(req,res)=>{const r=get(req,res);if(r) r.movementStatus==='confirmed'?res.redirect(url(r)+'/death'):page(req,res,'arrival',r)})
router.post(ROOT+'/:id/arrival',(req,res)=>{
  const r=get(req,res);if(!r)return
  if(r.movementStatus==='confirmed')return res.redirect(url(r)+'/death')
  const choice=text(req.body['date-choice'])
  const d=choice==='same'?r.offDate:choice==='different'?dateFields(req.body):null
  if(!d)return page(req,res,'arrival',r,{error:'Select whether the dates are the same and enter a valid arrival date if needed'})
  r.onDate=d;r.movementStatus='confirmed';event(r,'Movement ON confirmed: '+d)
  return res.redirect(url(r)+'/movement-confirmed')
})
router.get(ROOT+'/:id/movement-confirmed',(req,res)=>{const r=get(req,res);if(r) r.movementStatus==='confirmed'?page(req,res,'movement-confirmed',r):res.redirect(url(r)+'/arrival')})
router.get(ROOT+'/:id/death',(req,res)=>{const r=get(req,res);if(r)r.movementStatus==='confirmed'?page(req,res,'death',r):res.redirect(url(r)+'/arrival')})
router.post(ROOT+'/:id/death',(req,res)=>{
  const r=get(req,res);if(!r)return
  if(r.movementStatus!=='confirmed')return res.redirect(url(r)+'/arrival')
  if(!remaining(r).length)return res.redirect(url(r))
  const choice=text(req.body.choice)
  if(choice==='later')return res.redirect(url(r))
  if(choice==='all' || choice==='some')return res.redirect(url(r)+'/slaughter?scope='+choice)
  return page(req,res,'death',r,{error:'Select whether you want to report cattle deaths now'})
})
router.get(ROOT+'/:id/slaughter',(req,res)=>{
  const r=get(req,res);if(!r)return
  if(r.movementStatus!=='confirmed')return res.redirect(url(r)+'/arrival')
  const scope=req.query.scope==='some'?'some':'all'
  return page(req,res,'slaughter',r,{scope})
})
router.post(ROOT+'/:id/slaughter',(req,res)=>{
  const r=get(req,res);if(!r)return
  if(r.movementStatus!=='confirmed')return res.redirect(url(r)+'/arrival')
  const rest=remaining(r),scope=text(req.body.scope)==='some'?'some':'all'
  if(!rest.length)return res.redirect(url(r))
  let selected=scope==='all'?rest:[].concat(req.body.tags||[]).filter(t=>rest.includes(t))
  selected=[...new Set(selected)]
  if(!selected.length)return page(req,res,'slaughter',r,{scope,error:'Select at least one animal that has been slaughtered'})
  const choice=text(req.body['date-choice'])
  const deathDate=choice==='same'?r.onDate:choice==='different'?dateFields(req.body):null
  if(!deathDate)return page(req,res,'slaughter',r,{scope,error:'Select the date of death and enter a valid date if needed'})
  // A death date cannot predate the recorded arrival date.
  function time(date) {const m=String(date).match(/^(\d{1,2}) (\w+) (\d{4})$/);return m?Date.parse(m[2]+' '+m[1]+', '+m[3]):NaN}
  if(time(deathDate)<time(r.onDate))return page(req,res,'slaughter',r,{scope,error:'Date of death must be on or after the date cattle arrived'})
  for(const tag of selected)r.deaths.push({tag,date:deathDate,recordedBy:ABATTOIR.name})
  event(r,'Deaths reported for '+selected.length+' cattle on '+deathDate)
  return res.redirect(url(r)+'/deaths-confirmed')
})
router.get(ROOT+'/:id/deaths-confirmed',(req,res)=>{const r=get(req,res);if(r)page(req,res,'deaths-confirmed',r)})
module.exports=router
