import api from "./axios";

export const getStudySessions = async (date) => {
  const res = await api.get(`/study?date=${date}`);
  return res.data;
};

export const createStudySession = async (sessionData) => {
  const res = await api.post("/study", sessionData);
  return res.data;
};

export const deleteStudySession = async (id) => {
  const res = await api.delete(`/study/${id}`);
  return res.data;
};