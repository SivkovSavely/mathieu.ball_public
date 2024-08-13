import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, parseVkIdFromMention, rand} from "../util";
import {vk} from "../index";

export let pseudoRandomKickId: number | null = null; // if null actually kick a random person

// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^кик/i,
    name: 'кик',
    description: 'кикает чела',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const allowedPeopleIds = [
            150013768, // я
            // в реале тут еще мои друзья записаны но я их тут убрал
        ];
        
        if (!allowedPeopleIds.includes(ctx.senderId)) {
            await ctx.replyError('вам запрещен доступ к команде кик!');
            return;
        }
        
        if (args.length > 0) {
            if (args[0]?.toLowerCase() === 'рандом') {
                await ctx.reply("кикаем случайного человека... всем молиться что это не вы!");
                if (pseudoRandomKickId != null) {
                    await kick(pseudoRandomKickId!, ctx);
                } else {
                    // actual kick random
                    const members = await vk.api.messages.getConversationMembers({
                        peer_id: ctx.peerId
                    });
                    const randomMember = members.items![Math.floor(Math.random() * members.items!.length)];
                    await kick(randomMember!.member_id!, ctx);
                }
            } else {
                if (ctx.senderId === 150013768 && args[0]?.toLowerCase() === 'псевдорандом') {
                    pseudoRandomKickId = parseVkIdFromMention(args.slice(1).join(' '))!;
                    if (!pseudoRandomKickId) {
                        await ctx.replyError("ошибка: невалидный меншен");
                        return;
                    }
                    await ctx.reply(`кик рандом: ${args[1]}`);
                } else {
                    const whoToKick = parseVkIdFromMention(args.join(' '));
                    if (!whoToKick) {
                        await ctx.replyError("ошибка: невалидный меншен");
                        return;
                    }
                    await kick(whoToKick!, ctx);
                }
            }
        } else {
            await ctx.replyError("кик без аргументов. напишите кого кикнуть (тегните его) или напишите 'рандом' для кика случайного человека.");
        }
    }
} as ICommand;

async function kick(vkId: number, ctx: BotMsgCtx) {
    //console.log(`pseudoRandomKickId = ${pseudoRandomKickId ?? "null"}`);
    //await ctx.reply(`кикаем ${vkId} из чата ${ctx.peerId}. пока что не кикаю!`);
    await vk.api.messages.removeChatUser({
        chat_id: ctx.chatId!,
        user_id: vkId!,
    });
    pseudoRandomKickId = null;
}