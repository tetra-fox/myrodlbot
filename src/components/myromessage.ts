import Config from "./config.ts";

export enum MyroMessageLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
    FATAL
}

interface MyroMessageInterface {
    message: string;
    level?: MyroMessageLevel;
}

export default class MyroMessage implements MyroMessageInterface {
    constructor(options: MyroMessageInterface) {
        this.message = options.message;
        this.level = options.level || MyroMessageLevel.ERROR;
        this.handle();
    }
    public message: string;
    public level?: MyroMessageLevel;
    private handle = (): void => {
        this.print();
        if (this.level === MyroMessageLevel.FATAL) {
            Deno.exit(1); // Something must've gone horribly wrong. We can't continue.
        }
    };
    private print = async (): Promise<void> => {
        let fmt = `[MyroDlBot] ${this.message}`;
        switch (this.level) {
            case MyroMessageLevel.DEBUG:
                // bright blue text
                console.debug(`\x1b[34m${fmt}\x1b[0m`);
                break;
            case MyroMessageLevel.INFO:
                // bright text
                console.info(`\x1b[1m${fmt}\x1b[0m`);
                break;
            case MyroMessageLevel.WARN:
                // bright yellow text
                console.warn(`\x1b[33m${fmt}\x1b[0m`);
                break;
            case MyroMessageLevel.ERROR:
                // red text
                console.error(`\x1b[31m${fmt}\x1b[0m`);
                break;
            case MyroMessageLevel.FATAL:
                // bright red text
                console.error(`\x1b[31m\x1b[1m${fmt}\x1b[0m`);
                break;
        }
        // write to log file
        await Deno.writeTextFile(Config.logFile, `${new Date().toISOString()} ${fmt}\n`, { append: true });
    };
}
