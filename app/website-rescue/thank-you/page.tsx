import Link from 'next/link';
import { SiteShell } from '@/components/Public';

export default function WebsiteRescueThankYou(){return <SiteShell>
<section className="hero"><div className="container"><div className="eyebrow">WEBSITE RESCUE</div><h1 className="display">Thank you.</h1><p className="subhead">If you completed a Stripe purchase, the payment must be verified server-side before paid report access or delivery is granted. This page does not unlock paid content by itself.</p><div className="hero-actions"><Link className="btn btn-primary" href="/website-rescue">Run or review the free scan →</Link><Link className="btn btn-ghost" href="/contact">Talk to PulseBridge</Link></div><div className="card" style={{marginTop:34,maxWidth:760}}><h3>What happens next</h3><p className="section-copy">For a Website Rescue Blueprint purchase, use the website URL and goal submitted through Stripe to prepare the personalized report. For an expert audit or monitoring plan, begin onboarding only after payment is confirmed in Stripe.</p><p className="small">Security note: never grant paid access based only on a URL parameter or someone reaching this page.</p></div></div></section>
</SiteShell>}
