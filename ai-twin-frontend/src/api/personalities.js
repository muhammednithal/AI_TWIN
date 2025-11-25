import API from "./axios";

export const createPersonality = (payload) =>
  API.post("/api/personalities", payload);

export const listPersonalities = () => API.get("/api/personalities");

export const getPersonality = (id) => API.get(`/api/personalities/${id}`);
