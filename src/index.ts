import Bot from "./components/bot.ts";
import MyroMessage, { MyroMessageLevel } from "./components/MyroMessage.ts";
import Downloader from "./components/downloader.ts";

// Load environment variables from .env file
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

let token = Deno.env.get("BOT_TOKEN_DEV");

if (!token) {
    new MyroMessage({
        message: "BOT_TOKEN was expected in the environment",
        level: MyroMessageLevel.FATAL
    });
}

await Downloader.getExecutable();

await Bot.init(token!).catch((err) => console.error(err));
