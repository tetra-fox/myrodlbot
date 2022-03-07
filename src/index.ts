import Bot from "./components/bot.ts";
import MyroError from "./components/myroerror.ts";
import Downloader from "./components/downloader.ts";

// load environment variables from .env file
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

let token = Deno.env.get("BOT_TOKEN_DEV");

if (!token) {
  throw new MyroError({
    message: "BOT_TOKEN was expected in the environment",
  });
}

await Downloader.getExecutable();

await Bot.init(token).catch((err) => console.error(err));
