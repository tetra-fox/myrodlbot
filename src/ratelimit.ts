const timeout = 1000; // 1 second
let lastRequest = 0;

export default class RateLimit {
    /**
     * Prevents the provided function from running within the cooldown period.
     * @param fn Function to attempt to call
     */
    public static handle = (fn: Function) => {
        if (Date.now() - lastRequest > timeout) {
            lastRequest = Date.now();
            fn();
        }
    };
}
