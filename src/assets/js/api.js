// Same-origin client for the PHP API. The session cookie rides along on every
// request; in development Vite proxies /api to the local php -S server.

function options(method, body) {
  return {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };
}

async function request(url, method, body) {
  const res = await fetch(url, options(method, body));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error || res.statusText), {
      status: res.status,
      code: data.error,
    });
  }
  return data;
}

// The API lives alongside the SPA, so it inherits the Vite base path: '/api' at
// the domain root, '/foot/api' when deployed under windwalk.de/foot/.
const API = `${import.meta.env.BASE_URL}api`;

export const api = {
  register: (email, password) =>
    request(`${API}/auth.php?action=register`, 'POST', { email, password }),
  login: (email, password) =>
    request(`${API}/auth.php?action=login`, 'POST', { email, password }),
  logout: () => request(`${API}/auth.php?action=logout`, 'POST'),
  me: () => request(`${API}/auth.php?action=me`, 'GET'),
  loadSave: () => request(`${API}/save.php`, 'GET'),
  putSave: (state) => request(`${API}/save.php`, 'PUT', { state }),
};
