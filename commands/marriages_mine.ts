 import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline, getNicknameOrFullName, parseVkIdFromMention} from "../util";
import {Marriage} from "../db";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^мои браки/i,
    name: 'мои браки',
    description: 'список твоих браков в этой беседе',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'браки',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        let s = '';
        let marriages = [...ctx.groupChat.marriages.filter(x => x.member1VkId === ctx.senderId || x.member2VkId === ctx.senderId)];
        marriages.sort((a, b) => a.member1VkId - b.member1VkId);
        for (const marriage of marriages) {
            let member1 = ctx.groupChat.users.find(x => x.vkId === marriage.member1VkId)!;
            let member2 = ctx.groupChat.users.find(x => x.vkId === marriage.member2VkId)!;

            s += `- ${await getNicknameOrFullName(member1.vkId !== ctx.senderId ? member1 : member2, true)}\n`;
        }

        if (s.length === 0) s = 'браков нет';
        await ctx.reply(`твои браки:\n\n${s.trim()}`);
    }
} as ICommand;