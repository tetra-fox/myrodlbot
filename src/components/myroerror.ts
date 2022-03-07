export enum MyroErrorLevel {
    INFO = "INFO",
    DEBUG = "DEBUG",
    WARNING = "WARNING",
    ERROR = "ERROR",
    FATAL = "FATAL"
}

interface MyroErrorInterface {
    message: string;
    level?: MyroErrorLevel;
}

export default class MyroError implements MyroErrorInterface {
    constructor(options: MyroErrorInterface) {
        this.message = options.message;
        this.level = options.level || MyroErrorLevel.ERROR;
        this.handle();
    }
    public message: string;
    public level?: MyroErrorLevel;
    private handle = (): void => {
        this.print();
        if (this.level === MyroErrorLevel.FATAL) {
            Deno.exit(1);
        }
    };
    private print = (): void => {
        switch (this.level) {
            case MyroErrorLevel.INFO:
                // bright text
                console.info(`\x1b[1m[MyroError] ${this.message}\x1b[0m`);
                break;
            case MyroErrorLevel.DEBUG:
                // bright blue text
                console.debug(`\x1b[34m[MyroError] ${this.message}\x1b[0m`);
                break;
            case MyroErrorLevel.WARNING:
                // bright yellow text
                console.warn(`\x1b[33m[MyroError] ${this.message}\x1b[0m`);
                break;
            case MyroErrorLevel.ERROR:
                // red text
                console.error(`\x1b[31m[MyroError] ${this.message}\x1b[0m`);
                break;
            case MyroErrorLevel.FATAL:
                // bright red text
                console.error(`\x1b[31m\x1b[1m[MyroError] ${this.message}\x1b[0m`);
                break;
        }
    };
}
