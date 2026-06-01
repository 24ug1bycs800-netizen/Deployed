import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // ✅ FIXED

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cinecircle_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// mock payment
export const simulatePayment = (orderId: string, amount: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: "success",
        razorpayOrderId: orderId,
        razorpayPaymentId:
          "pay_" + Math.random().toString(36).substring(2, 10),
      });
    }, 1000);
  });
};

export default api;