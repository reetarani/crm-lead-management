
import api from "./api";

export const leadsService = {
  getAll() {
    return api.get("/leads");
  },

  getById(id) {
    return api.get(`/leads/${id}`);
  },

  create(leadData) {
    return api.post("/leads", leadData);
  },

  update(id, leadData) {
    return api.put(`/leads/${id}`, leadData);
  },

  remove(id) {
    return api.delete(`/leads/${id}`);
  },
};
