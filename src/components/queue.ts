import YTDlpWrap from "yt-dlp-wrap";
import { nanoid } from "nanoid";
import { User } from "typegram";

export default class Queue {
    static async add(url: URL, requester: User): Promise<Song> {
        return new Promise(async (resolve, reject) => {
            let metadata = await new YTDlpWrap()
                .getVideoInfo(url.href)
                .then((info) => info)
                .catch((err) => {
                    reject(err);
                });
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
                fmt: `[${artist || "Unknown"} \\- ${title || "Unknown"}](${
                    url.href
                })`,
                requester
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
