import Bot from "./components/bot.ts";
import MyroMessage, { MyroMessageLevel } from "./components/myromessage.ts";
import Downloader from "./components/downloader.ts";

// Load environment variables from .env file
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

const token = Deno.env.get("BOT_TOKEN_DEV");

if (!token) {
	new MyroMessage({
		message: "BOT_TOKEN was expected in the environment",
		level: MyroMessageLevel.FATAL,
	});
}

// Check for ffmpeg
try {
	new MyroMessage({
		message: "Checking for ffmpeg...",
		level: MyroMessageLevel.INFO,
	});
	Deno.run({
		cmd: ["ffmpeg"],
		stdout: "null",
		stderr: "null",
	});
	new MyroMessage({
		message: "Found ffmpeg.",
		level: MyroMessageLevel.INFO,
	});
} catch {
	new MyroMessage({
		message: "ffmpeg not found. Please install ffmpeg and ensure it is in your PATH.",
		level: MyroMessageLevel.FATAL,
	});
}

await Downloader.getExecutable();

await Bot.init(token!).catch((err) => console.error(err));
