import { suggestedPackage } from './scoring';

type Msg = { role: 'user' | 'assistant'; content: string };

const fallbackQuestions = [
  'What type of business do you run?',
  'About how many inbound leads or calls do you get each month?',
  'Where are leads falling through the cracks today — missed calls, slow follow-up, booking, CRM work, reviews, or something else?',
  'What CRM or booking system are you using now, if any?',
  'What result matters most: more booked jobs, faster response, lower admin workload, or better lead conversion?',
  'How soon would you like this automation live?',
  'What monthly budget range feels realistic if the system clearly pays for itself?'
];

export function deterministicReply(messages: Msg[]) {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length < fallbackQuestions.length) {
    return fallbackQuestions[userMessages.length];
  }
  const combined = userMessages.map(m => m.content).join(' ');
  return `Based on what you shared, the strongest starting point is our ${suggestedPackage(combined)}. I can save this as a qualified opportunity and have PulseBridge follow up. What is the best name, email, and phone number for you, and do you consent to PulseBridge contacting you about this request?`;
}

export async function agentReply(messages: Msg[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return deterministicReply(messages);
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: 'You are PulseBridge AI Advisor, a concise senior automation consultant for service businesses. Qualify prospects by learning business type, monthly lead volume, missed-call/follow-up problems, current CRM, desired outcome, timeline and budget. Recommend only relevant PulseBridge services. Never invent ROI, customer results, or guarantees. Ask one question at a time. When enough is known, ask for contact details and consent for follow-up.'
          },
          ...messages
        ],
        max_output_tokens: 260
      })
    });
    if (!response.ok) return deterministicReply(messages);
    const data = await response.json();
    return data.output_text || deterministicReply(messages);
  } catch {
    return deterministicReply(messages);
  }
}
