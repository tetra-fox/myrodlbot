const timeout = 1000; // 1 second

export default class RateLimit {
    /**
     * Prevents the provided function from running within the cooldown period.
     * @param fn Function to attempt to call
     */
    private static lastRequest: number = 0;
    public static handle = (fn: Function) => {
        if (Date.now() - this.lastRequest > timeout) {
            this.lastRequest = Date.now();
            fn();
        }
    };
}
