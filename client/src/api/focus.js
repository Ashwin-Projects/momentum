import api from "./axios";

export const getFocusSessions = async (date) => {
  const res = await api.get("/focus", { params: { date } });
  return res.data;
};

export const createFocusSession = async (sessionData) => {
  const res = await api.post("/focus", sessionData);
  return res.data;
};

export const deleteFocusSession = async (id) => {
  const res = await api.delete(`/focus/${id}`);
  return res.data;
};
