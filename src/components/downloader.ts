// import YTDlpWrap from "yt-dlp-wrap";
import {exists} from "https://deno.land/std@0.128.0/fs/mod.ts";

import Config from "./config.ts";
import { EventEmitter } from "https://deno.land/x/eventemitter@1.2.1/mod.ts";

export default class Downloader {
    static async getExecutable() {
        console.log("Checking for yt-dlp...");
        if (Deno.exists(Config.ytdlpPath)) {
            console.log("Found yt-dlp.");
            return;
        }

        console.log("yt-dlp not found.");
        console.log("Downloading yt-dlp...");
        if (!fs.existsSync(Config.binPath)) {
            fs.mkdirSync(Config.binPath);
        }

        // let releases = await YTDlpWrap.getGithubReleases(1, 5);

        // await YTDlpWrap.downloadFromGithub(
        //     Config.ytdlpPath,
        //     releases[0].tag_name,
        //     os.platform()
        // );
        console.log("Downloaded yt-dlp.");
    }
    static download(song: Song): EventEmitter {
        console.log(`[${song.title}] Downloading...`);
        if (!fs.existsSync(Config.tmpPath)) {
            fs.mkdirSync(Config.tmpPath);
        }
        let events = new EventEmitter();
        // new YTDlpWrap()
        //     .exec([
        //         song.url.href,
        //         "--extract-audio",
        //         "--audio-format=mp3",
        //         "--audio-quality=0",
        //         "--embed-thumbnail",
        //         "--add-metadata",
        //         "--concurrent-fragments=4",
        //         "-o",
        //         `${song.id}.%(ext)s`,
        //         "-P",
        //         Config.tmpPath
        //     ])
        //     .on("progress", (progress) => {
        //         RateLimit.handle(() => {
        //             events.emit("dlEvent", "progress", progress)
        //         });
        //     })
        //     .on("ytDlpEvent", (eventType, _) => {
        //         switch (eventType) {
        //             case "ExtractAudio":
        //                 console.log(`[${song.title}] Extracting audio...`);
        //                 events.emit("dlEvent", "audio");
        //                 break;
        //             case "Metadata":
        //                 console.log(`[${song.title}] Embedding metadata...`);
        //                 events.emit("dlEvent", "meta");
        //                 break;
        //             case "ThumbnailsConverter":
        //                 console.log(`[${song.title}] Converting thumbnail...`);
        //                 events.emit("dlEvent", "thumbConvert");
        //                 break;
        //             case "EmbedThumbnail":
        //                 console.log(`[${song.title}] Embedding thumbnail...`);
        //                 events.emit("dlEvent", "thumbEmbed");
        //                 break;
        //         }
        //     })
        //     .on("error", (err) => events.emit("error", err))
        //     .on("close", async () => {
        //         events.emit(
        //             "done",
        //             path.resolve(
        //                 Config.tmpPath,
        //                 `${song.id}.mp3`
        //             )
        //         );
        //     });
        return events;
    }
}
