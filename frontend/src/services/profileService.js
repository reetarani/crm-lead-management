import api from "./api";

export const profileService = {
  getMyProfile: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  updateMyProfile: async (data) => {
    const response = await api.put("/users/me", data);
    return response.data;
  },

  changeMyPassword: async (data) => {
    const response = await api.patch("/users/me/password", data);
    return response.data;
  },
};