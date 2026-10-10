import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =========================
   AUTH
========================= */

export const login = async (payload) =>
  (await api.post("/auth/login", payload)).data;

export const register = async (payload) =>
  (await api.post("/auth/signup", payload)).data;


/* =========================
   ITEMS
========================= */

export const listItems = async (params = {}) =>
  (await api.get("/items", { params })).data;

export const getItem = async (id) =>
  (await api.get(`/items/${id}`)).data;

export const getMyItems = async () =>
  (await api.get("/my-items")).data;


/*
  IMPORTANT:
  This request sends FormData.

  Do NOT manually set:
  Content-Type: multipart/form-data

  The browser/Axios will automatically create:
  multipart/form-data; boundary=...
*/

export const createItem = async (formData) =>
  (
    await api.post("/items", formData, {
      headers: {
        "Content-Type": undefined,
      },
    })
  ).data;


export const updateItem = async (id, payload) =>
  (
    await api.patch(`/items/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).data;


export const deleteItem = async (id) =>
  (await api.delete(`/items/${id}`)).data;


/* =========================
   ITEM BOOKINGS
========================= */

export const getItemBookings = async (id) =>
  (await api.get(`/items/${id}/bookings`)).data;

export const getOwnerBookings = async () =>
  (await api.get("/owner-bookings")).data;


/* =========================
   BOOKINGS
========================= */

export const createBooking = async (payload) =>
  (await api.post("/bookings", payload)).data;

export const getBookings = async () =>
  (await api.get("/my-bookings")).data;

export const cancelBooking = async (id) =>
  (await api.patch(`/bookings/${id}/cancel`)).data;


/* =========================
   PAYMENTS
========================= */

export const createPaymentOrder = async (bookingId) =>
  (await api.post("/create-order", { bookingId })).data;

export const verifyPayment = async (payload) =>
  (await api.post("/verify-payment", payload)).data;


/* =========================
   AI
========================= */

export const askAI = async (messages) =>
  (await api.post("/ai/chat", { message: messages })).data;

export const getItemReviews = async (id) =>
  (await api.get(`/items/${id}/reviews`)).data;

export const createItemReview = async (id, payload) =>
  (await api.post(`/items/${id}/reviews`, payload)).data;

/* =========================
   BOOKING ROOM / HANDOFF
========================= */

export const getBookingRoom = async (id) =>
  (await api.get(`/bookings/${id}/room`)).data;

export const getBookingMessages = async (id) =>
  (await api.get(`/bookings/${id}/messages`)).data;

export const sendBookingMessage = async (id, message) =>
  (await api.post(`/bookings/${id}/messages`, { message })).data;

export const updateBookingHandoff = async (id, payload) =>
  (await api.patch(`/bookings/${id}/handoff`, payload)).data;

export const verifyBookingHandoff = async (id, code) =>
  (await api.post(`/bookings/${id}/handoff/verify`, { code })).data;
