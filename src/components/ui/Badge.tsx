interface BadgeProps {
  children: React.ReactNode;
  color: "amber" | "emerald" | "blue" | "green" | "yellow" | "red" | "slate" | "indigo" | "rose" | "violet";
  className?: string;
}

const COLOR_MAP: Record<BadgeProps["color"], string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  red: "bg-red-50 text-red-700 border-red-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function Badge({ children, color, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${COLOR_MAP[color]} ${className}`}>
      {children}
    </span>
  );
}
