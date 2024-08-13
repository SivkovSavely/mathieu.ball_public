import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline, log, rand} from "../util";
import {vk} from "../index";
import {APIError} from "vk-io";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^когда/i,
    name: 'когда [запрос]',
    description: 'рандомная дата по запросу.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: true,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const query = args.join(' ');
        const choice = rand(0, 3);
        if (choice === 0) {
            // N days
            const rnd = rand(1, 30);
            await ctx.reply(`${query} через ${rnd} ${decline(rnd, ['день', 'дня', 'дней'])}`);
        } else if (choice === 1) {
            // N months
            const rnd = rand(1, 11);
            await ctx.reply(`${query} через ${rnd} ${decline(rnd, ['месяц', 'месяца', 'месяцев'])}`);
        } else if (choice === 2) {
            // N years
            const rnd = rand(1, 5);
            await ctx.reply(`${query} через ${rnd} ${decline(rnd, ['год', 'года', 'лет'])}`);
        } else if (choice === 3) {
            // exact date and time within 3 years from now
            const dayInMs = 1000 * 60 * 60 * 24;
            const rnd = rand(dayInMs, dayInMs * 365 * 3);
            const date = new Date();
            date.setTime(date.getTime() + rnd);

            const d = date.getDate();
            const mon = date.getMonth();
            const y = date.getFullYear();
            const hr = date.getHours();
            const min = date.getMinutes().toString().padStart(2, '0');

            await ctx.reply(`${query} ${d}.${mon}.${y} в ${hr}:${min}`);
        }
    }
} as ICommand;