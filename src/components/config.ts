import os from "os";

let binPath = process.cwd() + "/bin";
let ytdlpPath = binPath + "/yt-dlp" + (os.platform() === "win32" ? ".exe" : "");
let tmpPath = process.cwd() +"/tmp";

export default {
    binPath,
    ytdlpPath,
    tmpPath,
    sizeLimit: 5 * 1024 * 1024 * 1024
};
