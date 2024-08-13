import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^мне -ник/i,
    name: 'мне -ник',
    description: 'удаляет вам никнейм в этом чате.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'мне ник',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        ctx.groupChatUser.nickname = null;
        ctx.saveDb();
        await ctx.reply('теперь у вас нет никнейма!');
    }
} as ICommand;