/**
 * This yt-dlp wrapper was originally written by @foxesdocode.
 * I have only ported the functions necessary for this bot to Deno.
 * Therefore, the code here has been written largely in part by the
 * original author, and I've only changed certain Node API calls to
 * Deno equivalents.
 *
 * Additionally, there are some minor changes to how this functions,
 * particularly the `getVideoInfo` function, as well as some minor
 * changes to how events are emitted. Specifically, we use the generic
 * `EventEmitter` class instead of the extended class the original
 * author wrote.
 *
 * Eventually, I might do a complete port, however, this is my first
 * Deno project, and I'm not entirely familiar with its APIs yet.

 * Original source: https://github.com/foxesdocode/yt-dlp-wrap
 */

import EventEmitter from "https://deno.land/x/events@v1.0.0/mod.ts";
import { download } from "https://deno.land/x/download@v1.0.1/mod.ts";
import { readLines } from "https://deno.land/std@0.104.0/io/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

import { Progress } from "./ytdlp-wrap-types.ts";

const executableName = "yt-dlp";
const progressRegex = /\[download\] *(.*) of ([^ ]*)(:? *at *([^ ]*))?(:? *ETA *([^ ]*))?/;

export default class YtDlpWrapper {
	private binaryPath: string;

	constructor(binaryPath: string = executableName) {
		this.binaryPath = binaryPath;
	}

	getBinaryPath(): string {
		return this.binaryPath;
	}

	setBinaryPath(binaryPath: string) {
		this.binaryPath = binaryPath;
	}

	exec = (
		args: string[] = [],
		abortSignal: AbortSignal | null = null,
	): EventEmitter => {
		const events = new EventEmitter();
		const proc = Deno.run({
			cmd: [this.binaryPath, ...args],
			stdout: "piped",
			stderr: "piped",
		});

		this.parseToEvent(proc.stdout, events);
		this.parseToEvent(proc.stderr, events);

		proc.status().then((status) => {
			if (status.success) events.emit("close");
		});

		return events;
	};

	parseToEvent = async (
		reader: Deno.Reader,
		events: EventEmitter,
	): Promise<void> => {
		const a = readLines(reader);
		for await (const line of a) {
			const match = progressRegex.exec(line);
			console.log(line);
			// if (match) {
			//     const [, name, total, , , , eta] = match;
			//     const progress: Progress = {
			//         "penis",
			//         total,
			//         eta,
			//     };
			//     events.emit("progress", progress);
			// }
		}
		return;
		// for await (
		//   const outputLine of readLines(reader)
		//     .toString()
		//     .split(/\r|\n/g)
		//     .filter(Boolean)
		// ) {
		//   console.log(outputLine.toString());
		//   if (outputLine[0] == "[") {
		//     let progressMatch = outputLine.match(progressRegex);
		//     if (progressMatch) {
		//       let progressObject: Progress = {};
		//       progressObject.percent = parseFloat(
		//         progressMatch[1].replace("%", ""),
		//       );
		//       progressObject.totalSize = progressMatch[2].replace(
		//         "~",
		//         "",
		//       );
		//       progressObject.currentSpeed = progressMatch[4];
		//       progressObject.eta = progressMatch[6];

		//       events.emit("progress", progressObject);
		//     }

		//     let eventType = outputLine
		//       .split(" ")[0]
		//       .replace("[", "")
		//       .replace("]", "");
		//     let eventData = outputLine.substring(
		//       outputLine.indexOf(" "),
		//       outputLine.length,
		//     );
		//     events.emit("ytDlpEvent", eventType, eventData);
		//   }
		// }
	};

	getMetadata = (url: URL): Promise<any> => {
		return new Promise<string>((resolve, reject) => {
			const testdata = {
				title: "test",
				uploader: "test",
				artist: "test",
			};
			resolve(JSON.stringify(testdata));
			this.exec(["--dump-json", url.href]).on("close", () => {
			});
			// this.exec(["--dump-json", url.href], null).on(
			//   "ytDlpEvent",
			//   (type: any, data: any) => {
			//     if (type === "DONE") {
			//       resolve(data);
			//     }
			//   },
			// );
		});
	};

	static getGithubReleases = (page = 1, perPage = 1): Promise<any> => {
		return new Promise<any>(async (resolve, reject) => {
			const apiURL = "https://api.github.com/repos/yt-dlp/yt-dlp/releases?page=" +
				page +
				"&per_page=" +
				perPage;
			await fetch(apiURL).then((response) => {
				if (response.ok) {
					response.json().then((json) => {
						resolve(json);
					});
				} else {
					reject(response.statusText);
				}
			});
		});
	};

	static fetchBinary = async (
		filePath?: string,
		version?: string,
		platform = os.platform(),
	): Promise<void> => {
		const isWindows = platform == "windows";
		const filename = executableName + (isWindows ? ".exe" : "");
		if (!version) {
			version = (await YtDlpWrapper.getGithubReleases(1, 1))[0].tag_name;
		}
		if (!filePath) filePath = "./" + filename;
		const fileURL = "https://github.com/yt-dlp/yt-dlp/releases/download/" +
			version +
			"/" +
			filename;
		await download(fileURL, {
			dir: filePath,
			file: filename,
		});
		if (!isWindows) await Deno.chmod(filePath, 0o777); // Deno.chmod throws on windows
	};
}
