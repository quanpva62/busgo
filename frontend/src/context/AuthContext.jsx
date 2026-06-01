import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken"),
  );

  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(refreshToken);
  const refreshingRef = useRef(null);
  tokenRef.current = token;
  refreshTokenRef.current = refreshToken;

  const login = (userData, accessToken, refreshTokenValue) => {
    setUser(userData);
    setToken(accessToken);
    setRefreshToken(refreshTokenValue);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    if (refreshTokenValue) {
      localStorage.setItem("refreshToken", refreshTokenValue);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
  };

  async function refreshAccessToken() {
    if (refreshingRef.current) return refreshingRef.current;
    const rt = refreshTokenRef.current;
    if (!rt) return null;

    refreshingRef.current = (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh-token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
          },
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.accessToken) return null;
        setToken(data.accessToken);
        tokenRef.current = data.accessToken;
        localStorage.setItem("token", data.accessToken);
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshingRef.current = null;
      }
    })();
    return refreshingRef.current;
  }

  // Validate token khi load app — nếu token invalid → authFetch tự logout()
  // Nếu valid → đồng bộ user từ server (source of truth, có thể đổi fullName/phone từ device khác)
  useEffect(() => {
    if (!tokenRef.current) return;
    async function validate() {
      try {
        const res = await authFetch(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
        );
        if (!res.ok) return; // authFetch đã logout nếu 401
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch {
        // ignore — network error
      }
    }
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authFetch(url, options = {}) {
    const makeRequest = (accessToken) =>
      fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken}`,
        },
      });

    let res = await makeRequest(tokenRef.current);
    if (res.status === 401 || res.status === 403) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        logout();
        return res;
      }
      res = await makeRequest(newToken);
    }
    return res;
  }

  function updateUser(newUser) {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        authFetch,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
//eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
