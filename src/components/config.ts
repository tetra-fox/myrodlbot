import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

export default class Config {
<<<<<<< Updated upstream
  static binPath = Deno.cwd() + "/bin";
  static ytdlpPath = this.binPath + "/yt-dlp" + (os.platform() === "win32" ? ".exe" : "");
  static tmpPath = Deno.cwd() + "/tmp";
  static sizeLimit = 5 * 1024 * 1024 * 1024;
}
=======
    static binPath = process.cwd() + "/bin";
    static ytdlpPath = this!.binPath + "/yt-dlp" + (os.platform() === "win32" ? ".exe" : "");
    static tmpPath = process.cwd() +"/tmp";
    static sizeLimit = 5 * 1024 * 1024 * 1024;
};
>>>>>>> Stashed changes
