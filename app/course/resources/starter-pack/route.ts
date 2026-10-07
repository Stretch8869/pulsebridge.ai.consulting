import { NextResponse } from 'next/server';
import { hasCourseAccess } from '@/lib/courseAccess';

const starterPack = [
  '# Pulsebridge AI Automation Course — Starter Pack',
  '',
  '## The automation architecture',
  'Trigger -> Capture Data -> Validate -> AI/Rules Decision -> Action -> Record Result -> Follow-Up',
  '',
  '## Build checklist',
  '1. Define one measurable business problem.',
  '2. Identify the exact trigger.',
  '3. List the minimum data required.',
  '4. Validate required inputs before AI.',
  '5. Use deterministic rules when judgment is not needed.',
  '6. Give AI a narrow task and structured output.',
  '7. Add a fallback path.',
  '8. Log every meaningful result.',
  '9. Test success, missing-data and failure cases.',
  '10. Estimate ongoing tool/API cost before launch.',
  '',
  '## Reliable AI prompt pattern',
  'ROLE: Define the role.',
  'INPUT: Pass only the data needed.',
  'TASK: State one clear job.',
  'CONSTRAINTS:',
  '- Do not invent facts.',
  '- Return structured output.',
  '- State unknown when evidence is missing.',
  'OUTPUT:',
  'Define the exact JSON fields you need.',
  '',
  '## Client discovery questions',
  '- Where do leads enter the business?',
  '- What happens after a missed call?',
  '- How quickly does a new inquiry receive a response?',
  '- Which repetitive admin task consumes the most time?',
  '- Where does customer information get copied manually?',
  '- What happens when an automation or employee misses a step?',
  '- What system is the source of truth?',
  '- What result would make this automation clearly worth paying for?',
  '',
  '## Reliability checklist',
  '- Required-field validation',
  '- Duplicate protection',
  '- Timeout handling',
  '- Retry limits',
  '- Human escalation',
  '- Error log',
  '- Consent / unsubscribe controls where applicable',
  '- Credential isolation',
  '- Cost ceiling',
  '- Manual shutdown path',
  '',
  '## Module 1 challenge',
  'Build: Webhook -> Validate -> AI Classify -> IF -> Follow-Up -> Log',
  'Test:',
  'A) complete lead',
  'B) missing email',
  'C) AI failure',
].join('\n');

export async function GET() {
  if (!(await hasCourseAccess())) {
    return new NextResponse('Student access required', { status: 401 });
  }

  return new NextResponse(starterPack, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pulsebridge-ai-automation-starter-pack.md"',
      'Cache-Control': 'private, no-store',
    },
  });
}
