import { Bot as TelegramBot } from "https://deno.land/x/grammy@v1.7.0/mod.ts";
import chalkin from "https://deno.land/x/chalkin@v0.1.3/mod.ts";
// import { limit } from "https://deno.land/x/grammy_ratelimiter@v1.1.4";

import Config from "./config.ts";
import Queue from "./queue.ts";
import Url from "./url.ts";
import MyroMessage, { MyroMessageLevel } from "./MyroMessage.ts";
import Downloader from "./downloader.ts";

import "../extensions/context.ts"; // custom Context functions for grammY

export default class Bot {
    static instance: TelegramBot;
    static init(token: string): Promise<TelegramBot> {
        return new Promise((resolve, reject) => {
            new MyroMessage({
                message: "Initializing bot...",
                level: MyroMessageLevel.INFO
            });
            try {
                this.instance = new TelegramBot(token);
                // this.instance.use(
                //   limit({
                //     window: 3000,
                //     limit: 1,
                //     onLimitExceeded: (ctx: any, _: any) =>
                //       ctx.reply("Rate limit exceeded"),
                //   }),
                // );
                this.setupEventHandlers();
                this.instance.start();
                // Deno.Process.once("SIGINT", () => this.instance.stop("SIGINT"));
                // process.once("SIGTERM", () => this.instance.stop("SIGTERM"));
                new MyroMessage({
                    message: "Bot initialized.",
                    level: MyroMessageLevel.INFO
                });
                resolve(this.instance);
            } catch (err) {
                new MyroMessage({
                    message: "Could not initialize bot.",
                    level: MyroMessageLevel.FATAL
                });
                reject(err);
            }
        });
    }
    static setupEventHandlers() {
        this.instance.on("message:text", async (ctx: any) => {
            let message_id = ctx.message?.message_id;
            for (let url of ctx.message.text.split("\n").map(Url.validate)) {
                if (url instanceof MyroMessage) {
                    ctx.reply(url.message);
                    continue;
                }

                let current = await Queue.add(url, ctx.message.from)
                    .then((song: any) => song)
                    .catch((err: any) => {
                        ctx.reply(err.message, {
                            reply_to_message_id: message_id
                        });
                        return err;
                    });

                let statusMsg = await ctx
                    .replyTo(`${current.fmt}\nInitializing...`)
                    .then((message: any) => message);

                ctx.editMessage(statusMsg, `${current.fmt}\nDownloading...`);

                Downloader.download(current)
                    .on(
                        "dlEvent",
                        (
                            event: any,
                            detail: { percent: number; currentSpeed: string }
                        ) => {
                            switch (event) {
                                case "progress":
                                    if (!detail.percent) return;
                                    let progressBar =
                                        "=".repeat(
                                            Math.floor(detail.percent / 4)
                                        ) +
                                        "-".repeat(
                                            Math.floor(
                                                (100 - detail.percent) / 4
                                            )
                                        );

                                    ctx.editMessage(
                                        statusMsg,
                                        `${current.fmt}\nDownloading at ${detail.currentSpeed}...\n${detail.percent}% \`[${progressBar}]\``
                                    );
                                    break;
                                case "audio":
                                    ctx.editMessage(
                                        statusMsg,
                                        `${current.fmt}\nConverting...`
                                    );
                                    break;
                                case "meta":
                                    ctx.editMessage(
                                        statusMsg,
                                        `${current.fmt}\nEmbedding metadata...`
                                    );
                                    break;
                                case "thumbConvert":
                                    ctx.editMessage(
                                        statusMsg,
                                        `${current.fmt}\nConverting thumbnail...`
                                    );
                                    break;
                                case "thumbEmbed":
                                    ctx.editMessage(
                                        statusMsg,
                                        `${current.fmt}\nEmbedding thumbnail...`
                                    );
                                    break;
                            }
                        }
                    )
                    .on("done", async (filePath: string) => {
                        // if (statSync(filePath).size > Config.sizeLimit) {
                        //     ctx.editMessage(
                        //         statusMsg,
                        //         `${
                        //             current.fmt
                        //         }\nUnforunately, the file is too large. Telegram bots may only send files up to ${
                        //             Config.sizeLimit / 1024 / 1024
                        //         } MB.`
                        //     );
                        //     Queue.remove(current);
                        //     return;
                        // }

                        console.log(
                            `${"[" + current.title + "]"} Sending to ${
                                ctx.message.from.username || ctx.message.from.id
                            }...`
                        );

                        ctx.editMessage(
                            statusMsg,
                            `${current.fmt}\nUploading...`
                        );

                        ctx.replyToWithAudio(
                            filePath,
                            `${current.artist} - ${current.title}.mp3`
                        )
                            .then((_: any) => {
                                ctx.deleteMessage(statusMsg.message_id);
                            })
                            .finally(() => {
                                // this should all run regardless of whether the upload was successful or not
                                Queue.remove(current);
                                console.log(
                                    `[${current.title}] Removing file from disk...`
                                );
                                Deno.remove(filePath).catch((err) => {
                                    console.error(err);
                                });
                            });
                    });
            }
        });
    }
}
