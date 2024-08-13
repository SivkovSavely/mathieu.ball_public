import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, decline} from "../util";
import * as fs from 'fs';


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^версия/i,
    name: 'версия',
    description: 'выводит инфу о версии бота.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const version = process.env["BOT_VERSION"] || (fs.readFileSync('./version.txt').toString() + '-local');

        const deployedAt = new Date(parseInt(process.env["DEPLOYED_AT"]!));
        const mskPlusOffset = -deployedAt.getTimezoneOffset() / 60 - 3;
        const mskPlusOffsetStr = mskPlusOffset === 0
            ? ''
            : mskPlusOffset > 0
                ? '+' + mskPlusOffset
                : mskPlusOffset;
        const deployedAtDay = deployedAt.getDate();
        const deployedAtMonth = deployedAt.getMonth() + 1;
        const deployedAtYear = deployedAt.getFullYear();
        const deployedAtHour = (deployedAt.getHours()).toString().padStart(2, '0');
        const deployedAtMinute = deployedAt.getMinutes().toString().padStart(2, '0');
        const deployedAtStr = `${deployedAtDay}.${deployedAtMonth}.${deployedAtYear} ${deployedAtHour}:${deployedAtMinute} MSK${mskPlusOffsetStr}`;

        const uptimeTotalSeconds = process.uptime();
        const uptimeSeconds = Math.floor(uptimeTotalSeconds) % 60;
        const uptimeMinutes = Math.floor(uptimeTotalSeconds / 60) % 60;
        const uptimeHours = Math.floor(uptimeTotalSeconds / 60 / 60) % 60;
        const uptimeDays = Math.floor(uptimeTotalSeconds / 60 / 60 / 24);
        const uptimeString = (() => {
            let _uptimeString = '';
            if (uptimeDays > 0)
                _uptimeString += `${uptimeDays} ${decline(uptimeDays, ['день', 'дня', 'дней'])} `;
            if (uptimeHours > 0)
                _uptimeString += `${uptimeHours} ${decline(uptimeHours, ['час', 'часа', 'часов'])} `;
            if (uptimeMinutes > 0)
                _uptimeString += `${uptimeMinutes} ${decline(uptimeMinutes, ['минута', 'минуты', 'минут'])} `;
            _uptimeString += `${uptimeSeconds} ${decline(uptimeSeconds, ['секунда', 'секунды', 'секунд'])}`;
            return _uptimeString;
        })();

        await ctx.reply(`инфа о боте матье балл:

версия бота: ${version}
${process.env["DEPLOYED_AT"] ? `задеплоено на сервер ${deployedAtStr}` : 'локальная разработка'}
аптайм бота: ${uptimeString}

версия ноды: ${process.version}`);
    }
} as ICommand;