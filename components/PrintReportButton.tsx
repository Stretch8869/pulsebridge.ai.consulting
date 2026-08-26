'use client';

export default function PrintReportButton(){
  return <button className="btn btn-ghost no-print" onClick={()=>window.print()}>Print / Save PDF</button>;
}
