import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline} from "../util";
import fs from "fs";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^напомниорестарте/i,
    name: 'напомниорестарте',
    description: 'напоминает о рестарте бота в том чате в котором вызвана команда',
    minAllowedLevel: UserLevel.botAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        fs.writeFileSync("remindAboutRestart.txt", ctx.peerId.toString());
        await ctx.reply("напомню!");
    }
} as ICommand;