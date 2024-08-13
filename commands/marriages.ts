import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline, getNicknameOrFullName, log, parseVkIdFromMention} from "../util";
import {Marriage} from "../db";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^браки/i,
    name: 'браки',
    description: 'список браков в этой беседе',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        let s = '';
        let marriages = [...ctx.groupChat.marriages];
        marriages.sort((a, b) => a.member1VkId - b.member1VkId);
        for (const marriage of marriages) {
            let member1 = ctx.groupChat.users.find(x => x.vkId === marriage.member1VkId)!;
            let member2 = ctx.groupChat.users.find(x => x.vkId === marriage.member2VkId)!;

            const marriageAgeInDays = Math.floor((Date.now() - marriage.startDate) / 1000 / 60 / 60 / 24);

            s += `- ${await getNicknameOrFullName(member1, true, marriage.member1VkId)} и ${await getNicknameOrFullName(member2, true, marriage.member2VkId)} (${marriageAgeInDays} дн.)\n`;
        }

        if (s.length === 0) s = 'браков нет';
        await ctx.reply(`браки в этом чате:\n\n${s.trim()}`);
    }
} as ICommand;