const axios = require("axios");

module.exports = async function requireAuth(req, res, next) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: "Supabase auth is not configured on the server" });
  }

  const match = /^Bearer\s+(.+)$/i.exec(req.get("authorization") || "");
  if (!match) {
    return res.status(401).json({ error: "Log in to access favorites" });
  }

  try {
    const response = await axios.get(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${match[1]}`,
        },
        timeout: 10000,
      }
    );
    req.auth = { userId: response.data.id, accessToken: match[1] };
    next();
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Your session is invalid or expired. Please log in again." });
    }
    next(error);
  }
};
