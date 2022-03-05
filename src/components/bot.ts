import { Telegraf } from "telegraf";

export default class Bot {
    static init(token: string): Promise<Telegraf> {
        return new Promise((resolve, reject) => {
            console.log("Initializing bot...");
            try {
                const bot = new Telegraf(token);
                bot.launch()
                process.once("SIGINT", () => bot.stop("SIGINT"));
                process.once("SIGTERM", () => bot.stop("SIGTERM"));
                console.log("Bot initialized.");
                resolve(bot);
            } catch (err) {
                reject(err);
            }
        });
    }
}
