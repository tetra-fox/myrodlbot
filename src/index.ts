import Bot from "./components/bot";
import MyroError from "./components/myroerror";
import Downloader from "./components/downloader";

// load environment variables from .env file
import "dotenv/config";

let token = process.env.BOT_TOKEN_DEV;

if (!token) {
    throw new MyroError({
        message: "BOT_TOKEN was expected in the environment"
    });
}

Downloader.getExecutable();

Bot.init(token).catch((err) => console.error(err));
