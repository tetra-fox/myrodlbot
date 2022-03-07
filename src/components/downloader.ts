// import YTDlpWrap from "https://esm.sh/yt-dlp-wrap";

import Config from "./config.ts";
import EventEmitter from "https://deno.land/x/events@v1.0.0/mod.ts";

import YTDlpWrap from "../lib/ytdlp-wrap-deno.ts";

import Song from "../types/song.ts";

export default class Downloader {
  private static exists = async (filename: string): Promise<boolean> => {
    return await Deno.stat(filename)
      .then(() => true)
      .catch(() => false);
  };
  static async getExecutable() {
    console.log("Checking for yt-dlp...");

    if (await this.exists(Config.ytDlpPath)) {
      console.log("Found yt-dlp.");
      return;
    }

    console.log("yt-dlp not found.");
    console.log("Downloading yt-dlp...");
    if (!(await this.exists(Config.binPath))) {
      await Deno.mkdir(Config.binPath, { recursive: true });
    }

    let releases = await YTDlpWrap.getGithubReleases(1, 5); // returns parsed JSON object as any type because i'm not writing typedefs for the github api

    await YTDlpWrap.downloadFromGithub(
      Config.binPath,
      releases[0].tag_name,
    );

    console.log("Downloaded yt-dlp.");
  }
  static download(song: Song): EventEmitter {
    console.log(`[${song.title}] Downloading...`);
    // if (!fs.existsSync(Config.tmpPath)) {
    //     fs.mkdirSync(Config.tmpPath);
    // }
    const events = new EventEmitter();
    // new YTDlpWrap()
    //   .exec([
    //     song.url.href,
    //     "--extract-audio",
    //     "--audio-format=mp3",
    //     "--audio-quality=0",
    //     "--embed-thumbnail",
    //     "--add-metadata",
    //     "--concurrent-fragments=4",
    //     "-o",
    //     `${song.id}.%(ext)s`,
    //     "-P",
    //     Config.tmpPath,
    //   ])
    //   .on("progress", (progress) => {
    //     // RateLimit.handle(() => {
    //     //     events.emit("dlEvent", "progress", progress)
    //     // });
    //   })
    //   .on("ytDlpEvent", (eventType, _) => {
    //     switch (eventType) {
    //       case "ExtractAudio":
    //         console.log(`[${song.title}] Extracting audio...`);
    //         events.emit("dlEvent", "audio");
    //         break;
    //       case "Metadata":
    //         console.log(`[${song.title}] Embedding metadata...`);
    //         events.emit("dlEvent", "meta");
    //         break;
    //       case "ThumbnailsConverter":
    //         console.log(`[${song.title}] Converting thumbnail...`);
    //         events.emit("dlEvent", "thumbConvert");
    //         break;
    //       case "EmbedThumbnail":
    //         console.log(`[${song.title}] Embedding thumbnail...`);
    //         events.emit("dlEvent", "thumbEmbed");
    //         break;
    //     }
    //   })
    //   .on("error", (err) => events.emit("error", err))
    //   .on("close", async () => {
    //     events.emit(
    //       "done",
    //       resolve(
    //         Config.tmpPath,
    //         `${song.id}.mp3`,
    //       ),
    //     );
    //   });
    return events;
  }
}
