import { useEffect, useState } from "react";

/**
 * Returns a debounced version of the value. The returned value updates
 * after the specified delay when the input value stops changing.
 * When value is empty, updates immediately (for clear button UX).
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
