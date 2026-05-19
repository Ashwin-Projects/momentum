import api from "./axios";

export const getSummary = async (startDate, endDate) => {
  const res = await api.get(`/analytics/summary`, {
    params: { startDate, endDate },
  });
  return res.data;
};

export const getTrends = async (startDate, endDate) => {
  const res = await api.get(`/analytics/trends`, {
    params: { startDate, endDate },
  });
  return res.data;
};
