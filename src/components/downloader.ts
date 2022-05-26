import EventEmitter from "https://deno.land/x/events@v1.0.0/mod.ts";

import YtDlpWrapper from "../lib/ytdlpwrapper-deno.ts";

import Config from "./config.ts";
import Song from "../types/song.ts";
import MyroMessage, { MyroMessageLevel } from "./myromessage.ts";
import RateLimit from "./ratelimit.ts";

export default class Downloader {
	private static exists = async (filename: string): Promise<boolean> => {
		return await Deno.stat(filename)
			.then(() => true)
			.catch(() => false);
	};
	static getExecutable = async () => {
		new MyroMessage({
			message: `Checking for yt-dlp at ${Config.binPath}...`,
			level: MyroMessageLevel.INFO,
		});

		if (await this.exists(Config.ytDlpPath)) {
			new MyroMessage({
				message: "Found yt-dlp.",
				level: MyroMessageLevel.INFO,
			});
			return;
		}

		new MyroMessage({
			message: "yt-dlp not found.",
			level: MyroMessageLevel.WARN,
		});

		new MyroMessage({
			message: `Downloading yt-dlp to ${Config.binPath}...`,
			level: MyroMessageLevel.INFO,
		});

		if (!(await this.exists(Config.binPath))) {
			await Deno.mkdir(Config.binPath, { recursive: true });
		}

		await YtDlpWrapper.fetchBinary(Config.binPath);

		new MyroMessage({
			message: "Downloaded yt-dlp.",
			level: MyroMessageLevel.INFO,
		});
	};
	static download = (song: Song): Promise<EventEmitter> => {
		return new Promise(async (resolve, reject) => {
			console.log(`[${song.title}] Downloading...`);
			if (await this.exists(Config.tmpPath)) {
				await Deno.mkdir(Config.tmpPath, { recursive: true });
			}
			const events = new EventEmitter();
			new YtDlpWrapper(Config.ytDlpPath)
				.exec([
					song.url.href,
					"--extract-audio",
					"--audio-format=mp3",
					"--audio-quality=0",
					"--embed-thumbnail",
					"--add-metadata",
					"--concurrent-fragments=4",
					"-o",
					`${song.id}.%(ext)s`,
					"-P",
					Config.tmpPath,
				])
				.on("progress", (progress: any) => {
					RateLimit.handle(() => {
						events.emit("dlEvent", "progress", progress);
					});
				})
				.on("ytDlpEvent", (eventType: any, _: any) => {
					switch (eventType) {
						case "ExtractAudio":
							console.log(`[${song.title}] Extracting audio...`);
							events.emit("dlEvent", "audio");
							break;
						case "Metadata":
							console.log(
								`[${song.title}] Embedding metadata...`,
							);
							events.emit("dlEvent", "meta");
							break;
						case "ThumbnailsConverter":
							console.log(
								`[${song.title}] Converting thumbnail...`,
							);
							events.emit("dlEvent", "thumbConvert");
							break;
						case "EmbedThumbnail":
							console.log(
								`[${song.title}] Embedding thumbnail...`,
							);
							events.emit("dlEvent", "thumbEmbed");
							break;
					}
				})
				.on("error", (err: any) => events.emit("error", err))
				.on("close", () => {
					events.emit("done", Config.tmpPath + `/${song.id}.mp3`);
				});
			resolve(events);
		});
	};
}
