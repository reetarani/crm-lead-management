
import {
  CalendarDays,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function FollowUpStats({ counts = {} }) {
  const cards = [
    {
      label: "Today's Follow-ups",
      value: counts.today || 0,
      icon: CalendarDays,
      color: "blue",
    },
    {
      label: "Upcoming",
      value: counts.upcoming || 0,
      icon: Clock,
      color: "purple",
    },
    {
      label: "Overdue",
      value: counts.overdue || 0,
      icon: AlertCircle,
      color: "orange",
    },
  ];

  return (
    <section className="followup-stats">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <article className="followup-stat-card" key={label}>
          <div className={`followup-stat-icon ${color}`}>
            <Icon size={21} />
          </div>

          <p>{label}</p>
          <h2>{value}</h2>
        </article>
      ))}
    </section>
  );
}
