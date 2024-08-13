import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, getNicknameOrFullName, getUserOrBotName} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^ники/i,
    name: 'ники',
    description: 'выводит список ников участников беседы',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        let s = '';
        for (const user of ctx.groupChat.users) {
            if (user.nickname === null) continue;

            s += `- ${await getUserOrBotName(user.vkId)} - ${user.nickname}\n`;
        }

        if (s.length === 0) s = 'ников нет';
        await ctx.reply(`ники в этом чате:\n\n${s.trim()}`);
    }
} as ICommand;