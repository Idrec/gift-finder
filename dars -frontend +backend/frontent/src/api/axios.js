import axios from "axios";

// Content-Type'ni axios o'zi qo'yadi: JSON uchun application/json,
// FormData (rasm yuklash) uchun multipart/form-data.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/",
});

export default api;
