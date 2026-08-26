import type { WebsiteRescueScan, RescueCheck } from './websiteRescue';

export type BlueprintAction={title:string;why:string;steps:string[]};
export type WebsiteBlueprint={
  generatedAt:string;
  website:string;
  goal:string;
  score:number;
  label:string;
  executiveSummary:string;
  priorityActions:BlueprintAction[];
  sevenDayPlan:{day:number;title:string;tasks:string[]}[];
  categoryScores:WebsiteRescueScan['categoryScores'];
  checks:WebsiteRescueScan['checks'];
  nextStep:string;
};

const actionMap:Record<string,(c:RescueCheck)=>BlueprintAction>={
  https:()=>({title:'Serve the entire site securely over HTTPS',why:'Security and trust are foundational for visitors, browsers, and search systems.',steps:['Force HTTPS on every public page.','Redirect HTTP URLs to their HTTPS equivalents.','Confirm mixed-content warnings are eliminated.']}),
  response:()=>({title:'Fix homepage availability',why:'A page that does not return a successful response cannot reliably convert or rank.',steps:['Check hosting and DNS health.','Resolve redirect loops or server errors.','Re-test the public homepage after the fix.']}),
  viewport:()=>({title:'Add correct mobile viewport settings',why:'Most service-business traffic is mobile, and broken mobile rendering costs leads.',steps:['Add a standard responsive viewport meta tag.','Test key pages at phone widths.','Keep primary calls to action visible without zooming.']}),
  canonical:()=>({title:'Declare the preferred canonical URL',why:'Canonical signals help search systems consolidate duplicate page versions.',steps:['Add a self-referencing canonical to the homepage.','Use one preferred HTTPS hostname consistently.','Check internal links point to canonical URLs.']}),
  title:(c)=>({title:'Rewrite the homepage title',why:c.why,steps:['Lead with the main service or outcome.','Include the primary market or differentiator when useful.','Keep the title readable rather than keyword-stuffed.']}),
  description:()=>({title:'Write a stronger search description',why:'A clear meta description helps prospects understand the offer before they click.',steps:['State who the business helps.','Name the primary service or outcome.','End with a credible next step.']}),
  h1:()=>({title:'Create one clear primary H1',why:'A focused H1 gives visitors and search systems a strong topic signal.',steps:['Use one primary H1 on the homepage.','Describe the core customer outcome in plain language.','Move secondary topics into H2 sections.']}),
  robots:()=>({title:'Remove accidental noindex blocking',why:'A noindex directive can keep the page out of normal search results.',steps:['Confirm the page is intended to be public.','Remove noindex from production pages that should rank.','Recheck robots and indexing settings after deployment.']}),
  words:()=>({title:'Add useful decision-making content',why:'Thin pages often fail to answer the questions buyers and search systems need answered.',steps:['Explain the main services and who they are for.','Add proof, process, FAQs, and service-area context where accurate.','Keep the copy specific and useful rather than padded.']}),
  alts:()=>({title:'Improve image alt coverage',why:'Alt text improves accessibility and gives automated systems useful image context.',steps:['Add concise alt text to meaningful images.','Leave decorative images empty when appropriate.','Describe the image purpose, not a pile of keywords.']}),
  schema:()=>({title:'Add structured business data',why:'Schema gives search and AI systems machine-readable context about the company and offer.',steps:['Add valid Organization or LocalBusiness JSON-LD when applicable.','Add Service and FAQ markup only where the visible page supports it.','Validate structured data after publishing.']}),
  og:()=>({title:'Complete social sharing metadata',why:'Clean Open Graph metadata improves link previews and machine parsing.',steps:['Set og:title and og:description.','Add a strong share image.','Keep the social message consistent with the landing page offer.']}),
  lang:()=>({title:'Declare the page language',why:'Explicit language metadata helps accessibility tools and automated parsers.',steps:['Set the HTML lang attribute.','Use the actual primary page language.','Repeat on localized versions with the correct language code.']}),
  cta:()=>({title:'Make the primary call to action unmistakable',why:'A visitor should know the next step within seconds.',steps:['Choose one primary action such as Book, Call, or Get a Quote.','Repeat it near the top and after key proof sections.','Use outcome-focused button copy instead of vague labels.']}),
  contact:()=>({title:'Reduce contact friction',why:'Service-business visitors often convert fastest through phone, email, or a short form.',steps:['Add click-to-call on mobile.','Make the contact path visible above the fold.','Keep the first inquiry form short.']}),
  links:()=>({title:'Strengthen internal navigation',why:'Internal links help visitors and search systems reach important service and trust pages.',steps:['Link to the highest-value service pages.','Add About, Contact, and proof pages where relevant.','Use descriptive anchor text.']}),
  action:()=>({title:'Add a visible conversion element',why:'Interest does not become revenue without an obvious action mechanism.',steps:['Add a prominent button or short form.','Place it near the main value proposition.','Test the action on mobile and desktop.']}),
};

