import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^всем -ник/i,
    name: 'всем -ник',
    description: 'удаляет всем никнейм в этом чате.',
    minAllowedLevel: UserLevel.chatAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'мне -ник',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        for (const user of ctx.groupChat.users) {
            user.nickname = null;
        }
        ctx.saveDb();
        await ctx.reply('теперь у вас у всех нет никнейма!');
    }
} as ICommand;