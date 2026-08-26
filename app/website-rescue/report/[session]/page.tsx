import { SiteShell } from '@/components/Public';
import PrintReportButton from '@/components/PrintReportButton';
import { db } from '@/lib/db';
import { scanWebsite } from '@/lib/websiteRescue';
import { buildWebsiteBlueprint, type WebsiteBlueprint } from '@/lib/websiteBlueprint';

export const dynamic='force-dynamic';
export const revalidate=0;

const AUDIT='https://book.stripe.com/5kQ14n1DNh1A1MM5JD1sQ11';
const MONITOR='https://buy.stripe.com/dRm8wPbeneTs632dc51sQ12';

function Pending(){return <SiteShell><meta httpEquiv="refresh" content="3"/><section className="hero"><div className="container" style={{maxWidth:800}}><div className="eyebrow">PAYMENT CONFIRMATION</div><h1 className="display" style={{fontSize:'clamp(3rem,7vw,5.5rem)'}}>Stripe is confirming your purchase.</h1><p className="subhead">Your Blueprint unlocks only after the signed Stripe payment event reaches PulseBridge. This page will check again automatically.</p><div className="card" style={{marginTop:30}}><strong>Do not close this page yet.</strong><p className="section-copy">Most card payments confirm immediately. If you used a payment method with delayed confirmation, the report unlocks after Stripe marks the payment paid.</p></div></div></section></SiteShell>}

