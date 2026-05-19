import api from "./axios";

export const getMealLogs = async (date) => {
  const res = await api.get(`/nutrition?date=${date}`);
  return res.data;
};

export const createMealLog = async (mealData) => {
  const res = await api.post("/nutrition", mealData);
  return res.data;
};

export const deleteMealLog = async (id) => {
  const res = await api.delete(`/nutrition/${id}`);
  return res.data;
};