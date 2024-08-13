import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^капитализация/i,
    name: 'капитализация',
    description: 'чекает с какой буквы чел пишет сообщения',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (!ctx.hasReplyMessage) {
            await ctx.replyError("надо ответить (не переслать) на сообщение чела у которого хочешь чекнуть капитализацию");
            return;
        }
        
        const user = ctx.db().users.filter(x => x.vkId === ctx.replyMessage?.senderId!);
        if (user.length < 1) {
            await ctx.replyError("этот юзер ничего не писал");
            return;
        }
        
        console.log('user', user);
        
        await ctx.reply(`с маленькой буквы: ${decline(user[0]!.capitalizations.lowerCase, ['сообщение', 'сообщения', 'сообщений'], true)}
с большой буквы: ${decline(user[0]!.capitalizations.properCase, ['сообщение', 'сообщения', 'сообщений'], true)}
смешанно (внутри одного сообщения): ${decline(user[0]!.capitalizations.mixedCase, ['сообщение', 'сообщения', 'сообщений'], true)}`);
    }
} as ICommand;