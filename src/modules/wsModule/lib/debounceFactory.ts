export const debounceFactory = (delay) => {
    let timeout;
    let debounceLocked = false;
    let nextFn = null;

    return (fn) => {
        if (debounceLocked) {
            nextFn = fn;
        } else {
            debounceLocked = true;
            fn();

            if (timeout) {
                clearTimeout(timeout)
            }

            timeout = setTimeout(() => {
                if (nextFn) {
                    nextFn();
                }
                debounceLocked = false;
            }, delay);
        }
    }
}
