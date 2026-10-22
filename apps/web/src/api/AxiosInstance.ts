import axios from "axios";
import { getAccessToken } from "./session-token";

const token = getAccessToken();

export const axiosInstance = axios.create({
  baseURL: process.env.RETRO_WEB_API_URL,
  timeout: 5000,
  withCredentials: true,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const sessionAxiosInstance = axios.create({
  baseURL: process.env.RETRO_WEB_API_URL,
  timeout: 5000,
  withCredentials: true,
});
