import { ReadStream } from "fs";
import { Context } from "telegraf";
import { Update } from "typegram";
import { Message } from "typegram";
import StringUtils from "../utils/string";

declare module "telegraf" {
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
    return this.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        StringUtils.escapeMarkdownV2(content),
        { parse_mode: "MarkdownV2", disable_web_page_preview: true }
    );
};

Context.prototype.replyTo = function (
    this: Context,
    content: string
): Promise<Message.TextMessage> {
    if (!confirmContext(this)) return Promise.reject(new Error("No context"));
    return this.telegram.sendMessage(
        this!.chat!.id,
        StringUtils.escapeMarkdownV2(content),
        {
            reply_to_message_id: this.message?.message_id,
            disable_web_page_preview: true,
            parse_mode: "MarkdownV2"
        }
    );
};

Context.prototype.replyToWithAudio = function (
    this: Context,
    file: ReadStream,
    filename: string
): Promise<Message.AudioMessage> {
    if (!confirmContext(this)) return Promise.reject(new Error("No context"));
    this.telegram
        .sendChatAction(this.chat!.id, "upload_document")
        .catch(() => {}); // ignore errors
    return this.telegram.sendAudio(
        this.chat!.id,
        {
            source: file,
            filename
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
