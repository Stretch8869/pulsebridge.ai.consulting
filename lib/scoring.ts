export function scoreLead(input: {
  monthly_lead_volume?: number | null;
  timeline?: string | null;
  budget_range?: string | null;
  industry?: string | null;
  biggest_problem?: string | null;
}) {
  let score = 20;
  const volume = Number(input.monthly_lead_volume || 0);
  if (volume >= 200) score += 25;
  else if (volume >= 75) score += 18;
  else if (volume >= 25) score += 10;

  const timeline = (input.timeline || '').toLowerCase();
  if (/now|asap|30 day|this month/.test(timeline)) score += 20;
  else if (/60|90|quarter/.test(timeline)) score += 10;

  const budget = (input.budget_range || '').toLowerCase();
  if (/5000|5k|10k|10000|enterprise/.test(budget)) score += 20;
  else if (/2500|2.5k|3000|3k/.test(budget)) score += 14;
  else if (/1000|1k|1500/.test(budget)) score += 8;

  if ((input.industry || '').trim()) score += 5;
  if ((input.biggest_problem || '').trim().length > 12) score += 10;
  return Math.min(100, score);
}

export function suggestedPackage(problem = '') {
  const p = problem.toLowerCase();
  if (/missed call|phone|reception|answer/.test(p)) return 'AI Receptionist + Missed-Call Recovery';
  if (/follow|lead|crm|pipeline/.test(p)) return 'Lead Follow-Up + CRM Automation';
  if (/review|reputation/.test(p)) return 'Reputation Automation';
  return 'Automation Growth System';
}
