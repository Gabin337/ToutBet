import type { ReactNode } from 'react';

export function Card(props: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:border-white/20 hover:bg-black/25 ${props.className ?? ''}`}
    >
      {props.title ? <div className="mb-3 text-sm font-semibold text-white/90">{props.title}</div> : null}
      {props.children}
    </div>
  );
}

