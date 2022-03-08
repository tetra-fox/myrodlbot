import chalkin from "https://deno.land/x/chalkin@v0.1.3/mod.ts";

import Config from "./config.ts";

export enum MyroMessageLevel {
	DEBUG,
	INFO,
	WARN,
	ERROR,
	FATAL,
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
		const fmt = `[MyroDlBot] ${this.message}`;
		switch (this.level) {
			case MyroMessageLevel.DEBUG:
				console.debug(chalkin.blueBright(fmt));
				break;
			case MyroMessageLevel.INFO:
				console.info(chalkin.white(fmt));
				break;
			case MyroMessageLevel.WARN:
				console.warn(chalkin.yellowBright(fmt));
				break;
			case MyroMessageLevel.ERROR:
				console.log(chalkin.red(fmt));
				break;
			case MyroMessageLevel.FATAL:
				console.error(chalkin.redBright(fmt));
				break;
		}
		// write to log file
		await Deno.writeTextFile(
			Config.logFile,
			`${new Date().toISOString()} ${fmt}\n`,
			{ append: true },
		);
	};
}
