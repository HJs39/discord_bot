const { SlashCommandBuilder, EmbedBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { cooldown_helper } = require('../implement/cooldown.js');
const { client } = require('../assets/client.js');
const quotes = require('../assets/quotes.json');
const { quote_command_available } = require('../assets/bot_assets.json');
const { colors } = require('../assets/embed_color.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("quote")
        .setDescription("get a random quote"),
    eval: async function (interaction) {
        if (!interaction.guild || !quote_command_available.includes(interaction.guild.id)) {
            await interaction.reply({
                content: "你不能在這裡用！",
                flags: MessageFlags.Ephemeral
            });
            return;
        } else if (!cooldown_helper.check('quote', interaction.user.id, Date.now(), cooldown_helper.from_second(20))) {
            const embed = new EmbedBuilder()
                .setTitle("冷卻中...")
                .setDescription("用的太急拉！\n稍微冷靜一下吧~")
                .setColor(colors.error)
                .setFooter({
                    text: `等下在來！`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply();
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        var attachment = undefined;
        const embed = new EmbedBuilder()
            .addFields({
                name: "",
                value: `｢${quote.text}｣`,
                inline: false
            })
            .setColor("#b3e9ff")
            .setFooter({
                text: `由愛麗絲挑選`,
                iconURL: client.user.avatarURL(),
            })
            .setTimestamp();
        if (quote.quote.length != 0) {
            attachment = new AttachmentBuilder(quote.quote);
            embed.setImage(`attachment://${quote.file_name}`);
        }
        if (quote.author.length != 0) embed.setAuthor({
            name: quote.author
        });
        cooldown_helper.set('quote', interaction.user.id, Date.now());
        if (attachment !== undefined) await interaction.editReply({ embeds: [embed], files: [attachment] });
        else await interaction.editReply({ embeds: [embed] });
    },
    quotes: quotes
}