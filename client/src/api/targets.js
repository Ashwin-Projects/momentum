import api from "./axios";

export const getTargets = async (date) => {
  const res = await api.get(`/targets?date=${date}`);
  return res.data;
};

export const createTarget = async (targetData) => {
  const res = await api.post("/targets", targetData);
  return res.data;
};

export const updateTarget = async (id, updates) => {
  const res = await api.patch(`/targets/${id}`, updates);
  return res.data;
};

export const deleteTarget = async (id) => {
  const res = await api.delete(`/targets/${id}`);
  return res.data;
};