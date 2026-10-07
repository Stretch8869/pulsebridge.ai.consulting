import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hasCourseAccess } from '@/lib/courseAccess';

const shell: React.CSSProperties = { minHeight:'100vh', background:'#07101d', color:'#f8fafc', padding:'40px 20px 80px' };
const wrap: React.CSSProperties = { maxWidth:900, margin:'0 auto' };
const block: React.CSSProperties = { background:'#0f1b2d', border:'1px solid rgba(148,163,184,.18)', borderRadius:18, padding:'24px 26px', marginTop:18 };
const code: React.CSSProperties = { display:'block', whiteSpace:'pre-wrap', background:'#020617', border:'1px solid #1e293b', borderRadius:12, padding:16, color:'#86efac', overflowX:'auto' };

export default async function ModuleOne() {
  if (!(await hasCourseAccess())) redirect('/course');

  return <main style={shell}><article style={wrap}>
    <Link href="/course" style={{color:'#86efac',textDecoration:'none'}}>← Student portal</Link>
    <div style={{marginTop:30,color:'#22c55e',fontWeight:900,letterSpacing:'.12em'}}>MODULE 01</div>
    <h1 style={{fontSize:'clamp(2.5rem,7vw,4.8rem)',lineHeight:1,margin:'12px 0'}}>AI Automation Foundations</h1>
    <p style={{fontSize:20,lineHeight:1.65,color:'#cbd5e1'}}>Your goal is not to collect AI tools. Your goal is to design a dependable system that notices an event, understands the data, makes a controlled decision and takes the next useful action.</p>

    <section style={block}><h2>1. The core automation loop</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>Most useful business automations can be understood with the same seven-part model:</p>
      <pre style={code}>Trigger → Capture Data → Validate → AI/Rules Decision → Action → Record Result → Follow-Up</pre>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>The AI is only one part of the system. Reliability comes from the non-AI pieces: validation, deterministic rules, logging, retries and human fallback.</p>
    </section>

    <section style={block}><h2>2. Your first workflow</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>In n8n, create a workflow with a Manual Trigger followed by an Edit Fields node. Add a field named <strong>message</strong> with the value <strong>Hello, World!</strong>, then execute the workflow and inspect the output. This teaches the pattern every larger build uses: a trigger produces data and downstream nodes transform or act on it.</p>
    </section>

    <section style={block}><h2>3. Turn it into a lead-intake system</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>Replace the Manual Trigger with a Webhook. The webhook receives fields such as name, email and company from a form. Before sending that data to an AI model, validate that required fields exist and normalize them.</p>
      <pre style={code}>{'Example incoming data:\n{\n  "name": "Alex",\n  "email": "alex@example.com",\n  "company": "Acme Corp"\n}'}</pre>
    </section>

    <section style={block}><h2>4. Add AI only where judgment helps</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>Use an AI step to summarize context, classify the lead or draft a response. Do not use AI to decide things that should be deterministic, such as whether an email field is empty or whether a lead has explicitly opted out.</p>
      <pre style={code}>{'Prompt pattern:\nROLE: You are a business lead-intake assistant.\nINPUT: {{ lead data }}\nTASK: Produce a concise company summary and one relevant follow-up angle.\nCONSTRAINTS:\n- Do not invent facts.\n- Return structured JSON.\n- If evidence is missing, say "unknown".\nOUTPUT:\n{ "summary": "...", "follow_up_angle": "...", "confidence": 0-1 }'}</pre>
    </section>

    <section style={block}><h2>5. Build the fallback before going live</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>A production workflow should still move forward when the AI step fails. Route failures to a generic but useful response, log the error, and create a human-review task. That prevents the AI provider from becoming a single point of failure.</p>
    </section>

    <section style={block}><h2>6. Module 1 build challenge</h2>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>Build this exact chain: Webhook → field validation → AI classification → IF branch → follow-up action → logging. Test it with three inputs: a complete lead, a lead missing an email, and an intentionally failed AI step.</p>
      <p style={{color:'#cbd5e1',lineHeight:1.65}}>When all three paths behave predictably, you have moved from a demo to the beginning of a reliable automation.</p>
    </section>

    <div style={{marginTop:30,display:'flex',gap:12,flexWrap:'wrap'}}>
      <a href="/course/resources/starter-pack" style={{padding:'12px 16px',borderRadius:10,background:'#22c55e',color:'#04120a',fontWeight:800,textDecoration:'none'}}>Download Module Resources</a>
      <Link href="/course" style={{padding:'12px 16px',color:'#cbd5e1'}}>Back to roadmap</Link>
    </div>
  </article></main>;
}
