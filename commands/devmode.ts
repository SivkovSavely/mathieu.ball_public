import {ICommand, getCommands, UserLevel} from "../ICommand";
import {BotMsgCtx, log} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(?:devmode)/i,
    name: 'devmode',
    description: 'переключает режим "для разработки" вкл <-> выкл',
    minAllowedLevel: UserLevel.botAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (process.env['IS_IN_PRODUCTION'] !== 'true') {
            log('"devmode" command only works in production');
            return;
        }

        const db = ctx.db();
        db.devMode = !db.devMode;
        ctx.saveDb();

        await ctx.reply(`режим разработки ${db.devMode ? 'включен' : 'выключен'}`);
    }
} as ICommand;