import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, log} from "../util";
import * as child_process from "child_process";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^логи/i,
    name: 'логи [N = 15]',
    description: 'выводит N строк логов ошибок',
    minAllowedLevel: UserLevel.botAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        try {
            const output = child_process.execSync('pm2 logs --nostream --err --lines 10 --raw mathieu.ball');
            await ctx.reply(output);
        } catch (e) {
            await ctx.replyError((e instanceof Error ? e?.message : e?.toString())!);
        }
    }
} as ICommand;