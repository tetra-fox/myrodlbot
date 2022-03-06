import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

export default class Config {
  static binPath = Deno.cwd() + "/bin";
  static ytdlpPath = this.binPath + "/yt-dlp" + (os.platform() === "win32" ? ".exe" : "");
  static tmpPath = Deno.cwd() + "/tmp";
  static sizeLimit = 5 * 1024 * 1024 * 1024;
}
