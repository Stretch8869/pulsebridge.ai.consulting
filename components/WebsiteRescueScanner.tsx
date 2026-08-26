'use client';

import { FormEvent, useMemo, useState } from 'react';

type Status = 'pass' | 'warn' | 'fail';
type Check = { id:string; label:string; category:string; status:Status; detail:string; why:string };
type Scan = {
  finalUrl:string;
  score:number;
  label:string;
  categoryScores:Record<string,number>;
  checks:Check[];
  topFixes:Check[];
  responseTimeMs:number;
  disclaimer:string;
};

const BLUEPRINT='https://buy.stripe.com/cNifZh6Y75iS4YY4Fz1sQ10';
const AUDIT='https://book.stripe.com/5kQ14n1DNh1A1MM5JD1sQ11';
const MONITOR='https://buy.stripe.com/dRm8wPbeneTs632dc51sQ12';

function scoreMessage(score:number){
  if(score<=49) return 'Your site needs a rescue plan — get the $29 Blueprint';
  if(score<=74) return 'Fix the highest-impact gaps — get the $29 Blueprint';
  return 'Turn a good foundation into more leads — see the $29 Blueprint';
}

export default function WebsiteRescueScanner(){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [scan,setScan]=useState<Scan|null>(null);
  const [copied,setCopied]=useState(false);
  const passed=useMemo(()=>scan?.checks.filter(c=>c.status==='pass')||[],[scan]);
  const issues=useMemo(()=>scan?.checks.filter(c=>c.status!=='pass')||[],[scan]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');setScan(null);
    const form=new FormData(e.currentTarget); const body:any=Object.fromEntries(form.entries());
    body.consent=form.get('consent')==='on';
    const p=new URLSearchParams(window.location.search);
    body.utm_source=p.get('utm_source')||''; body.utm_medium=p.get('utm_medium')||''; body.utm_campaign=p.get('utm_campaign')||'';
    try{
      const r=await fetch('/api/website-rescue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||'Could not scan that website.'); setScan(d.scan);
      setTimeout(()=>document.getElementById('scan-results')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }catch(err){setError(err instanceof Error?err.message:'Could not scan that website.')}finally{setBusy(false)}
  }

  async function share(){
    if(!scan)return; const issueCount=issues.length; const text=`My website scored ${scan.score}/100 on the PulseBridge Website Rescue Scan. I found ${issueCount} issue${issueCount===1?'':'s'} to review.`;
    try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{setError('Copy failed. You can still select and share your score manually.')}
  }

  return <>
    <section className="section-tight"><div className="container"><form className="card form-card" onSubmit={submit} style={{maxWidth:900,margin:'0 auto'}}>
      <div className="field-grid">
        <div className="field"><label>Website URL</label><input className="input" name="website" placeholder="yourbusiness.com" required/></div>
        <div className="field"><label>Name</label><input className="input" name="name" required/></div>
        <div className="field"><label>Email</label><input className="input" name="email" type="email" required/></div>
        <div className="field"><label>Business name</label><input className="input" name="company"/></div>
        <div className="field"><label>Industry</label><input className="input" name="industry" placeholder="HVAC, roofing, legal, automotive…"/></div>
        <div className="field"><label>Main goal</label><select className="input" name="primary_goal"><option>Get more leads</option><option>Rank higher on Google</option><option>Improve AI visibility</option><option>Fix website conversion</option></select></div>
      </div>
      <label className="small" style={{display:'flex',gap:9,marginTop:16,alignItems:'flex-start'}}><input type="checkbox" name="consent" required style={{marginTop:3}}/> I agree that PulseBridge may save this scan with my lead record and contact me about the results.</label>
      <button className="btn btn-primary" style={{marginTop:18,width:'100%'}} disabled={busy}>{busy?'Scanning homepage…':'Scan My Website Free →'}</button>
      <p className="small" style={{marginTop:12}}>No credit card. This is a quick homepage scan, not a full professional SEO audit.</p>
      {error&&<div className="status bad">{error}</div>}
    </form></div></section>

    {scan&&<section id="scan-results" className="section"><div className="container">
      <div className="grid grid-2" style={{alignItems:'stretch'}}>
        <div className="card" style={{display:'grid',alignContent:'center',textAlign:'center'}}><div className="eyebrow">WEBSITE RESCUE SCORE</div><div className="price" style={{fontSize:'clamp(4.5rem,10vw,8rem)',lineHeight:1}}>{scan.score}<span style={{fontSize:'1.2rem',color:'var(--muted)'}}>/100</span></div><h3>{scan.label}</h3><p className="section-copy" style={{margin:'8px auto 0'}}>{scan.finalUrl}</p><p className="small">Approx. homepage response: {scan.responseTimeMs} ms</p><button className="btn btn-ghost" onClick={share} style={{marginTop:16}}>{copied?'Score copied ✓':'Share my score'}</button></div>
        <div className="card"><div className="eyebrow">CATEGORY BREAKDOWN</div>{Object.entries(scan.categoryScores).map(([name,value])=><div key={name} style={{marginTop:20}}><div style={{display:'flex',justifyContent:'space-between',gap:16}}><strong>{name}</strong><strong>{value}/100</strong></div><div style={{height:9,background:'rgba(255,255,255,.08)',borderRadius:999,overflow:'hidden',marginTop:8}}><div style={{width:`${value}%`,height:'100%',background:'linear-gradient(90deg,var(--accent),#65f0ff)'}}/></div></div>)}</div>
      </div>

      <div style={{marginTop:32}}><div className="eyebrow">TOP 3 FIXES FIRST</div><h2 className="section-title">Start where the scan found the biggest gaps.</h2><div className="grid grid-3" style={{marginTop:24}}>{scan.topFixes.length?scan.topFixes.map((f,i)=><div className="card" key={f.id}><div className="service-number">0{i+1}</div><h3>{f.label}</h3><p>{f.detail}</p><p className="small"><strong>Why it matters:</strong> {f.why}</p></div>):<div className="card"><h3>No major homepage gaps detected</h3><p>The quick scan found a strong foundation. A deeper audit can still evaluate rankings, competitors, analytics, conversion paths, automations, and full-site issues.</p></div>}</div></div>

      <div className="grid grid-2" style={{marginTop:32}}><div className="card"><h3>Issues to review</h3>{issues.length?issues.map(c=><div key={c.id} style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}><strong>{c.status==='fail'?'✕':'△'} {c.label}</strong><div className="small">{c.detail}</div></div>):<p className="section-copy">No issues were flagged by the quick checks.</p>}</div><div className="card"><h3>Checks passed</h3>{passed.map(c=><div key={c.id} style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}><strong>✓ {c.label}</strong><div className="small">{c.detail}</div></div>)}</div></div>

      <div className="card" style={{marginTop:34,padding:'42px'}}><div className="eyebrow">NEXT BEST STEP</div><h2 className="section-title" style={{fontSize:'clamp(2rem,4vw,3.3rem)'}}>{scoreMessage(scan.score)}</h2><p className="section-copy">The paid Blueprint turns the quick scan into a prioritized repair roadmap, 7-day action plan, SEO/AI-readiness checklist, page recommendations, and implementation instructions.</p><a className="btn btn-primary" href={BLUEPRINT} target="_blank" rel="noreferrer" style={{marginTop:20}}>Get My Personalized Blueprint — $29 →</a></div>

      <div style={{marginTop:42}}><div className="eyebrow">GO FARTHER</div><h2 className="section-title">A low-cost entry point with a real service ladder behind it.</h2><div className="grid grid-3" style={{marginTop:24}}>
        <div className="card"><span className="pill">DIY</span><h3 style={{marginTop:16}}>Website Rescue Blueprint</h3><div className="price">$29</div><p>Personalized repair roadmap, priority fixes, 7-day action plan, SEO/AI checklist, and implementation instructions.</p><a className="btn btn-primary" href={BLUEPRINT} target="_blank" rel="noreferrer">Buy Blueprint →</a></div>
        <div className="card"><span className="pill">EXPERT REVIEW</span><h3 style={{marginTop:16}}>AI Automation Rescue Audit</h3><div className="price">$497</div><p>Deeper technical review across website, lead flow, CRM, integrations, and automations, with a concrete rescue plan.</p><a className="btn btn-ghost" href={AUDIT} target="_blank" rel="noreferrer">Book Rescue Audit →</a></div>
        <div className="card"><span className="pill">ONGOING</span><h3 style={{marginTop:16}}>AI Automation Monitor</h3><div className="price">$497<span style={{fontSize:'1rem'}}> / mo</span></div><p>Workflow health checks, error monitoring, usage monitoring, and minor fixes to keep automations running.</p><a className="btn btn-ghost" href={MONITOR} target="_blank" rel="noreferrer">Start Monitoring →</a></div>
      </div></div>

      <div className="card" style={{marginTop:32}}><h3>What this free scan does not measure</h3><p className="section-copy">{scan.disclaimer}</p><p className="small">Scores are based only on the checks shown above. PulseBridge does not promise rankings, traffic, revenue, or other business results from this scan.</p></div>
    </div></section>}
  </>;
}
