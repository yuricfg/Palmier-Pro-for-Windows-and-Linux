import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/** useState backed by localStorage (JSON). Survives reloads / sessions. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota/serialization errors */
    }
  }, [key, value]);

  return [value, setValue];
}
