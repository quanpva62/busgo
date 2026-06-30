import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL;

// ────────────────────────────────────────────────────────────────
// KIẾN TRÚC AUTH MỚI (httpOnly cookie):
//
//   - accessToken: LƯU TRONG MEMORY (React state). KHÔNG localStorage.
//     → Mất khi đóng tab / F5. Khi cần lại sẽ /refresh từ cookie.
//     → XSS không đọc được vì không có trong storage.
//
//   - refreshToken: TRONG httpOnly COOKIE (do backend set).
//     → JS không đọc được (httpOnly).
//     → Browser tự gửi kèm mỗi request đến /api/auth/* (cookie path).
//     → KHÔNG có trong React state, KHÔNG có trong localStorage.
//
//   - user info: vẫn lưu localStorage để render UI ngay khi mount
//     (không phải security-sensitive, chỉ hiển thị tên/avatar).
//
//   - Mọi fetch tới backend cần SET cookie hoặc dùng cookie phải có:
//     credentials: "include"
//     (nếu không, browser bỏ cookie từ response và không gửi cookie request)
// ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  // accessToken chỉ trong memory — null sau F5, sẽ tự /refresh để recover
  const [token, setToken] = useState(null);

  const tokenRef = useRef(null);
  const refreshingRef = useRef(null); // tránh refresh song song nhiều lần
  const [bootstrapping, setBootstrapping] = useState(true); // chờ /refresh xong mới render
  tokenRef.current = token;

  // Gọi sau khi login thành công — chỉ cần userData + accessToken
  // refresh đã được backend set vào cookie tự động
  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    tokenRef.current = accessToken;
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    // Báo backend revoke refresh token (cookie sẽ được clear)
    fetch(`${API}/api/auth/logout`, {
      method: "POST",
      credentials: "include", // gửi cookie cho backend đọc
    }).catch(() => {
      // ignore — vẫn clear FE state dù BE call fail
    });
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    localStorage.removeItem("user");
  };

  // Gọi /refresh — cookie auto gửi → BE rotate → trả accessToken mới
  // Dùng refreshingRef để dedup: nếu nhiều request 401 cùng lúc, chỉ /refresh 1 lần
  async function refreshAccessToken() {
    if (refreshingRef.current) return refreshingRef.current;

    refreshingRef.current = (async () => {
      try {
        const res = await fetch(`${API}/api/auth/refresh-token`, {
          method: "POST",
          credentials: "include", // bắt buộc: gửi httpOnly cookie
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.accessToken) return null;
        setToken(data.accessToken);
        tokenRef.current = data.accessToken;
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshingRef.current = null;
      }
    })();
    return refreshingRef.current;
  }

  // Bootstrap khi app mount:
  //   - Nếu có user trong localStorage → cookie có thể vẫn còn (chưa expire)
  //     → /refresh để lấy accessToken mới, tránh user thấy login lại sau F5
  //   - Nếu /refresh fail → cookie đã expire/revoke → wipe user state
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!user) {
        setBootstrapping(false);
        return;
      }
      const newToken = await refreshAccessToken();
      if (cancelled) return;
      if (!newToken) {
        // Refresh fail → cookie không còn hợp lệ → logout state
        setUser(null);
        localStorage.removeItem("user");
      } else {
        // Đồng bộ user mới nhất từ server (có thể đã đổi profile từ device khác)
        try {
          const res = await authFetch(`${API}/api/auth/me`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem("user", JSON.stringify(data.user));
            }
          }
        } catch {
          // ignore
        }
      }
      setBootstrapping(false);
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper fetch tự attach Bearer token + auto refresh khi 401
  async function authFetch(url, options = {}) {
    const makeRequest = (accessToken) =>
      fetch(url, {
        ...options,
        credentials: "include", // gửi cookie nếu hit /api/auth/*
        headers: {
          ...(options.headers || {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

  // Tránh flash "chưa login" trong giây F5 đang /refresh
  if (bootstrapping && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
