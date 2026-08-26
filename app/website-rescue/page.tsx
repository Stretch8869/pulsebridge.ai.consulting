import type { Metadata } from 'next';
import { SiteShell } from '@/components/Public';
import WebsiteRescueScanner from '@/components/WebsiteRescueScanner';

export const metadata: Metadata = {
  title: 'Free Website Rescue Scan | PulseBridge AI Solutions',
  description: 'Run a free small-business website scan for SEO foundations, technical basics, AI/schema readiness, and conversion gaps. Get a transparent score and prioritized fixes.',
  alternates: { canonical: '/website-rescue' },
  openGraph: {
    title: 'Free Website Rescue Scan | PulseBridge AI Solutions',
    description: 'Find the SEO, AI-visibility, technical, and conversion issues costing your website leads.',
    type: 'website',
  },
};

const faq=[
  ['Is this a full SEO audit?','No. The free scan checks observable homepage HTML and response behavior. It does not claim to measure rankings, backlinks, traffic, competitors, search volume, or Core Web Vitals.'],
  ['What does the Website Rescue Score measure?','The score is built from the checks shown in your results: SEO foundations, technical basics, structured data/AI readiness, and conversion readiness.'],
  ['Do I have to buy anything?','No. The quick scan is free. The $29 Blueprint is optional and is designed for owners who want a more detailed repair roadmap.'],
  ['Can PulseBridge implement the fixes?','Yes. The funnel includes a deeper Rescue Audit and ongoing monitoring, and PulseBridge can scope implementation for businesses that want the work handled for them.'],
];

export default function WebsiteRescuePage(){
  const schema={
    '@context':'https://schema.org',
    '@type':'FAQPage',
    mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})),
  };
  return <SiteShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
    <section className="hero"><div className="container">
      <div className="eyebrow">FREE WEBSITE RESCUE SCAN</div>
      <h1 className="display">Find what’s costing your website <span className="soft">leads.</span></h1>
      <p className="subhead">Run a free PulseBridge website scan and see the SEO, AI-visibility, technical, and conversion issues holding your business back.</p>
      <div className="trust-row"><span><i/>No credit card</span><span><i/>Transparent scoring</span><span><i/>Real server-side checks</span><span><i/>No fake ranking claims</span></div>
    </div></section>

    <WebsiteRescueScanner/>

    <section className="section"><div className="container"><div className="grid grid-2">
      <div><div className="eyebrow">WHY THIS IS DIFFERENT</div><h2 className="section-title">A useful diagnostic first. The offer comes second.</h2><p className="section-copy">The scanner does not invent traffic, revenue, keyword rankings, backlinks, or competitor data. It inspects what can actually be observed from the homepage and explains every scored check.</p></div>
      <div className="card"><h3>The revenue model</h3><div className="steps"><div className="step"><h3>1. Free scan</h3><p>Give the owner useful evidence and capture the lead in the PulseBridge CRM.</p></div><div className="step"><h3>2. $29 Blueprint</h3><p>Sell a low-friction personalized repair roadmap.</p></div><div className="step"><h3>3. $497 expert audit</h3><p>Move qualified buyers into deeper technical and automation review.</p></div><div className="step"><h3>4. Implementation + monitoring</h3><p>Convert the right clients into higher-value service and recurring support.</p></div></div></div>
    </div></div></section>

    <section className="section"><div className="container"><div className="eyebrow">FAQ</div><h2 className="section-title">Know exactly what you are getting.</h2><div className="grid grid-2" style={{marginTop:28}}>{faq.map(([q,a])=><div className="card" key={q}><h3>{q}</h3><p className="section-copy">{a}</p></div>)}</div></div></section>
  </SiteShell>;
}
