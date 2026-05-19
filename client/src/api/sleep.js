import api from "./axios";

export const getSleepLogs = async (dateOrStart, endDate) => {
  if (endDate) {
    const start = new Date(dateOrStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const res = await api.get(
      `/sleep?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
    );
    return res.data;
  }
  const res = await api.get(`/sleep?date=${dateOrStart}`);
  return res.data;
};

export const logSleep = async (date, sleepHoursActual) => {
  const res = await api.post("/sleep", {
    date,
    sleepHoursActual,
    sleepHoursGoal: 8,
  });
  return res.data;
};

export const updateSleepLog = async (id, updates) => {
  const res = await api.patch(`/sleep/${id}`, updates);
  return res.data;
};

export const deleteSleepLog = async (id) => {
  const res = await api.delete(`/sleep/${id}`);
  return res.data;
};