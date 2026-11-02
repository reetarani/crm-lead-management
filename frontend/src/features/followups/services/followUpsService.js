
import api from "../../../services/api";

const followUpsService = {
  getAll: async (params = {}) => {
    const response = await api.get("/follow-ups", { params });
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get("/follow-ups/dashboard");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/follow-ups/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/follow-ups", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/follow-ups/${id}`, data);
    return response.data;
  },

  complete: async (id) => {
    const response = await api.patch(`/follow-ups/${id}/complete`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.patch(`/follow-ups/${id}/cancel`);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/follow-ups/${id}`);
    return response.data;
  },
};

export default followUpsService;
