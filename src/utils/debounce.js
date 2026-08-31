/**
 * Standard debounce: returns a wrapped version of `fn` that only runs after
 * `delay` ms have passed since the last time the wrapper was called. Each
 * call resets the timer, so `fn` fires once, using the arguments from the
 * final call in a burst.
 * @param {Function} fn
 * @param {number} delay - Milliseconds to wait after the last call.
 * @returns {Function & { cancel: () => void }} The debounced function, plus
 *   `.cancel()` to drop any pending invocation (e.g. on component unmount).
 */
export function debounce(fn, delay) {
  let timer = null

  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }

  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }

  return debounced
}
