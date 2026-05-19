import api from "./axios";

export const getProfile = async () => {
  const res = await api.get("/profile");
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.patch("/profile", data);
  return res.data;
};

export const updatePassword = async (data) => {
  const res = await api.patch("/profile/password", data);
  return res.data;
};
