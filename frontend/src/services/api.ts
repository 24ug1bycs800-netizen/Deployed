import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR FOR ACCESS TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinecircle_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// MOCK PAYMENTS SYSTEM
export const simulatePayment = async (orderId: string, amount: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        razorpayOrderId: orderId,
        razorpayPaymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
      });
    }, 1500);
  });
};

export default api;
