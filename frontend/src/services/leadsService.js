
import api from "./api";

export const leadsService = {
  // Get active leads
  getAll() {
    return api.get("/leads");
  },

  // Get single lead
  getById(id) {
    return api.get(`/leads/${id}`);
  },

  // Create lead
  create(leadData) {
    return api.post("/leads", leadData);
  },

  // Update lead
  update(id, leadData) {
    return api.put(`/leads/${id}`, leadData);
  },

  // Temporary delete - Move lead to Trash
  remove(id) {
    return api.delete(`/leads/${id}`);
  },

  // Get all Trash leads (Admin only)
  getTrash() {
    return api.get("/leads/trash");
  },

  // Restore lead from Trash (Admin only)
  restore(id) {
    return api.patch(`/leads/${id}/restore`);
  },

  // Permanently delete lead (Admin only)
  permanentlyDelete(id) {
    return api.delete(`/leads/${id}/permanent`);
  },
};
