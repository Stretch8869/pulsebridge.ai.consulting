import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scanWebsite } from '@/lib/websiteRescue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const clean = (value: unknown, max = 500) => String(value ?? '').trim().slice(0, max);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const website = clean(body.website, 500);
    const name = clean(body.name, 160);
    const email = clean(body.email, 240).toLowerCase();
    const company = clean(body.company, 200);
    const industry = clean(body.industry, 160);
    const primaryGoal = clean(body.primary_goal, 160);
    const consent = body.consent === true || body.consent === 'true';
    const utmSource = clean(body.utm_source, 120);
    const utmMedium = clean(body.utm_medium, 120);
    const utmCampaign = clean(body.utm_campaign, 180);

    if (!website || !name || !email.includes('@') || !consent) {
      return NextResponse.json({ error: 'Website, name, valid email, and contact consent are required.' }, { status: 400 });
    }

    const scan = await scanWebsite(website);
    const sql = db();
    const topFixText = scan.topFixes.length
      ? scan.topFixes.map(f => f.label).join(', ')
      : 'No critical homepage issues detected in the quick scan';
    const summary = `Website Rescue Score ${scan.score}/100 (${scan.label}). Primary goal: ${primaryGoal || 'not specified'}. Top fixes: ${topFixText}. Scanned: ${scan.finalUrl}`.slice(0, 3000);
    const found = await sql`select id, stage, source from leads where lower(email)=${email} limit 1`;
    let lead;

    if (found[0]) {
      lead = (await sql`
        update leads set
          name=${name},
          company=case when ${company}<>'' then ${company} else company end,
          industry=case when ${industry}<>'' then ${industry} else industry end,
          biggest_problem=${summary},
          qualification_summary=${summary},
          consent=true,
          source=case when coalesce(source,'') in ('','website') then 'website_rescue_scan' else source end,
          updated_at=now()
        where id=${found[0].id}
        returning *
      `)[0];
    } else {
      lead = (await sql`
        insert into leads(name,company,email,industry,biggest_problem,consent,score,stage,source,qualification_summary)
        values(${name},${company},${email},${industry},${summary},true,${scan.score},'New','website_rescue_scan',${summary})
        returning *
      `)[0];
    }

    const activityMetadata = JSON.stringify({
      scan,
      primary_goal: primaryGoal,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    await sql`
      insert into activities(lead_id,type,description,metadata)
      values(${lead.id},'website_rescue_scan',${`Website Rescue quick scan completed: ${scan.score}/100`},${activityMetadata}::jsonb)
    `;

    return NextResponse.json({ ok: true, scan, leadId: lead.id });
  } catch (error) {
    console.error('website-rescue scan failed', error);
    const message = error instanceof Error ? error.message : 'Could not scan that website.';
    const safeMessage = /private|local|credentials|http|host|redirect|large|respond|html|scan|network|timeout|website/i.test(message)
      ? message
      : 'Could not scan that website. Check the URL and try again.';
    return NextResponse.json({ error: safeMessage }, { status: 400 });
  }
}
