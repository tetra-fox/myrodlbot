import { unlink, createReadStream, statSync } from "fs";

import { Telegraf } from "telegraf";
// import Chalk from "chalk";

import Url from "./components/url";
import Bot from "./components/bot";
import MyroError from "./components/myroerror";
import Downloader from "./components/downloader";

import config from "./components/config";
import Queue from "./components/queue";
import RateLimit from "./components/ratelimit";

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
        .then((bot) => {
            setupEventHandlers(bot);
        })
        .catch((err) => console.error(err));
})();

const setupEventHandlers = (bot: Telegraf) => {
    bot.on("text", async (ctx) => {
        for (let url of ctx.message.text.split("\n").map(Url.validate)) {
            if (url instanceof MyroError) {
                ctx.reply(url.message);
                continue;
            }

            let current = await Queue.add(url)
                .then((song) => song)
                .catch((err) => {
                    ctx.reply(err.message);
                    return err;
                });

            let statusMsg = await ctx
                .replyWithMarkdown(`${current.fmt}\nInitializing...`, {
                    disable_web_page_preview: true
                })
                .then((message) => message);

            let statusMsgOpt = {
                chat_id: ctx.chat.id,
                message_id: statusMsg.message_id,
                disable_web_page_preview: true
            };

            Downloader.download(current)
                .on("dlEvent", (event, detail) => {
                    RateLimit.handle(() => {
                        // bot.sendChatAction(msg.chat.id, "upload_document");
                    });
                    switch (event) {
                        case "progress":
                            if (!detail.percent) return;
                            let progressBar =
                                "=".repeat(Math.floor(detail.percent / 4)) +
                                "-".repeat(
                                    Math.floor((100 - detail.percent) / 4)
                                );
                            ctx.editMessageText(
                                `${current.fmt}\nDownloading at ${detail.currentSpeed}...\n${detail.percent}% \`[${progressBar}]\``,
                                statusMsgOpt
                            );
                            break;
                        case "audio":
                            // bot.editMessageText(
                            //     `${current.fmt}\nConverting...`,
                            //     statusMsgOpt
                            // );
                            break;
                        case "meta":
                            // bot.editMessageText(
                            //     `${current.fmt}\nEmbedding metadata...`,
                            //     statusMsgOpt
                            // );
                            break;
                        case "thumbConvert":
                            // bot.editMessageText(
                            //     `${current.fmt}\nConverting thumbnail...`,
                            //     statusMsgOpt
                            // );
                            break;
                        case "thumbEmbed":
                            // bot.editMessageText(
                            //     `${current.fmt}\nEmbedding thumbnail...`,
                            //     statusMsgOpt
                            // );
                            break;
                    }
                })
                .on("done", (filePath) => {
                    if (statSync(filePath).size > config.sizeLimit) {
                        // bot.editMessageText(
                        //     `${current.title} is too big. (file must be less than 50MB)`,
                        //     statusMsgOpt
                        // );
                        return;
                    }

                    console.log(
                        `${"[" + current.title + "]"} Sending to ${
                            ctx.message.from.username || ctx.message.from.id
                        }...`
                    );

                    ctx.editMessageText(
                        `${current.fmt}\nUploading...`,
                        statusMsgOpt
                    );

                    return;

                    // bot.sendChatAction(msg.chat.id, "upload_document");
                    // ctx.replyWithDocument(filePath).finally(() => {
                    //     // this should all run regardless of whether the upload was successful or not
                    //     Queue.remove(current);
                    //     bot.deleteMessage(
                    //         statusMsg.chat.id,
                    //         statusMsg.message_id.toString()
                    //     ); // the typedefs for this library are fucking horrible
                    //     console.log(
                    //         `${
                    //             "[" + current.title + "]"
                    //         } Removing file from disk...`
                    //     );
                    //     unlink(filePath, (err) => {
                    //         if (err) throw err;
                    //     });
                    // });
                });
        }
    });
};
