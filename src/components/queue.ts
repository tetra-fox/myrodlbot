import { User } from "https://deno.land/x/grammy@v1.7.0/platform.deno.ts";
// import YTDlpWrap from "https://esm.sh/yt-dlp-wrap";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

import Song from "../types/song.ts";

export default class Queue {
  static async add(url: URL, requester: User): Promise<Song> {
    return new Promise(async (resolve, reject) => {
      // let metadata = await new YTDlpWrap()
      //   .getMetadata(url)
      //   .then((info) => info)
      //   .catch((err) => {
      //     reject(err);
      //   });
      let metadata = {
        title: "test",
        uploader: "test",
        artist: "test",
      };
      let artist = metadata.uploader || metadata.artist || "Unknown";
      let title = metadata.title || "Unknown";
      // remove artist from title
      if (title.toLowerCase().startsWith(artist.toLowerCase() + " - ")) {
        title = title.substr(artist.length + 3); // +3 for " - "
      }
      let newSong: Song = {
        artist,
        title,
        url,
        id: nanoid(),
        fmt: `[${artist || "Unknown"} \\- ${title || "Unknown"}](${url.href})`,
        requester,
      };
      this.queue.push(newSong);
      resolve(newSong);
    });
  }
  static remove(songToRemove: Song) {
    this.queue = this.queue.filter((song) => song !== songToRemove);
  }
  static queue: Song[] = [];
}
