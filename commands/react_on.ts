import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, getNicknameOrFullName, parseVkIdFromMention} from "../util";
import {vk} from "../index";
import {reactsList} from "./reacts";

export const reactsOnList: {vkId: number, peerId: number, reactNumber: number}[] = [];

// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^реакт на/i,
    name: 'реакт на <юзер> <эмодзи реакта>',
    description: 'бот будет реагировать данным реактом на каждое сообщение данного юзера. список возможных реактов -- в команде "реакты"',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const vkId = parseVkIdFromMention(args.join(' '));
        const reactName = args[1];

        const gcu = ctx.groupChat.users.find(x => x.vkId === vkId);
        if (gcu === undefined) {
            return await ctx.replyError('такого юзера в чате нет');
        }

        const index = reactsOnList.findIndex(x => x.peerId === ctx.peerId && x.vkId === vkId);

        if (index >= 0) {
            reactsOnList.splice(index, 1); // remove that thing
            await ctx.reply("убрал кару божью");
        } else {
            if (reactName === undefined) {
                return await ctx.replyError('реакцию то какую ставить?');
            }
            reactsOnList.push({
                peerId: ctx.peerId,
                vkId: vkId!,
                reactNumber: parseInt(Object.entries(reactsList).find(x => x[1] === reactName)![0]),
            });
            await ctx.reply("добавил кару божью");
        }
    }
} as ICommand;