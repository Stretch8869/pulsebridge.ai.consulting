import CRMApp from '@/components/CRMApp';
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const {section}=await params;const mode=(section?.[0]||'dashboard') as 'dashboard'|'leads'|'pipeline'|'tasks'|'settings';if(!['dashboard','leads','pipeline','tasks','settings'].includes(mode))return <CRMApp mode="dashboard"/>;return <CRMApp mode={mode}/>}
