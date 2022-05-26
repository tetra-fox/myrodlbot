import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

export default class Config {
	static binPath = Deno.cwd() + "/bin";
	static tmpPath = Deno.cwd() + "/tmp";
	static logPath = Deno.cwd() + "/log";
	static logFile = Config.logPath +
		`/myrodlbot_${new Date().toISOString()}.log`;
	static ytDlpPath = this.binPath + "/yt-dlp" +
		(os.platform() === "windows" ? ".exe" : "");
	static sizeLimit = 50 * 1000 * 1000; // 50000000 bytes, 50 megabytes
}
