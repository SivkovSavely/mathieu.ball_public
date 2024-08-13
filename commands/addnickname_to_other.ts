import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, parseVkIdFromMention} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^для (\[.*]) ник/i,
    name: 'для @idXXX ник',
    description: 'меняет другому человеку никнейм в этом чате.',
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

        if (args.join(' ').trim().length === 0) {
            await ctx.replyError('а какой ник?');
            return;
        }

        const forbiddenNicknames = [...new Set([
            ...ctx.groupChat.users.filter(x => x.nickname !== null).map(x => x.nickname!),
            ...ctx.groupChat.users.map(x => {
                let u = ctx.db().users.find(y => x.vkId === y.vkId)!;
                return u.firstName + ' ' + u.lastName;
            })
        ])].filter(x => x.trim().length > 0);

        const nickname = args.join(' ');
        if (forbiddenNicknames.includes(nickname)) {
            await ctx.replyError('такой никнейм запрещен! нельзя ставить чужие никнеймы и имена');
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

        gcUser.nickname = nickname;
        ctx.saveDb();
        await ctx.reply('поздравляю с новым никнеймом!');
    }
} as ICommand;