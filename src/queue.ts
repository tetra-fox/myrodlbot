import YTDlpWrap from "yt-dlp-wrap";

import { nanoid } from "nanoid";

let current_queue: Song[] = [];

export default class Queue {
    static async add(url: URL): Promise<Song> {
        return new Promise(async (resolve, reject) => {
            let metadata = await new YTDlpWrap()
                .getVideoInfo(url.href)
                .then((info) => info)
                .catch((err) => {
                    reject(err);
                });
            let newSong: Song = {
                artist: metadata.uploader || "Unknown",
                title: metadata.title || "Unknown",
                url,
                id: nanoid(),
                fmt: `[${metadata.uploader || "Unknown"} - ${metadata.title || "Unknown"}](${url.href})`,
            };
            current_queue.push(newSong);
            resolve(newSong);
        });
    }
    static remove(songToRemove: Song) {
        current_queue = current_queue.filter((song) => song !== songToRemove);
    }
    static queue = current_queue;
}
