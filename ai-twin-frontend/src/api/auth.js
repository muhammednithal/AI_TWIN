import API from "./axios";

export const signup = (email, password) =>
  API.post("/auth/signup", { email, password });

export const login = (email, password) =>
  API.post("/auth/login", { email, password });
