import { ReadStream } from "fs";
import { Context } from "https://deno.land/x/grammy@v1.7.0/mod.ts";
import { Update } from "typegram";
import { Message } from "typegram";
import StringUtils from "../utils/string.ts";

declare module "https://deno.land/x/grammy@v1.7.0/mod.ts" {
    class Context {
        editMessage(
            this: Context,
            msg: Message,
            content: string
        ): Promise<true | (Update.Edited & Message.TextMessage)>;
        replyTo(this: Context, content: string): Promise<Message.TextMessage>;
        replyToWithAudio(
            this: Context,
            file: ReadStream,
            filename: string
        ): Promise<Message.AudioMessage>;
    }
}

Context.prototype.editMessage = function (
    this: Context,
    msg: Message,
    content: string
): Promise<true | (Update.Edited & Message.TextMessage)> {
    if (!confirmContext(this)) return Promise.reject(new Error("No context"));
    return this.editMessageText(StringUtils.escapeMarkdownV2(content), {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true
    });
};

Context.prototype.replyTo = function (
    this: Context,
    content: string
): Promise<Message.TextMessage> {
    if (!confirmContext(this)) return Promise.reject(new Error("No context"));
    return this.reply(StringUtils.escapeMarkdownV2(content), {
        reply_to_message_id: this.message?.message_id,
        disable_web_page_preview: true,
        parse_mode: "MarkdownV2"
    });
};

Context.prototype.replyToWithAudio = function (
    this: Context,
    file: File,
    filename: string
): Promise<Message.AudioMessage> {
    if (!confirmContext(this)) return Promise.reject(new Error("No context"));
    this.replyWithChatAction("upload_document").catch(() => {}); // ignore errors
    return this.replyWithAudio({
      audio: file
    },
        {
            reply_to_message_id: this.message?.message_id,
            parse_mode: "MarkdownV2"
        }
    );
};

const confirmContext = (ctx: Context): boolean => {
    if (!ctx) return false;
    if (!ctx.message) return false;
    if (!ctx.message.chat) return false;
    if (!ctx.message.chat.id) return false;
    if (!ctx.message.from) return false;
    if (!ctx.message.from.id) return false;
    return true;
};
