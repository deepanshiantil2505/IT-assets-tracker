import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expires or is invalid, bounce back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "EMPLOYEE";
}

export interface Asset {
  id: number;
  assetTag: string;
  name: string;
  category: string;
  serialNumber?: string;
  status: "IN_USE" | "IN_STORAGE" | "IN_REPAIR" | "RETIRED";
  purchaseDate?: string;
  owner?: User | null;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requester: User;
  assignee?: User | null;
  asset?: Asset | null;
  createdAt: string;
}
