import api from "./axios";

export const getWorkoutLogs = async (date) => {
  const res = await api.get(`/workout?date=${date}`);
  return res.data;
};

export const createWorkoutLog = async (workoutData) => {
  const res = await api.post("/workout", workoutData);
  return res.data;
};

export const deleteWorkoutLog = async (id) => {
  const res = await api.delete(`/workout/${id}`);
  return res.data;
};