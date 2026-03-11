import { useEffect } from "react";
import * as api from "../services/api.js";

export function useAutoLogin(user, setUser) {
  useEffect(() => {
    const token = localStorage.getItem("sigo_token");
    if (!token || user) return;

    api.me()
      .then((r) => {
        const saved = localStorage.getItem("sigo_user");
        if (saved) setUser(JSON.parse(saved));
        else if (r?.user) setUser(r.user);
      })
      .catch(() => {
        localStorage.removeItem("sigo_token");
        localStorage.removeItem("sigo_user");
      });
  }, [user, setUser]);
}
