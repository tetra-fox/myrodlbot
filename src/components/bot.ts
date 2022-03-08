import { Bot as TelegramBot, Context } from "https://deno.land/x/grammy@v1.7.0/mod.ts";
import { run, RunnerHandle, sequentialize } from "https://deno.land/x/grammy_runner@v1.0.3/mod.ts";

import Config from "./config.ts";
import Queue from "./queue.ts";
import Url from "./url.ts";
import MyroMessage, { MyroMessageLevel } from "./MyroMessage.ts";
import Downloader from "./downloader.ts";

import "../extensions/context.ts"; // custom Context functions for grammY

export default class Bot {
	static instance: TelegramBot;
	static runner: RunnerHandle;
	static init(token: string): Promise<TelegramBot> {
		return new Promise((resolve, reject) => {
			new MyroMessage({
				message: "Initializing bot...",
				level: MyroMessageLevel.INFO,
			});
			try {
				this.instance = new TelegramBot(token);
				this.setupEventHandlers();
				this.setupSignalListeners();
				// @ts-ignore, it works fine
				this.instance.use(sequentialize((ctx: Context) => {
					const chat = ctx.chat?.id.toString();
					const user = ctx.from?.id.toString();
					return [chat, user].filter((con) => con !== undefined);
				}));
				this.runner = run(this.instance);

				new MyroMessage({
					message: "Bot initialized.",
					level: MyroMessageLevel.INFO,
				});
				resolve(this.instance);
			} catch (err) {
				new MyroMessage({
					message: "Could not initialize bot.",
					level: MyroMessageLevel.FATAL,
				});
				reject(err);
			}
		});
	}

	private static setupSignalListeners = () => {
		const stopRunner = () => {
			new MyroMessage({
				message: "Shutting down...",
				level: MyroMessageLevel.WARN,
			});
			if (this.runner.isRunning()) this.runner.stop();
			Deno.exit();
		};

		Deno.addSignalListener("SIGINT", stopRunner);
		Deno.addSignalListener("SIGTERM", stopRunner);
	};

	private static setupEventHandlers = (): void => {
		this.instance.on("message:text", async (ctx: Context) => {
			const message_id = ctx.message?.message_id;
			for (const url of ctx.message!.text!.split("\n").map(Url.validate)) {
				if (url instanceof MyroMessage) {
					ctx.reply(url.message);
					continue;
				}

				const current = await Queue.add(url, ctx.message!.from!)
					.then((song: any) => song)
					.catch((err: any) => {
						ctx.reply(err.message, {
							reply_to_message_id: message_id,
						});
						return err;
					});

				const statusMsg = await ctx
					.replyTo(`${current.fmt}\nInitializing...`)
					.then((message: any) => message);

				ctx.editMessage(statusMsg, `${current.fmt}\nDownloading...`);

				(await Downloader.download(current))
					.on(
						"dlEvent",
						(
							event: any,
							detail: { percent: number; currentSpeed: string },
						) => {
							switch (event) {
								case "progress":
									if (!detail.percent) return;
									const progressBar = "=".repeat(
										Math.floor(detail.percent / 4),
									) +
										"-".repeat(
											Math.floor(
												(100 - detail.percent) / 4,
											),
										);

									ctx.editMessage(
										statusMsg,
										`${current.fmt}\nDownloading at ${detail.currentSpeed}...\n${detail.percent}% \`[${progressBar}]\``,
									);
									break;
								case "audio":
									ctx.editMessage(
										statusMsg,
										`${current.fmt}\nConverting...`,
									);
									break;
								case "meta":
									ctx.editMessage(
										statusMsg,
										`${current.fmt}\nEmbedding metadata...`,
									);
									break;
								case "thumbConvert":
									ctx.editMessage(
										statusMsg,
										`${current.fmt}\nConverting thumbnail...`,
									);
									break;
								case "thumbEmbed":
									ctx.editMessage(
										statusMsg,
										`${current.fmt}\nEmbedding thumbnail...`,
									);
									break;
							}
						},
					)
					.on("done", async (filePath: string) => {
						if ((await Deno.stat(filePath)).size > Config.sizeLimit) {
							ctx.editMessage(
								statusMsg,
								`${current.fmt}\nFile size too large to send.\nUnfortunately, the Telegram API only allows bots to send files up to 50MB.`,
							);
							return;
						}
						console.log(
							`${"[" + current.title + "]"} Sending to ${
								ctx.message!.from!.username || ctx.message!.from!.id
							}...`,
						);

						ctx.editMessage(
							statusMsg,
							`${current.fmt}\nUploading...`,
						);

						ctx.replyToWithAudio(
							filePath,
							`${current.artist} - ${current.title}.mp3`,
						)
							.then((_: any) => {
								ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
							})
							.finally(() => {
								// this should all run regardless of whether the upload was successful or not
								Queue.remove(current);
								console.log(
									`[${current.title}] Removing file from disk...`,
								);
								Deno.remove(filePath).catch((err) => {
									console.error(err);
								});
							});
					});
			}
		});
	};
}
