import type { ReactNode } from 'react';

export function Input(props: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-white/70">{props.label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 focus-within:ring-2 focus-within:ring-accent/70">
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          type={props.type ?? 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {props.right}
      </div>
    </label>
  );
}

