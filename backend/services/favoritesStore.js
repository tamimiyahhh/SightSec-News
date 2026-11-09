const axios = require("axios");

const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw Object.assign(new Error("Supabase favorites are not configured on the server"), { status: 503 });
  }
  return {
    base: `${url.replace(/\/$/, "")}/rest/v1/favorites`,
    headers: (accessToken) => ({
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }),
  };
};

async function list(userId, accessToken) {
  const { base, headers } = supabase();
  const response = await axios.get(base, {
    headers: headers(accessToken),
    params: {
      select: "*",
      user_id: `eq.${userId}`,
      order: "created_at.desc",
    },
  });
  return response.data;
}

async function add(fav, userId, accessToken) {
  const { base, headers } = supabase();
  const response = await axios.post(
    base,
    { ...fav, user_id: userId },
    {
      headers: {
        ...headers(accessToken),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      params: { on_conflict: "user_id,url" },
    }
  );
  return response.data[0];
}

async function remove(id, userId, accessToken) {
  const { base, headers } = supabase();
  await axios.delete(base, {
    headers: headers(accessToken),
    params: {
      id: `eq.${id}`,
      user_id: `eq.${userId}`,
    },
  });
}

module.exports = { list, add, remove };
