export default class StringUtils {
  static escapeMarkdownV2(text: string): string {
    // https://stackoverflow.com/a/60145565/2621063
    return text.replace(
      /(\[[^\][]*]\(http[^()]*\))|[_*[\]()~>#+=|{}.!-]/gi,
      (x, y) => (y ? y : "\\" + x)
    );
  }
}
