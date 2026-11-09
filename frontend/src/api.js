import axios from "axios";
import { supabase } from "./supabase.js";

// Empty base = same origin (Vite proxy in dev). Set VITE_API_URL when deployed.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "" });

export const fetchNews = (params) => api.get("/api/news", { params }).then((r) => r.data);
const authenticatedRequest = async (request) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Please log in to access your favorites.");
  return request(data.session.access_token);
};

export const fetchFavorites = () =>
  authenticatedRequest((token) =>
    api.get("/api/favorites", { headers: { Authorization: `Bearer ${token}` } })
  ).then((r) => r.data);
export const addFavorite = (article) =>
  authenticatedRequest((token) =>
    api.post(
      "/api/favorites",
      {
        title: article.title,
        url: article.url,
        source: article.source,
        image: article.image,
        published_at: article.publishedAt,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  ).then((r) => r.data);
export const removeFavorite = (id) =>
  authenticatedRequest((token) =>
    api.delete(`/api/favorites/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  );

export const errorMessage = (err) =>
  (err.response && err.response.data && err.response.data.error) || err.message;
