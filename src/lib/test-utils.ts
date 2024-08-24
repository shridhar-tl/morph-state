export function until(delay = 0) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}