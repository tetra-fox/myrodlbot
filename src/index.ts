import { unlink, createReadStream, statSync } from "fs";

import TelegramBot, { Message, ParseMode } from "node-telegram-bot-api";

import Url from "./url";
import Bot from "./bot";
import MyroError from "./myroerror";
import Downloader from "./downloader";

import config from "./config";
import Queue from "./queue";
import RateLimit from "./ratelimit";

// load environment variables from .env file
import "dotenv/config";

(async () => {
    if (!process.env.BOT_TOKEN) {
        throw new MyroError({
            message: "BOT_TOKEN was expected in the environment"
        });
    }

    await Downloader.getExecutable();

    Bot.init(process.env.BOT_TOKEN)
        .then((bot) => setupEventHandlers(bot))
        .catch((err) => console.error(err));
})();

const setupEventHandlers = (bot: TelegramBot) => {
    bot.on("message", async (msg: Message) => {
        if (!msg.text) {
            return;
        }

        for (let url of msg.text.split("\n").map(Url.validate)) {
            if (url instanceof MyroError) {
                bot.sendMessage(msg.chat.id, url.message, {
                    reply_to_message_id: msg.message_id
                });
                continue;
            }

            let current = await Queue.add(url)
                .then((song) => song)
                .catch((err) => {
                    bot.sendMessage(msg.chat.id, err.message, {
                        reply_to_message_id: msg.message_id
                    });
                    return err;
                });

            let statusMsg = await bot
                .sendMessage(msg.chat.id, `${current.fmt}\nInitializing...`, {
                    reply_to_message_id: msg.message_id,
                    disable_web_page_preview: true,
                    parse_mode: "Markdown" as ParseMode
                })
                .then((message) => message);

            let statusMsgOpt = {
                chat_id: msg.chat.id,
                message_id: statusMsg.message_id,
                disable_web_page_preview: true,
                parse_mode: "Markdown" as ParseMode
            };

            Downloader.download(current)
                .on("dlEvent", (event, detail) => {
                    RateLimit.handle(() => {
                        bot.sendChatAction(msg.chat.id, "upload_document");
                    });
                    switch (event) {
                        case "progress":
                            // if (!detail.percent) {
                            //     break;
                            // }
                            let progressBar =
                                "=".repeat(
                                    Math.floor((detail.percent as number) / 4)
                                ) +
                                "-".repeat(
                                    Math.floor(
                                        ((100 - detail.percent) as number) / 4
                                    )
                                );
                            bot.editMessageText(
                                `${current.fmt}\nDownloading at ${detail.currentSpeed}...\n${detail.percent}% [${progressBar}]`,
                                statusMsgOpt
                            );
                            break;
                        case "audio":
                            bot.editMessageText(
                                `${current.fmt}\nConverting...`,
                                statusMsgOpt
                            );
                            break;
                        case "meta":
                            bot.editMessageText(
                                `${current.fmt}\nEmbedding metadata...`,
                                statusMsgOpt
                            );
                            break;
                        case "thumbConvert":
                            bot.editMessageText(
                                `${current.fmt}\nConverting thumbnail...`,
                                statusMsgOpt
                            );
                            break;
                        case "thumbEmbed":
                            bot.editMessageText(
                                `${current.fmt}\nEmbedding thumbnail...`,
                                statusMsgOpt
                            );
                            break;
                    }
                })
                .on("done", (filePath) => {
                    if (statSync(filePath).size > config.sizeLimit) {
                        bot.editMessageText(
                            `${current.title} is too big. (file must be less than 50MB)`,
                            statusMsgOpt
                        );
                        return;
                    }

                    console.log(
                        `[${current.title}] Sending to ${
                            msg.chat.username || msg.chat.id
                        }...`
                    );

                    bot.editMessageText(
                        `${current.fmt}\nUploading...`,
                        statusMsgOpt
                    );

                    bot.sendChatAction(msg.chat.id, "upload_document");
                    bot.sendDocument(msg.chat.id, createReadStream(filePath), {
                        reply_to_message_id: msg.message_id
                    }).finally(() => {
                        // this should all run regardless of whether the upload was successful or not
                        Queue.remove(current);
                        bot.deleteMessage(
                            statusMsg.chat.id,
                            statusMsg.message_id.toString()
                        ); // the typedefs for this library are fucking horrible
                        console.log(
                            `[${current.title}] Removing file from disk...`
                        );
                        unlink(filePath, (err) => {
                            if (err) throw err;
                        });
                    });
                });
        }
    });
};