export default async function PaidBlueprintPage({params}:{params:Promise<{session:string}>}){
  const {session}=await params;
  if(!/^cs_(?:live|test)_[A-Za-z0-9]+$/.test(session)) return <Pending/>;
  const sql=db();
  const rows=await sql`select * from website_rescue_orders where checkout_session_id=${session} and payment_status='paid' limit 1`;
  const order:any=rows[0];
  if(!order) return <Pending/>;

  let report=order.report as WebsiteBlueprint|null;
  let generationError='';
  if(!report){
    try{
      const scan=await scanWebsite(String(order.website_url));
      report=buildWebsiteBlueprint(scan,String(order.main_goal||''));
      await sql`update website_rescue_orders set report=${JSON.stringify(report)}::jsonb,updated_at=now() where id=${order.id}`;
      if(order.lead_id) await sql`insert into activities(lead_id,type,description,metadata) values(${order.lead_id},'blueprint_generated','Paid Website Rescue Blueprint generated',${JSON.stringify({checkout_session_id:session,score:report.score,website:report.website})}::jsonb)`;
    }catch(error){
      console.error('blueprint generation failed',error);
      generationError=error instanceof Error?error.message:'The website could not be scanned right now.';
    }
  }

  if(!report) return <SiteShell><section className="hero"><div className="container" style={{maxWidth:800}}><div className="eyebrow">PAID BLUEPRINT</div><h1 className="display" style={{fontSize:'clamp(3rem,7vw,5.5rem)'}}>Payment verified. The site scan needs attention.</h1><p className="subhead">Your purchase is recorded and secure, but the website could not be scanned successfully right now.</p><div className="card" style={{marginTop:30}}><h3>What happened</h3><p className="section-copy">{generationError}</p><p className="small">Your paid order remains stored. You can return to this same report link and retry.</p></div></div></section></SiteShell>;

  const issues=report.checks.filter(c=>c.status!=='pass');
  return <SiteShell>
    <section className="hero"><div className="container"><div className="eyebrow">PAID WEBSITE RESCUE BLUEPRINT</div><h1 className="display">Your repair roadmap is <span className="soft">ready.</span></h1><p className="subhead">Built from the website supplied at checkout and unlocked only after Stripe confirmed payment.</p><div className="hero-actions"><PrintReportButton/><a className="btn btn-primary no-print" href={AUDIT} target="_blank" rel="noreferrer">Have PulseBridge Go Deeper — $497 →</a></div><div className="trust-row"><span><i/>Payment verified</span><span><i/>Personalized to {report.website}</span><span><i/>Generated {new Date(report.generatedAt).toLocaleDateString()}</span></div></div></section>

    <section className="section-tight"><div className="container grid grid-2"><div className="card" style={{display:'grid',alignContent:'center'}}><div className="eyebrow">RESCUE SCORE</div><div className="price" style={{fontSize:'clamp(4.8rem,10vw,8rem)',lineHeight:1}}>{report.score}<span style={{fontSize:'1.1rem',color:'var(--muted)'}}>/100</span></div><h2>{report.label}</h2><p className="section-copy"><strong>Primary goal:</strong> {report.goal}</p></div><div className="card"><div className="eyebrow">EXECUTIVE SUMMARY</div><h2 style={{fontSize:'2rem',letterSpacing:'-.035em'}}>What the scan says to fix first</h2><p className="section-copy">{report.executiveSummary}</p><p className="small">This report is based on observable homepage signals. It does not invent rankings, traffic, backlinks, or revenue results.</p></div></div></section>

    <section className="section"><div className="container"><div className="eyebrow">PRIORITY REPAIR PLAN</div><h2 className="section-title">Fix these in this order.</h2><div className="grid grid-3" style={{marginTop:26}}>{report.priorityActions.map((a,i)=><article className="card" key={`${a.title}-${i}`}><div className="service-number">{String(i+1).padStart(2,'0')}</div><h3>{a.title}</h3><p className="section-copy" style={{fontSize:'.98rem'}}>{a.why}</p><ol style={{paddingLeft:20,color:'var(--muted)'}}>{a.steps.map(s=><li key={s} style={{marginBottom:8}}>{s}</li>)}</ol></article>)}</div></div></section>

    <section className="section-tight"><div className="container"><div className="eyebrow">7-DAY EXECUTION SPRINT</div><h2 className="section-title">Turn the report into action this week.</h2><div className="grid grid-2" style={{marginTop:26}}>{report.sevenDayPlan.map(d=><article className="card" key={d.day}><div className="service-number">DAY {d.day}</div><h3>{d.title}</h3><ul style={{paddingLeft:20,color:'var(--muted)'}}>{d.tasks.map(t=><li key={t} style={{marginBottom:8}}>{t}</li>)}</ul></article>)}</div></div></section>

    <section className="section"><div className="container"><div className="eyebrow">SCORECARD</div><h2 className="section-title">Where the homepage is strong and weak.</h2><div className="grid grid-2" style={{marginTop:26}}>{Object.entries(report.categoryScores).map(([name,value])=><div className="card" key={name}><div style={{display:'flex',justifyContent:'space-between',gap:20}}><h3 style={{margin:0}}>{name}</h3><strong>{value}/100</strong></div><div style={{height:10,background:'rgba(255,255,255,.08)',borderRadius:999,overflow:'hidden',marginTop:14}}><div style={{height:'100%',width:`${value}%`,background:'linear-gradient(90deg,var(--blue),var(--blue-2))'}}/></div></div>)}</div><div className="card" style={{marginTop:26}}><h3>{issues.length} homepage finding{issues.length===1?'':'s'} to review</h3>{report.checks.map(c=><div key={c.id} style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:16,padding:'13px 0',borderBottom:'1px solid var(--line)'}}><strong>{c.status==='pass'?'PASS':c.status==='warn'?'REVIEW':'FIX'}</strong><div><strong>{c.label}</strong><div className="small">{c.detail}</div></div></div>)}</div></div></section>

    <section className="section-tight no-print"><div className="container"><div className="card" style={{padding:'44px'}}><div className="eyebrow">GO FARTHER</div><h2 className="section-title" style={{fontSize:'clamp(2.2rem,4vw,3.7rem)'}}>The Blueprint tells you what to repair. PulseBridge can inspect the whole revenue system.</h2><p className="section-copy">{report.nextStep}</p><div className="hero-actions"><a className="btn btn-primary" href={AUDIT} target="_blank" rel="noreferrer">Book AI Automation Rescue Audit — $497 →</a><a className="btn btn-ghost" href={MONITOR} target="_blank" rel="noreferrer">See Ongoing Monitoring — $497/mo</a></div></div></div></section>
  </SiteShell>;
}
