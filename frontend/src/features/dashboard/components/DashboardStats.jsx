import {
  Users,
  UserPlus,
  Target,
  Clock3,
  TrendingUp,
} from "lucide-react";

export default function DashboardStats({ statsData }) {
  const totalLeads = statsData?.totalLeads || 0;

  const getCount = (status) =>
    statsData?.statusCounts?.find(
      (item) => item.status === status
    )?.count || 0;

  const newLeads = getCount("New");
  const contactedLeads = getCount("Contacted");
  const qualifiedLeads = getCount("Qualified");
  const convertedLeads = getCount("Converted");
  const lostLeads = getCount("Lost");

  const otherLeads =
    contactedLeads + qualifiedLeads + lostLeads;

  const conversionRate =
    totalLeads > 0
      ? (convertedLeads / totalLeads) * 100
      : 0;

  const stats = [
    {
      label: "Total leads",
      value: totalLeads,
      icon: Users,
      color: "purple",
      note: "All active leads",
    },
    {
      label: "New leads",
      value: newLeads,
      icon: UserPlus,
      color: "blue",
      note: "Awaiting first contact",
    },
    {
      label: "Converted",
      value: convertedLeads,
      icon: Target,
      color: "green",
      note: "Successfully converted",
    },
    {
      label: "Other leads",
      value: otherLeads,
      icon: Clock3,
      color: "orange",
      note: "Contacted, qualified or lost",
    },
    {
      label: "Conversion rate",
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "green",
      note: "Converted out of total leads",
    },
  ];

  return (
    <section className="stats-grid" aria-label="Lead statistics">
      {stats.map(({ label, value, icon: Icon, color, note }) => (
        <article className="stat-card" key={label}>
          <div className={`stat-icon ${color}`}>
            <Icon size={21} />
          </div>

          <p className="stat-label">{label}</p>
          <h2>{value}</h2>
          <p className="stat-note">{note}</p>
        </article>
      ))}
    </section>
  );
}