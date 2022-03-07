/**
 * This yt-dlp wrapper was originally written by @foxesdocode.
 * I only have ported the functions necessary for this bot to Deno.
 * Therefore, the code here has been written largely in part by the
 * original author, and I've only changed certain Node API calls to
 * Deno equivalents.
 * 
 * Additionally, there are some minor changes to how this functions,
 * particularly the `getVideoInfo` function, as well as some minor
 * changes to how the `yt-dlp` library is downloaded.
 *
 * Eventually, I might do a complete port, however, this is my first
 * Deno project, and I'm not entirely familiar with its APIs yet.

 * Original source: https://github.com/foxesdocode/yt-dlp-wrap
 */

import { ChildProcess } from "https://deno.land/std@0.128.0/node/internal/child_process.ts";
import EventEmitter from "https://deno.land/x/events@v1.0.0/mod.ts";
import { download } from "https://deno.land/x/download@v1.0.1/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

import {
    Progress,
    YTDlpEventName,
    YTDlpEventNameToEventDataFunction,
    YTDlpEventNameToEventListenerFunction
} from "./ytdlp-wrap-types.ts";

const executableName = "yt-dlp";
const progressRegex =
    /\[download\] *(.*) of ([^ ]*)(:? *at *([^ ]*))?(:? *ETA *([^ ]*))?/;

//#region YTDlpEventEmitter

export interface YTDlpEventEmitter extends EventEmitter {
    ytDlpProcess?: typeof ChildProcess;

    removeAllListeners(eventName: YTDlpEventName | symbol): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listenerCount(eventName: YTDlpEventName): number;
    eventNames(): Array<YTDlpEventName>;
    addListener: YTDlpEventNameToEventListenerFunction<this>;
    prependListener: YTDlpEventNameToEventListenerFunction<this>;
    prependOnceListener: YTDlpEventNameToEventListenerFunction<this>;
    on: YTDlpEventNameToEventListenerFunction<this>;
    once: YTDlpEventNameToEventListenerFunction<this>;
    removeListener: YTDlpEventNameToEventListenerFunction<this>;
    off: YTDlpEventNameToEventListenerFunction<this>;
    listeners(eventName: YTDlpEventName): Function[];
    rawListeners(eventName: YTDlpEventName): Function[];
    emit: YTDlpEventNameToEventDataFunction<boolean>;
}
//#endregion

export default class YTDlpWrap {
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

    static setDefaultOptions(options: YTDlpOptions): YTDlpOptions {
      if (!options.maxBuffer) options.maxBuffer = 1024 * 1024 * 1024;
      return options;
  }

    exec(
        ytDlpArguments: string[] = [],
        options: YTDlpOptions = {},
        abortSignal: AbortSignal | null = null
    ): YTDlpEventEmitter {
        options = YTDlpWrap.setDefaultOptions(options);
        const execEventEmitter = new EventEmitter() as YTDlpEventEmitter;
        const ytDlpProcess = spawn(this.binaryPath, ytDlpArguments, options);
        execEventEmitter.ytDlpProcess = ytDlpProcess;
        YTDlpWrap.bindAbortSignal(abortSignal, ytDlpProcess);

        let stderrData = "";
        let processError: Error;
        ytDlpProcess!.stdout!.on("data", (data) =>
            YTDlpWrap.emitYoutubeDlEvents(data.toString(), execEventEmitter)
        );
        ytDlpProcess!.stderr!.on(
            "data",
            (data) => (stderrData += data.toString())
        );
        ytDlpProcess.on("error", (error) => (processError = error));

        ytDlpProcess.on("close", (code) => {
            if (code === 0 || ytDlpProcess.killed)
                execEventEmitter.emit("close", code);
            else
                execEventEmitter.emit(
                    "error",
                    YTDlpWrap.createError(code, processError, stderrData)
                );
        });
        return execEventEmitter;
    }

    static emitYoutubeDlEvents(
      stringData: string,
      emitter: YTDlpEventEmitter
  ): void {
      let outputLines = stringData.split(/\r|\n/g).filter(Boolean);
      for (let outputLine of outputLines) {
          if (outputLine[0] == "[") {
              let progressMatch = outputLine.match(progressRegex);
              if (progressMatch) {
                  let progressObject: Progress = {};
                  progressObject.percent = parseFloat(
                      progressMatch[1].replace("%", "")
                  );
                  progressObject.totalSize = progressMatch[2].replace(
                      "~",
                      ""
                  );
                  progressObject.currentSpeed = progressMatch[4];
                  progressObject.eta = progressMatch[6];

                  (emitter as YTDlpEventEmitter).emit(
                      "progress",
                      progressObject
                  );
              }

              let eventType = outputLine
                  .split(" ")[0]
                  .replace("[", "")
                  .replace("]", "");
              let eventData = outputLine.substring(
                  outputLine.indexOf(" "),
                  outputLine.length
              );
              (emitter as YTDlpEventEmitter).emit(
                  "ytDlpEvent",
                  eventType,
                  eventData
              );
          }
      }

    static getMetadata(url: URL) {
        return new Promise<string>((resolve, reject) => {
            const ytDlpProcess = Deno.run({
                cmd: [this.binaryPath, "--dump-json", url.href],
                stdout: "piped"
            });
            const stdout = new TextDecoder().decode(ytDlpProcess.stdout);
            ytDlpProcess.close();
            resolve(stdout);
        });
    }

    static getGithubReleases(page = 1, perPage = 1): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const apiURL =
                "https://api.github.com/repos/yt-dlp/yt-dlp/releases?page=" +
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
    }

    static async downloadFromGithub(
        filePath?: string,
        version?: string,
        platform = os.platform()
    ): Promise<void> {
        const isWindows = platform === "windows";
        const filename = `${executableName}${isWindows ? ".exe" : ""}`;
        if (!version) {
            version = (await YTDlpWrap.getGithubReleases(1, 1))[0].tag_name;
        }
        if (!filePath) filePath = "./" + filename;
        const fileURL =
            "https://github.com/yt-dlp/yt-dlp/releases/download/" +
            version +
            "/" +
            filename;
        await download(fileURL, {
            dir: filePath,
            file: filename
        });
        if (!isWindows) await Deno.chmod(filePath, 0o777); // Deno.chmod throws on windows
    }
}
