import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^глаголы/i,
    name: 'глаголы',
    description: 'показывает рп глаголы в этом чате',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (ctx.groupChat.rolePlayVerbs.length === 0) {
            await ctx.reply('в этом чате нет рп глаголов');
            return;
        }

        await ctx.reply(`рп глаголы в этом чате:
${ctx.groupChat.rolePlayVerbs.map(v => `- ${v}`).join('\n')}`);
    }
} as ICommand;