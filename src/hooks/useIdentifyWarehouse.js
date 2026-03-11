import { useEffect, useRef, useState } from "react";
import * as api from "../services/api.js";

export function useIdentifyWarehouse(nama) {
  const [warehouse, setWarehouse] = useState(null);
  const [checking, setChecking] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!nama?.trim()) {
      setWarehouse(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        const res = await api.identifyUser(nama.trim());
        setWarehouse(res?.found ? res.warehouse : null);
      } catch {
        setWarehouse(null);
      } finally {
        setChecking(false);
      }
    }, 250);

    return () => clearTimeout(timer.current);
  }, [nama]);

  return { warehouse, checking };
}
