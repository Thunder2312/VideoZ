import axios from "axios";

const API_BASE = "http://localhost:5000/auth";

export const register = async (username: string, email: string, password: string) => {
  const res = await axios.post(`${API_BASE}/register`, { username, email, password });
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE}/login`, { email, password });
  return res.data; 
};
