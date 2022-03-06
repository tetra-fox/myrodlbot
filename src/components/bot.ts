import { Telegraf } from "telegraf";
import { unlink, createReadStream, statSync } from "fs";
import config from "./config";
import Queue from "./queue";
import Url from "./url";
import MyroError from "./myroerror";
import Downloader from "./downloader";

export default class Bot {
  static instance: Telegraf;
  static init(token: string): Promise<Telegraf> {
    return new Promise((resolve, reject) => {
      console.log("Initializing bot...");
      try {
        const bot = new Telegraf(token);
        bot.launch();
        process.once("SIGINT", () => bot.stop("SIGINT"));
        process.once("SIGTERM", () => bot.stop("SIGTERM"));
        console.log("Bot initialized.");
        this.instance = bot;
        resolve(bot);
      } catch (err) {
        reject(err);
      }
    });
  }
  static setupEventHandlers() {
    this.instance.on("text", async (ctx) => {
      let message_id = ctx.message?.message_id;
      for (let url of ctx.message.text.split("\n").map(Url.validate)) {
        if (url instanceof MyroError) {
          ctx.reply(url.message);
          continue;
        }

        let current = await Queue.add(url, ctx.message.from)
          .then((song) => song)
          .catch((err) => {
            ctx.reply(err.message, {
              reply_to_message_id: message_id
            });
            return err;
          });

        let statusMsg = await ctx
          .replyTo(`${current.fmt}\nInitializing...`)
          .then((message) => message);

        ctx.editMessage(statusMsg, `${current.fmt}\nDownloading...`);

        Downloader.download(current)
          .on("dlEvent", (event, detail) => {
            switch (event) {
              case "progress":
                if (!detail.percent) return;
                let progressBar =
                  "=".repeat(Math.floor(detail.percent / 4)) +
                  "-".repeat(Math.floor((100 - detail.percent) / 4));

                ctx.editMessage(
                  statusMsg,
                  `${current.fmt}\nDownloading at ${detail.currentSpeed}...\n${detail.percent}% \`[${progressBar}]\``
                );
                break;
              case "audio":
                ctx.editMessage(statusMsg, `${current.fmt}\nConverting...`);
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
          })
          .on("done", (filePath) => {
            if (statSync(filePath).size > config.sizeLimit) {
              ctx.editMessage(
                statusMsg,
                `${
                  current.fmt
                }\nUnforunately, the file is too large. Telegram bots may only send files up to ${
                  config.sizeLimit / 1024 / 1024
                } MB.`
              );
              Queue.remove(current);
              return;
            }

            console.log(
              `${"[" + current.title + "]"} Sending to ${
                ctx.message.from.username || ctx.message.from.id
              }...`
            );

            ctx.editMessage(statusMsg, `${current.fmt}\nUploading...`);

            ctx
              .replyToWithAudio(
                createReadStream(filePath),
                `${current.artist} - ${current.title}.mp3`
              )
              .then((_) => {
                ctx.deleteMessage(statusMsg.message_id);
              })
              .finally(() => {
                // this should all run regardless of whether the upload was successful or not
                Queue.remove(current);
                console.log(
                  `${"[" + current.title + "]"} Removing file from disk...`
                );
                unlink(filePath, (err) => {
                  if (err) throw err;
                });
              });
          });
      }
    });
  }
}
