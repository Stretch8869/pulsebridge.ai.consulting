import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const BLUEPRINT_LINK='plink_1U8ksJG10O70U1dcnvhlTccQ';
const AUDIT_LINK='plink_1U8ksSG10O70U1dcHK72WSZb';
const MONITOR_LINK='plink_1U8ksYG10O70U1dc1XY8NQlE';
const ALLOWED=new Set([BLUEPRINT_LINK,AUDIT_LINK,MONITOR_LINK]);

function safeEqualHex(a:string,b:string){
  try{const aa=Buffer.from(a,'hex'),bb=Buffer.from(b,'hex');return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}catch{return false}
}

function verifyStripeSignature(payload:string,header:string,secret:string){
  const parts=header.split(',').map(x=>x.trim());
  const timestamp=parts.find(x=>x.startsWith('t='))?.slice(2)||'';
  const signatures=parts.filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
  if(!timestamp||!signatures.length) return false;
  const age=Math.abs(Date.now()/1000-Number(timestamp));
  if(!Number.isFinite(age)||age>300) return false;
  const expected=crypto.createHmac('sha256',secret).update(`${timestamp}.${payload}`,'utf8').digest('hex');
  return signatures.some(sig=>safeEqualHex(expected,sig));
}

function customField(session:any,key:string){
  const f=Array.isArray(session?.custom_fields)?session.custom_fields.find((x:any)=>x?.key===key):null;
  return String(f?.text?.value??f?.dropdown?.value??f?.numeric?.value??'').trim();
}

async function ensureLead(session:any,kind:'blueprint'|'audit'|'monitor'){
  const sql=db();
  const email=String(session?.customer_details?.email||session?.customer_email||'').trim().toLowerCase();
  const name=String(session?.customer_details?.name||'Paid customer').trim().slice(0,160);
  const phone=String(session?.customer_details?.phone||'').trim().slice(0,80);
  const website=customField(session,'websiteurl').slice(0,500);
  const goal=customField(session,'maingoal')||customField(session,'priority');
  if(!email) return null;
  const found=await sql`select id,stage from leads where lower(email)=${email} limit 1`;
  const stage=kind==='blueprint'?'Qualified':'Won';
  const score=kind==='blueprint'?85:100;
  const summary=`Stripe verified ${kind} purchase${website?` for ${website}`:''}${goal?`. Priority: ${goal}`:''}.`;
  let lead:any;
  if(found[0]){
    lead=(await sql`update leads set name=case when name in ('','AI Advisor Lead') then ${name} else name end,phone=case when coalesce(phone,'')='' and ${phone}<>'' then ${phone} else phone end,biggest_problem=${summary},qualification_summary=${summary},score=greatest(score,${score}),stage=case when stage in ('Won','Lost') then stage else ${stage} end,updated_at=now() where id=${found[0].id} returning *`)[0];
  }else{
    lead=(await sql`insert into leads(name,email,phone,biggest_problem,consent,score,stage,source,qualification_summary) values(${name},${email},${phone},${summary},false,${score},${stage},${`stripe_${kind}`},${summary}) returning *`)[0];
  }
  return {lead,email,name,phone,website,goal,summary};
}

async function addUniqueTask(leadId:string,title:string,description:string,priority='high'){
  const sql=db();
  const existing=await sql`select id from tasks where lead_id=${leadId} and status='open' and title=${title} limit 1`;
  if(!existing[0]) await sql`insert into tasks(lead_id,title,description,due_at,priority) values(${leadId},${title},${description},now()+interval '1 day',${priority})`;
}

export async function POST(req:Request){
  const raw=await req.text();
  const signature=req.headers.get('stripe-signature')||'';
  const sql=db();
  try{
    const rows=await sql`select value from app_secrets where key='stripe_webhook_secret' limit 1`;
    const secret=String(rows[0]?.value||'').trim();
    if(!secret) return NextResponse.json({error:'Webhook secret is not configured.'},{status:503});
    if(!verifyStripeSignature(raw,signature,secret)) return NextResponse.json({error:'Invalid signature.'},{status:400});
    const event=JSON.parse(raw);
    if(!event?.id||!event?.type) return NextResponse.json({error:'Invalid event.'},{status:400});
    const seen=await sql`select event_id from stripe_webhook_events where event_id=${String(event.id)} limit 1`;
    if(seen[0]) return NextResponse.json({received:true,duplicate:true});

    if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(String(event.type))){
      await sql`insert into stripe_webhook_events(event_id,event_type) values(${String(event.id)},${String(event.type)}) on conflict do nothing`;
      return NextResponse.json({received:true,ignored:true});
    }

    const session=event.data?.object||{};
    const paymentLink=String(session.payment_link||'');
    if(!ALLOWED.has(paymentLink)){
      await sql`insert into stripe_webhook_events(event_id,event_type) values(${String(event.id)},${String(event.type)}) on conflict do nothing`;
      return NextResponse.json({received:true,ignored:true});
    }
    if(String(session.payment_status)!=='paid') return NextResponse.json({received:true,pending:true});

    const kind=paymentLink===BLUEPRINT_LINK?'blueprint':paymentLink===AUDIT_LINK?'audit':'monitor';
    const buyer=await ensureLead(session,kind);
    if(!buyer?.lead?.id) throw new Error('Paid checkout did not include a customer email.');

    await sql`insert into activities(lead_id,type,description,metadata) values(${buyer.lead.id},'stripe_purchase',${`Stripe verified ${kind} purchase`},${JSON.stringify({event_id:event.id,checkout_session_id:session.id,payment_link:paymentLink,amount_total:session.amount_total,currency:session.currency,website:buyer.website,goal:buyer.goal})}::jsonb)`;

    if(kind==='blueprint'){
      if(!buyer.website) throw new Error('Blueprint purchase is missing the required website URL.');
      await sql`insert into website_rescue_orders(checkout_session_id,payment_link_id,customer_email,customer_name,customer_phone,website_url,main_goal,amount_total,currency,payment_status,lead_id,updated_at) values(${String(session.id)},${paymentLink},${buyer.email},${buyer.name},${buyer.phone},${buyer.website},${buyer.goal},${Number(session.amount_total||0)},${String(session.currency||'usd')},'paid',${buyer.lead.id},now()) on conflict(checkout_session_id) do update set payment_status='paid',customer_email=excluded.customer_email,customer_name=excluded.customer_name,customer_phone=excluded.customer_phone,website_url=excluded.website_url,main_goal=excluded.main_goal,amount_total=excluded.amount_total,currency=excluded.currency,lead_id=excluded.lead_id,updated_at=now()`;
      await addUniqueTask(buyer.lead.id,'Follow up after Website Rescue Blueprint','Review the paid Blueprint buyer and offer implementation or the deeper AI Automation Rescue Audit.');
    }else if(kind==='audit'){
      await addUniqueTask(buyer.lead.id,'Onboard paid Rescue Audit client','Contact the paid Rescue Audit client, confirm scope, and begin the technical review.','high');
    }else{
      await addUniqueTask(buyer.lead.id,'Onboard AI Automation Monitor subscriber','Contact the new monitoring subscriber and collect the systems/workflows required for monitoring.','high');
    }

    await sql`insert into stripe_webhook_events(event_id,event_type) values(${String(event.id)},${String(event.type)}) on conflict do nothing`;
    return NextResponse.json({received:true,fulfilled:kind});
  }catch(error){
    console.error('stripe webhook fulfillment failed',error);
    return NextResponse.json({error:'Fulfillment failed.'},{status:500});
  }
}
