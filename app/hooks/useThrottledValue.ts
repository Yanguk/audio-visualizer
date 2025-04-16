import { useState, useEffect, useRef } from "react";

/**
 * A custom hook that throttles a value, only updating it after a specified delay has passed.
 * @param value The value to throttle
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The throttled value
 */
export function useThrottledValue<T>(value: T, delay = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();

    // Only update if the delay has passed since the last update
    if (now - lastUpdateRef.current >= delay) {
      setThrottledValue(value);
      lastUpdateRef.current = now;
    } else {
      // Schedule an update when the delay expires
      const timerId = setTimeout(
        () => {
          setThrottledValue(value);
          lastUpdateRef.current = Date.now();
        },
        delay - (now - lastUpdateRef.current),
      );

      return () => clearTimeout(timerId);
    }
  }, [value, delay]);

  return throttledValue;
}
