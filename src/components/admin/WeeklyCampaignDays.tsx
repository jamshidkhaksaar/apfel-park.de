'use client';
import { upcomingWeeklyDates } from '@/lib/campaign-weekly';
import type { RepairCampaignRules } from '@/lib/repair-campaign-rules';

const days = [
  { number:1, de:'Montag', en:'Monday' },
  { number:2, de:'Dienstag', en:'Tuesday' },
  { number:3, de:'Mittwoch', en:'Wednesday' },
  { number:4, de:'Donnerstag', en:'Thursday' },
  { number:5, de:'Freitag', en:'Friday' },
  { number:6, de:'Samstag', en:'Saturday' },
  { number:7, de:'Sonntag', en:'Sunday' },
];

export default function WeeklyCampaignDays({locale,value,onChange}:{locale:'de'|'en';value:RepairCampaignRules;onChange:(value:RepairCampaignRules)=>void}){
  const de=locale==='de';
  const selected=value.weeklyDays??[];
  const upcoming=upcomingWeeklyDates(selected);
  return <fieldset className="mt-5 rounded-xl border border-border p-4">
    <legend className="px-2 font-semibold text-foreground">{de?'Wöchentliche Aktionstage':'Weekly promotion days'}</legend>
    <p className="mb-3 text-sm text-muted">{de?'Jede Woche wiederholen, ganztägig nach Hamburger Zeit. Ohne Auswahl gelten die einmaligen Start- und Endzeiten.':'Repeat every week, all day in Hamburg time. With no day selected, the one-time start and end times apply.'}</p>
    <div className="flex flex-wrap gap-2">{days.map(day=><label key={day.number} className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-foreground">
      <input type="checkbox" checked={selected.includes(day.number)} onChange={event=>{
        const weeklyDays=event.target.checked?[...new Set([...selected,day.number])].sort((a,b)=>a-b):selected.filter(n=>n!==day.number);
        onChange({...value,weeklyDays,dates:weeklyDays.length?[]:value.dates});
      }}/>{de?day.de:day.en}
    </label>)}</div>
    {upcoming.length?<p className="mt-3 text-sm text-muted">{de?'Nächste Termine (Hamburg)':'Next dates (Hamburg)'}: <span className="font-medium text-foreground">{upcoming.join(' · ')}</span></p>:null}
  </fieldset>;
}
