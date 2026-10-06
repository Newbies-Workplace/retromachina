import axios from "axios";
import { installAuthInterceptors } from "@/api/auth-session";

export const axiosInstance = axios.create({
  baseURL: process.env.RETRO_WEB_API_URL,
  timeout: 5000,
});

installAuthInterceptors(axiosInstance);
