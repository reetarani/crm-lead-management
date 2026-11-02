
import { useCallback, useEffect, useState } from "react";
import followUpsService from "../services/followUpsService";

export default function useFollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [dashboard, setDashboard] = useState({
    today: [],
    upcoming: [],
    overdue: [],
    counts: {
      today: 0,
      upcoming: 0,
      overdue: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [listResponse, dashboardResponse] = await Promise.all([
        followUpsService.getAll(),
        followUpsService.getDashboard(),
      ]);

      setFollowUps(listResponse.data || []);
      setDashboard(dashboardResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load follow-ups"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps().catch(() => {});
  }, [fetchFollowUps]);

  return {
    followUps,
    dashboard,
    loading,
    error,
    fetchFollowUps,
  };
}
