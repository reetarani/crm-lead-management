
import { useCallback, useState } from "react";
import { leadsService } from "../../../services/leadsService";

export default function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await leadsService.getAll();
      const leadData = response.data.data;

      setLeads(Array.isArray(leadData) ? leadData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load leads. Please try again."
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    leads,
    loading,
    error,
    fetchLeads,
  };
}