function actionFor(check:RescueCheck):BlueprintAction{
  return actionMap[check.id]?.(check) || {title:check.label,why:check.why,steps:['Review the finding.','Correct the issue on the affected page.','Re-test after publishing.']};
}

export function buildWebsiteBlueprint(scan:WebsiteRescueScan,goal:string):WebsiteBlueprint{
  const issues=scan.checks.filter(c=>c.status!=='pass').sort((a,b)=>(b.weight-b.earned)-(a.weight-a.earned)||b.weight-a.weight);
  const priorityActions=(issues.length?issues.slice(0,6):scan.checks.slice(0,3)).map(actionFor);
  const goalText=goal||'increase qualified leads';
  const executiveSummary=scan.score<50
    ? `The homepage has several foundational gaps that can reduce trust, discoverability, and conversion. The fastest route toward ${goalText.toLowerCase()} is to fix the highest-weight technical and conversion issues first, then strengthen the page structure and machine-readable context.`
    : scan.score<75
      ? `The homepage has a workable base, but the scan found specific gaps that can weaken search visibility and conversion. Focus the next seven days on the priority actions below and tie each change back to the goal of ${goalText.toLowerCase()}.`
      : `The homepage already has a solid foundation. The best opportunity now is refinement: strengthen the remaining weak signals, make the conversion path sharper, and use deeper analytics and competitor research to pursue ${goalText.toLowerCase()}.`;

  const issueTitles=priorityActions.map(a=>a.title);
  const sevenDayPlan=[
    {day:1,title:'Fix blockers',tasks:issueTitles.slice(0,2).length?issueTitles.slice(0,2):['Confirm the strongest current pages and offers.']},
    {day:2,title:'Clarify the offer',tasks:['Rewrite the hero around one customer problem, one outcome, and one primary action.','Make phone, quote, booking, or contact actions easy to find.']},
    {day:3,title:'Strengthen search foundations',tasks:['Review title, description, H1, canonical, indexing, and internal links.','Align the homepage topic with the service buyers actually search for.']},
    {day:4,title:'Improve AI and structured context',tasks:['Add or validate appropriate structured data.','Complete page language and share metadata.','Make business identity and services explicit in visible copy.']},
    {day:5,title:'Build trust',tasks:['Add accurate proof such as reviews, certifications, process, guarantees, or portfolio examples where available.','Answer the top objections in an FAQ section.']},
    {day:6,title:'Test conversion',tasks:['Test every primary action on phone and desktop.','Remove unnecessary form fields and dead-end links.','Confirm every inquiry has a follow-up process.']},
    {day:7,title:'Measure and prioritize the next sprint',tasks:['Record the changes made and the baseline conversion metrics you can actually measure.','Choose the next improvement based on evidence rather than adding random AI tools.']},
  ];

  return {generatedAt:new Date().toISOString(),website:scan.finalUrl,goal:goalText,score:scan.score,label:scan.label,executiveSummary,priorityActions,sevenDayPlan,categoryScores:scan.categoryScores,checks:scan.checks,nextStep:'If you want PulseBridge to inspect the full site, lead flow, CRM, and automations instead of stopping at the homepage, the AI Automation Rescue Audit is the next level.'};
}
