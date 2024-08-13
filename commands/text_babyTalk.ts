import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(?:дразнилка)(?!\+)/i,
    name: 'дразнилка',
    description: 'дьязьнийкя',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length === 0 && !ctx.hasReplyMessage && !ctx.hasForwards) {
            await ctx.replyError('введи сообщение после команды так: матье дразнилка ghbdtn vbh!\n' +
                'либо перешли сообщение и введи просто "матье дразнилка"');
            return;
        }

        const message = ctx.hasReplyMessage ? ctx.replyMessage?.text
            : ctx.hasForwards ? ctx.forwards.map(x => x.text ?? '').join('\n\n')
                : args.join(' ');

        if (message == undefined) {
            await ctx.replyError("че ты мне переслал(а)? где сообщение)");
            return;
        }

        await ctx.reply('подразнил:\n\n' + convert(message));
    }
} as ICommand;

export function convert(original: string): string {
    const consonants = 'бвгджзклмнпрстфхцчшщ';
    return original
        .replaceAll(RegExp(`р(?= |$)`, 'gi'), 'й')
        .replaceAll(RegExp(`(?<=[${consonants}])р`, 'gi'), 'ь')
        .replaceAll(RegExp(`(?<=[^${consonants}])р`, 'gi'), '')
        .replaceAll(RegExp(/л/gi), 'й')
        .replaceAll(RegExp(/а/gi), 'я')
        .replaceAll(RegExp(/о/gi), 'ё')
        .replaceAll(RegExp(/у/gi), 'ю')
        .replaceAll(RegExp(/ы/gi), 'и')
        .replaceAll(RegExp(/э/gi), 'е')
        .replaceAll(RegExp(/ш/gi), 'с')
        .replaceAll(RegExp(/щ/gi), 'с')
        .replaceAll(RegExp(/ж/gi), 'з')
        .replaceAll(RegExp(`([${consonants}])([${consonants}])`, 'gi'), '$1ь$2');
}
