import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import {vk} from "../index";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^-приветствие/i,
    name: '-приветствие',
    description: 'убирает приветствие в чате',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const members = await vk.api.messages.getConversationMembers({
            peer_id: ctx.peerId,
        });
        const member = members.items!.filter(x => x.member_id === ctx.senderId)[0];
        
        if (!member || !member.is_admin) {
            await ctx.replyError('вы не являетесь администратором в беседе');
            return;
        }
        
        ctx.groupChat.greeting = undefined;
        ctx.groupChat.greetingAttachment = undefined;
        ctx.saveDb();
        
        await ctx.reply('приветствие удалено!');
    }
} as ICommand;
