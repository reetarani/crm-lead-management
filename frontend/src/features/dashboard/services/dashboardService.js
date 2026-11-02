import api from "../../../services/api";

const dashboardService = {
  getStats: async () => {
    const response = await api.get("/leads/dashboard-stats");
    return response.data;
  },
};

export default dashboardService;