const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const file_type = require('file-type');
const { client } = require('../assets/client.js');
const { cats, providers } = require('../assets/cats.js');
const { assets_path } = require('../assets/assets_path.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('assign_cat')
        .setDescription('append a cat image to database')
        .addAttachmentOption(option => option.setName('image')
            .setDescription('a cat image file'))
        .addStringOption(option => option.setName('link')
            .setDescription('a image link links to a cat image'))
        .addStringOption(option => option.setName('provider')
            .setDescription('the name of image provider(default is your username)')
            .setAutocomplete(true)),
    eval: async function (interaction) {
        const input_image = interaction.options.getAttachment('image');
        const input_link = interaction.options.getString('link') ?? '';
        const provider = interaction.options.getString('provider') ?? interaction.user.tag;
        var image;
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        if (input_image !== null && input_image.contentType?.startsWith('image/')) {
            image = input_image.url;
            var save_path = path.join(assets_path, 'cats', input_image.name);
            const download_image = await fetch(input_image.url);
            const byte_image = await download_image.arrayBuffer();
            fs.writeFileSync(save_path, Buffer.from(byte_image));
            cats.push({
                image: save_path,
                file_name: image.name,
                provider: provider
            });
        } else if (input_link !== '') {
            image = input_link;
            const download_image = await fetch(input_link);
            var file_name = path.basename((new URL(input_link)).pathname);
            var save_path = path.join(assets_path, 'cats', file_name);
            const byte_image = await download_image.arrayBuffer();
            const check = await file_type.fileTypeFromBuffer(byte_image);
            if (check.mime.startsWith('image/')) {
                fs.writeFileSync(save_path, Buffer.from(byte_image));
                cats.push({
                    image: save_path,
                    file_name: file_name,
                    provider: provider
                });
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
                await interaction.editReply({ embeds: [embed] });
                return;
            }

        } else {
            await interaction.editReply({ content: "貓咪呢..." });
            return;
        }
        if (!providers.includes(provider)) providers.push(provider);
        const embed = new EmbedBuilder()
            .setImage(image)
            .setColor("#b3e9ff")
            .setFooter({
                text: `由${provider}提供`,
                iconURL: client.user.avatarURL(),
            })
            .setTimestamp();
        await interaction.editReply({
            content: "這是預覽~",
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    },
    complete: async function (interaction) {
        const focus = interaction.options.getFocused();
        const filtered_provider = providers.filter(provider => provider.startsWith(focus));
        await interaction.respond(filtered_provider.map(provider => ({ name: provider, value: provider })));
    }
};