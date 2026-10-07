import Link from 'next/link';
import { hasCourseAccess } from '@/lib/courseAccess';
import { courseModules, stripeCourseCheckout } from '@/lib/courseContent';

const shell: React.CSSProperties = { minHeight:'100vh', background:'linear-gradient(180deg,#060b17 0%,#0b1220 45%,#060b17 100%)', color:'#f8fafc', padding:'48px 20px 80px' };
const wrap: React.CSSProperties = { maxWidth:1080, margin:'0 auto' };
const card: React.CSSProperties = { background:'rgba(15,23,42,.84)', border:'1px solid rgba(148,163,184,.18)', borderRadius:20, padding:24, boxShadow:'0 18px 50px rgba(0,0,0,.22)' };
const button: React.CSSProperties = { display:'inline-block', padding:'13px 18px', borderRadius:12, background:'#22c55e', color:'#04120a', textDecoration:'none', fontWeight:800 };

export default async function CourseHome() {
  const unlocked = await hasCourseAccess();

  if (!unlocked) {
    return <main style={shell}><div style={{...wrap,maxWidth:760}}>
      <div style={{fontWeight:900,letterSpacing:'.14em',fontSize:13,color:'#22c55e'}}>PULSEBRIDGE // STUDENT PORTAL</div>
      <h1 style={{fontSize:'clamp(2.6rem,8vw,5rem)',lineHeight:.98,margin:'20px 0 18px'}}>AI Automation Course 2026</h1>
      <p style={{fontSize:19,lineHeight:1.65,color:'#cbd5e1'}}>Build, deploy and sell real AI automations. The student portal contains the course modules, build notes, prompts, workflow maps and downloadable resources.</p>
      <div style={{...card,marginTop:32}}>
        <h2 style={{marginTop:0}}>Student access required</h2>
        <p style={{color:'#cbd5e1',lineHeight:1.6}}>If you just purchased, use the private access link shown after checkout. If you have not enrolled yet, founding-student access is currently $99 one-time.</p>
        <a href={stripeCourseCheckout} style={button}>Enroll for $99 →</a>
        <p style={{fontSize:13,color:'#94a3b8',marginTop:18}}>Already purchased but lost your access link? Contact Pulsebridge from the main site and include the email used at checkout.</p>
      </div>
    </div></main>;
  }

  return <main style={shell}><div style={wrap}>
    <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center',flexWrap:'wrap'}}>
      <div><div style={{fontWeight:900,letterSpacing:'.14em',fontSize:13,color:'#22c55e'}}>PULSEBRIDGE // STUDENT PORTAL</div>
      <h1 style={{fontSize:'clamp(2.4rem,6vw,4.5rem)',lineHeight:1,margin:'14px 0 8px'}}>AI Automation Course 2026</h1>
      <p style={{color:'#94a3b8',margin:0}}>Build it. Deploy it. Make it reliable. Learn how to sell it.</p></div>
      <a href="/api/course/logout" style={{color:'#cbd5e1'}}>Lock portal</a>
    </div>

    <section style={{...card,marginTop:34,background:'linear-gradient(135deg,rgba(34,197,94,.13),rgba(59,130,246,.08))'}}>
      <div style={{fontSize:13,fontWeight:900,color:'#86efac',letterSpacing:'.12em'}}>START HERE</div>
      <h2 style={{fontSize:32,margin:'10px 0'}}>Module 1: AI Automation Foundations</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65,maxWidth:760}}>Learn the architecture behind useful automation, then build the foundation of a lead-response system that connects a trigger, structured data, AI reasoning, an action and a fallback.</p>
      <Link href="/course/module-1" style={button}>Open Module 1 →</Link>
    </section>

    <section style={{marginTop:44}}>
      <h2 style={{fontSize:28}}>Course roadmap</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16}}>
        {courseModules.map(m => <div key={m.n} style={card}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12}}>
            <strong style={{color:'#22c55e'}}>MODULE {String(m.n).padStart(2,'0')}</strong>
            <span style={{fontSize:12,color:m.status==='available'?'#86efac':'#94a3b8'}}>{m.status==='available'?'AVAILABLE':'COMING NEXT'}</span>
          </div>
          <h3 style={{fontSize:20,marginBottom:8}}>{m.title}</h3>
          <p style={{color:'#94a3b8',lineHeight:1.55,marginBottom:0}}>{m.subtitle}</p>
        </div>)}
      </div>
    </section>

    <section style={{...card,marginTop:36}}>
      <h2 style={{marginTop:0}}>Downloads</h2>
      <p style={{color:'#cbd5e1'}}>Start with the course starter pack: workflow architecture, prompt patterns, debugging checklist and client-discovery questions.</p>
      <a href="/course/resources/starter-pack" style={{...button,background:'#e2e8f0',color:'#0f172a'}}>Download Starter Pack →</a>
    </section>
  </div></main>;
}
