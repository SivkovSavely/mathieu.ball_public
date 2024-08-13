import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline, parseVkIdFromMention} from "../util";
import {Marriage} from "../db";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^развод/i,
    name: 'развод',
    description: 'развестись',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const name = args.join(' ');
        if (name.trim().length === 0) {
            await ctx.replyError('с кем разводиться?');
            return;
        }

        const breakupeeVkId = parseVkIdFromMention(name);
        if (breakupeeVkId === undefined) {
            await ctx.replyError('эта команда принимает только упоминание человека в качестве аргумента! (упоминание это @ник)');
            return;
        }

        const secondMember = ctx.groupChat.users.find(x => x.vkId === breakupeeVkId);
        if (secondMember === undefined) {
            await ctx.replyError('этого человека нет в этой беседе!');
            return;
        }

        const marriagesWithThisPerson = ctx.groupChat.marriages.filter(m =>
            m.member1VkId === ctx.senderId && m.member2VkId === breakupeeVkId
            || m.member1VkId === breakupeeVkId && m.member2VkId === ctx.senderId);

        if (marriagesWithThisPerson.length === 0) {
            await ctx.replyError("у вас нет брака с этим человеком!");
            return;
        }

        if (marriagesWithThisPerson.length > 1) {
            await ctx.replyError("как у вас два брака с этим человеком?");
            return;
        }

        ctx.groupChat.marriages = ctx.groupChat.marriages.filter(m => m.id !== marriagesWithThisPerson[0]!.id);
        ctx.saveDb();
        await ctx.reply('брак разорван!');
    }
} as ICommand;