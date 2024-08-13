import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, parseVkIdFromMention} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^для (\[.*]) -ник/i,
    name: 'для @idXXX -ник',
    description: 'убирает у другого человека никнейм в этом чате.',
    minAllowedLevel: UserLevel.chatAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const mention = trigger.match(this.trigger);
        if (mention === null) {
            await ctx.replyError('а для кого ник?');
            return;
        }

        const userVkId = parseVkIdFromMention(mention![1]!);
        if (userVkId === undefined) {
            await ctx.replyError('такого юзера в беседе нет');
            return;
        }
        const gcUser = ctx.groupChat.users.find(x => x.vkId === userVkId);
        if (gcUser === undefined) {
            await ctx.replyError('такого юзера в беседе нет');
            return;
        }

        gcUser.nickname = null;
        ctx.saveDb();
        await ctx.reply('теперь у данного пользователя нет никнейма!');
    }
} as ICommand;