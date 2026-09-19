export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

/** Simple in-memory memoizer keyed by JSON.stringify of the arguments. */
export function memoize<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const cache = new Map<string, R>();
  return (...args: A) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
