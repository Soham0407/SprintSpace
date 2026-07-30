/**
 * Every function in src/api/ is written as if it were hitting a real
 * backend — async, wrapped in a simulated delay, one function per entity.
 * This file is the ONLY thing that should change when a real backend
 * exists: replace the body of each mock function with a real `fetch()`
 * call. No page or component needs to change.
 */
export function mockDelay<T>(data: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
