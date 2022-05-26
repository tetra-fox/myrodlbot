import { User } from "https://deno.land/x/grammy@v1.7.0/platform.deno.ts";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import YtDlpWrapper from "../lib/ytdlpwrapper-deno.ts";

import Song from "../types/song.ts";

export default class Queue {
	static queue: Song[] = [];
	static add = (url: URL, requester: User): Promise<Song> => {
		return new Promise(async (resolve, reject) => {
			const metadata = await new YtDlpWrapper()
				.getMetadata(url)
				.then((info) => info)
				.catch((err) => {
					reject(err);
				});
			const artist = metadata.uploader || metadata.artist || "Unknown";
			let title = metadata.title || "Unknown";
			// remove artist from title
			if (title.toLowerCase().startsWith(artist.toLowerCase() + " - ")) {
				title = title.substr(artist.length + 3); // +3 for " - "
			}
			const newSong: Song = {
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
	};
	static remove = (songToRemove: Song) => {
		this.queue = this.queue.filter((song) => song !== songToRemove);
	};
}
