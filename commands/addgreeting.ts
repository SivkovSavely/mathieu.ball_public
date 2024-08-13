import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import {vk} from "../index";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^\+приветствие/i,
    name: '+приветствие',
    description: 'добавляет приветствие в чат',
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
        
        const greeting = args.join(' ');
        if (greeting.trim().length === 0) {
            await ctx.replyError('приветствие не может быть пустым. чтобы убрать приветствие, используйте команду -приветствие (с минусом).');
            return;
        }
        
        ctx.groupChat.greeting = greeting;
        
        const photo = ctx.getAttachments("photo")[0];
        if (photo) {
            ctx.groupChat.greetingAttachment = `photo${photo.ownerId}_${photo.id}_${photo.accessKey}`;
        }

        ctx.saveDb();
        
        await ctx.reply('приветствие сохранено!');
    }
} as ICommand;
