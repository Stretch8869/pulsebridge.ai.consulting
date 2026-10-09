import type {Metadata} from 'next';
export const metadata:Metadata={title:'Pulsebridge AI Automation Course 2026',description:'Build, deploy and sell real AI automations.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0,fontFamily:'Inter,Arial,Helvetica,sans-serif',background:'#050914'}}>{children}</body></html>}