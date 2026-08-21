const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const { quotes } = require('./quote.js');
const { assets_path } = require('../assets/assets_path.js');
const _ = require('lodash');
const file_type = require('file-type');
const fs = require("node:fs");
const path = require('node:path');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("assign_quote")
        .setDescription("add a new quote to Alice's quote list")
        .addStringOption(option => option.setName("text")
            .setDescription("the content of the quote")
            .setRequired(true))
        .addStringOption(option => option.setName("author")
            .setDescription("the name of user said this"))
        .addStringOption(option => option.setName("link")
            .setDescription("a image link of this quote"))
        .addAttachmentOption(option => option.setName("image")
            .setDescription("the image of this quote")),
    eval: async function (interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const image = interaction.options.getAttachment('image');
        const text = interaction.options.getString('text');
        const author = interaction.options.getString('author') ?? '';
        const link = interaction.options.getString('link');
        const has_image = (image !== null) || (link !== null);
        const embed = new EmbedBuilder();
        if (author.length != 0) embed.setAuthor({ name: author });
        if (has_image) {
            if (image !== null) {
                if (image.contentType?.startsWith('image/')) {
                    var save_path = path.join(assets_path, 'quotes', image.name);
                    const download_image = await fetch(image.url);
                    const byte_image = await download_image.arrayBuffer();
                    fs.writeFileSync(save_path, Buffer.from(byte_image));
                    quotes.push({
                        quote: save_path,
                        file_name: image.name,
                        author: author,
                        text: text
                    });
                    embed.addFields({
                        name: "",
                        value: `｢${text}｣`,
                        inline: false
                    })
                        .setImage(image.url)
                        .setColor("#b3e9ff")
                        .setFooter({
                            text: `由愛麗絲挑選`,
                            iconURL: client.user.avatarURL(),
                        })
                        .setTimestamp();
                } else {
                    embed.addFields({
                        name: "上傳失敗",
                        value: `上傳的檔案並不是圖片或動圖`,
                        inline: false
                    })
                        .setColor("#ff0000")
                        .setFooter({
                            text: `上傳失敗`,
                            iconURL: client.user.avatarURL(),
                        })
                        .setTimestamp();
                }
            } else {
                const download_image = await fetch(link);
                var file_name = path.basename((new URL(input_link)).pathname);
                var save_path = path.join(assets_path, 'quotes', file_name);
                const byte_image = await download_image.arrayBuffer();
                const check = await file_type.fileTypeFromBuffer(byte_image);
                if (check.mime.startsWith('image/')) {
                    fs.writeFileSync(save_path, Buffer.from(byte_image));
                    quotes.push({
                        quote: link,
                        file_name: file_name,
                        author: author,
                        text: text
                    });
                    embed.addFields({
                        name: "",
                        value: `｢${text}｣`,
                        inline: false
                    })
                        .setImage(link)
                        .setColor("#b3e9ff")
                        .setFooter({
                            text: `由愛麗絲挑選`,
                            iconURL: client.user.avatarURL(),
                        })
                        .setTimestamp();
                }else{
                    embed.addFields({
                        name: "上傳失敗",
                        value: `上傳的檔案並不是圖片或動圖`,
                        inline: false
                    })
                        .setColor("#ff0000")
                        .setFooter({
                            text: `上傳失敗`,
                            iconURL: client.user.avatarURL(),
                        })
                        .setTimestamp();
                }

            }
        } else {
            quotes.push({
                quote: "",
                author: author,
                text: text
            });
            embed.addFields({
                name: "",
                value: `｢${text}｣`,
                inline: false
            })
                .setColor("#b3e9ff")
                .setFooter({
                    text: `由愛麗絲挑選`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        }
        await interaction.editReply({
            content: "這是預覽~",
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }

}

process.on('exit', code => {
    fs.writeFileSync('./assets/quotes.json', JSON.stringify(quotes), 'utf-8');
});