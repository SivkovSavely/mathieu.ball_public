import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^мне ник/i,
    name: 'мне ник',
    description: 'меняет вам никнейм в этом чате.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
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

        ctx.groupChatUser.nickname = nickname;
        ctx.saveDb();
        await ctx.reply('поздравляю с новым никнеймом!');
    }
} as ICommand;