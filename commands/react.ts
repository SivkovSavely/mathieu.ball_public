import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import {vk} from "../index";
import {reactsList} from "./reacts";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^реакт (?!на)/i,
    name: 'реакт',
    description: 'реагирует ботом на пересланное сообщение',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (ctx.replyMessage === undefined) {
            return await ctx.reply('ответь на сообщение на которое хочешь чтобы я отреагировал');
        }

        const emoji = args[0]!;

        const neededReaction = Object.entries(reactsList).find(e => e[1] === emoji);
        if (neededReaction === undefined) {
            return await ctx.reply('такой реакции нет');
        }

        await vk.api.call("messages.sendReaction", {
            peer_id: ctx.peerId,
            cmid: ctx.replyMessage.conversationMessageId,
            reaction_id: neededReaction[0]
        });
    }
} as ICommand;