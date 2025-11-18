const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function fetchProfile(token) {
  const res = await fetch(`${API}/api/profile/me`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProfile(data, token) {
  const res = await fetch(`${API}/api/profile/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadFile(file, path = "resume", token) {
  const form = new FormData();
  form.append("file", file);
  form.append("path", path);
  const res = await fetch(`${API}/api/uploads`, {
    method: "POST",
    body: form,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
