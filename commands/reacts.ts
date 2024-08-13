import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import {vk} from "../index";

// ❤🔥😂👍💩❓😭😡
// 👎👌😄🤔🙏😘😍🎉

export const reactsList = {
    [1]: '❤',
    [2]: '🔥',
    [3]: '😂',
    [4]: '👍',
    [5]: '💩',
    [6]: '❓',
    [7]: '😭',
    [8]: '😡',
    [9]: '👎',
    [10]: '👌',
    [11]: '😄',
    [12]: '🤔',
    [13]: '🙏',
    [14]: '😘',
    [15]: '😍',
    [16]: '🎉',
};


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^реакты/i,
    name: 'реакты',
    description: 'вывести все доступные реакты',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        await ctx.reply(Object.values(reactsList).filter(x => x.length > 0).join(', '));
    }
} as ICommand;