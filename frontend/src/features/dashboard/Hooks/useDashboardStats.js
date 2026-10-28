
import { useMemo } from "react";

export default function useDashboardStats(leads = []) {
  return useMemo(() => {
    const totalLeads = leads.length;

    const newLeads = leads.filter(
      (lead) => lead.status === "New"
    ).length;

    const convertedLeads = leads.filter(
      (lead) => lead.status === "Converted"
    ).length;

    const otherLeads = leads.filter(
      (lead) =>
        !["New", "Converted"].includes(lead.status)
    ).length;

    const conversionRate =
      totalLeads > 0
        ? (convertedLeads / totalLeads) * 100
        : 0;

    return {
      totalLeads,
      newLeads,
      convertedLeads,
      otherLeads,
      conversionRate,
    };
  }, [leads]);
}
