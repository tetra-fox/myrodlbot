import TelegramBot from "node-telegram-bot-api";

export default class Bot {
    static init(token: string): Promise<TelegramBot> {
        return new Promise((resolve, reject) => {
            console.log("Initializing bot...");
            try {
                const bot = new TelegramBot(token, { polling: true });
                console.log("Bot initialized.");
                resolve(bot);
            } catch (err) {
                reject(err);
            }
        });
    }
}
