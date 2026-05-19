import api from "./axios";

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};

export const createNotification = async (data) => {
  const res = await api.post("/notifications", data);
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};
