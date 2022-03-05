import os from "os";
import fs from "fs";
import path from "path";

import YTDlpWrap from "yt-dlp-wrap";

import config from "./config";
import { EventEmitter } from "events";
import RateLimit from "./ratelimit";

export default class Downloader {
    static async getExecutable() {
        console.log("Checking for yt-dlp...");
        if (fs.existsSync(config.ytdlpPath)) {
            console.log("Found yt-dlp.");
            return;
        }

        console.log("yt-dlp not found.");
        console.log("Downloading yt-dlp...");
        if (!fs.existsSync(config.binPath)) {
            fs.mkdirSync(config.binPath);
        }

        let releases = await YTDlpWrap.getGithubReleases(1, 5);

        await YTDlpWrap.downloadFromGithub(
            config.ytdlpPath,
            releases[0].tag_name,
            os.platform()
        );
        console.log("Downloaded yt-dlp.");
    }
    static download(song: Song): EventEmitter {
        console.log(`[${song.title}] Downloading...`);
        if (!fs.existsSync(config.tmpPath)) {
            fs.mkdirSync(config.tmpPath);
        }
        let events = new EventEmitter();
        new YTDlpWrap()
            .exec([
                song.url.href,
                "--extract-audio",
                "--audio-format=mp3",
                "--audio-quality=0",
                "--embed-thumbnail",
                "--add-metadata",
                "--concurrent-fragments=4",
                "-o",
                `${song.artist} - ${song.title} [${song.id}].%(ext)s`,
                "-P",
                config.tmpPath
            ])
            .on("progress", (progress) => {
                RateLimit.handle(() => {
                    events.emit("dlEvent", "progress", progress)
                });
            })
            .on("ytDlpEvent", (eventType, _) => {
                switch (eventType) {
                    case "ExtractAudio":
                        console.log(`[${song.title}] Extracting audio...`);
                        events.emit("dlEvent", "audio");
                        break;
                    case "Metadata":
                        console.log(`[${song.title}] Embedding metadata...`);
                        events.emit("dlEvent", "meta");
                        break;
                    case "ThumbnailsConverter":
                        console.log(`[${song.title}] Converting thumbnail...`);
                        events.emit("dlEvent", "thumbConvert");
                        break;
                    case "EmbedThumbnail":
                        console.log(`[${song.title}] Embedding thumbnail...`);
                        events.emit("dlEvent", "thumbEmbed");
                        break;
                }
            })
            .on("error", (err) => events.emit("error", err))
            .on("close", async () => {
                events.emit(
                    "done",
                    path.resolve(
                        config.tmpPath,
                        `${song.artist} - ${song.title} [${song.id}].mp3`
                    )
                );
            });
        return events;
    }
}
