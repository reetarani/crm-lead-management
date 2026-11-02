
import api from "./api";

export const passwordResetService = {
  forgotPassword: async (email) => {
    const response = await api.post("/password-reset/forgot", {
      email,
    });

    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.post(
      `/password-reset/reset/${encodeURIComponent(token)}`,
      { password }
    );

    return response.data;
  },
};
