import MyroMessage, { MyroMessageLevel } from "./MyroMessage.ts";

const validSources = [
  {
    name: "YouTube",
    domains: "youtube.com",
    regex:
      /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/i,
  },
  {
    name: "SoundCloud",
    domain: "soundcloud.com",
    regex:
      /^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/,
  },
];

// lol thanks for the regex, copilot (soundcloud is too hard though, so just check the domain)

export default class Url {
  /**
   * @param url URL to validate
   * @returns URL object if valid, null otherwise
   */
  public static validate = (url: string): URL | MyroMessage => {
    try {
      // first check the url is even parsble
      const validated = new URL(url);

      // then verify that we support this source
      let i = 0;
      for (let source of validSources) {
        if (source.regex.test(url)) {
          break;
        }

        // if we have reached the end of validSources, then the URL is invalid
        if (i === validSources.length - 1) {
          return new MyroMessage({
            message:
              `${url} is not a valid link.\nCurrently supported platforms are ${
                validSources
                  .map((source) => source.name)
                  .join(", ")
              }`,
          });
        }
        i++;
      }

      return validated;
    } catch (_) {
      return new MyroMessage({
        message: `${url} is not a valid URL`,
        level: MyroMessageLevel.WARN,
      });
    }
  };
}
