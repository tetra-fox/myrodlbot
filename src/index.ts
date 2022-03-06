import Bot from "./components/bot";
import MyroError from "./components/myroerror";
import Downloader from "./components/downloader";

import "./extensions/context"; // custom Context functions for Telegraf

// load environment variables from .env file
import "dotenv/config";

(async () => {
  if (!process.env.BOT_TOKEN_DEV) {
    throw new MyroError({
      message: "BOT_TOKEN was expected in the environment"
    });
  }

  await Downloader.getExecutable();

  Bot.init(process.env.BOT_TOKEN_DEV)
    .then((_) => {
      Bot.setupEventHandlers();
    })
    .catch((err) => console.error(err));
})();
