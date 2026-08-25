import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pulsebridge.ai.solutions | AI Automation for Service Businesses',
  description: 'AI receptionists, missed-call recovery, lead follow-up, booking and CRM automation for service businesses.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
