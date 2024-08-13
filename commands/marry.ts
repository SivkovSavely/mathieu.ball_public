import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline, parseVkIdFromMention} from "../util";
import {Marriage} from "../db";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^брак /i,
    name: 'брак',
    description: 'жениться на ком-то',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const name = args.join(' ');
        if (name.trim().length === 0) {
            await ctx.replyError('с кем жениться?');
            return;
        }

        const marryeeVkId = parseVkIdFromMention(name);
        if (marryeeVkId === undefined) {
            await ctx.replyError('эта команда принимает только упоминание человека в качестве аргумента! (упоминание это @ник)');
            return;
        }

        const secondMember = ctx.groupChat.users.find(x => x.vkId === marryeeVkId);
        if (secondMember === undefined) {
            await ctx.replyError('этого человека нет в этой беседе!');
            return;
        }

        const marriagesWithThisPerson = ctx.groupChat.marriages.filter(m =>
            m.member1VkId === ctx.senderId && m.member2VkId === marryeeVkId
            || m.member1VkId === marryeeVkId && m.member2VkId === ctx.senderId);

        if (marriagesWithThisPerson.length > 0) {
            await ctx.replyError("у вас уже есть брак с этим человеком!");
            return;
        }

        const marriage = new Marriage(ctx.groupChat, ctx.groupChatUser.vkId, secondMember.vkId);
        ctx.groupChat.marriages.push(marriage);
        ctx.saveDb();
        await ctx.reply('брак создан!');
    }
} as ICommand;