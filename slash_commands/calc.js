const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { shunting_yard, execution, IdentifierError, ExecutionError, ParseError, invaildFunctionName, mismatchBarket } = require('../implement/shunting_yard.js');
const { client } = require('../assets/client.js');
const _ = require('lodash');


module.exports = {
    command: new SlashCommandBuilder()
        .setName('calc')
        .setDescription("calculate a math expression")
        .addStringOption(option => option.setName("expression")
            .setDescription("the expression to calculate")
            .setRequired(true))
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the result is ephemeral or not(default is true)')),
    eval: async function (interaction) {
        await interaction.deferReply();
        const embed = new EmbedBuilder();
        const statement = interaction.options.getString('expression');
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        const channel_name = _.get(interaction, 'channel.name', '未知');
        try {
            let result = execution(shunting_yard(statement));
            embed.setTitle("我算出來啦！")
                .setDescription(`\`${statement}\`的答案是\`${result}\`!`)
                .setColor("#b3e9ff")
                .setFooter({
                    text: `在${channel_name}`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        } catch (error) {
            if (error instanceof IdentifierError) {
                embed.setTitle("表達式錯誤")
                    .setDescription(`\`${error.content}\`不能用於頂層\n-# 不可在頂層使用變數`)
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            } else if (error instanceof ExecutionError) {
                embed.setTitle("表達式錯誤")
                    .setDescription(`以${error.arg_count}個參數呼叫的\`${error.content}\`尚未被定義`)
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            } else if (error instanceof ParseError) {
                embed.setTitle("表達式錯誤")
                    .setDescription(`\`${error.content}\`不是一個有效的數字`)
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            } else if (error instanceof invaildFunctionName) {
                embed.setTitle("表達式錯誤")
                    .setDescription(`\`${error.content}\`不能作為函數名稱`)
                    .addFields({
                        name: "詳細說明:",
                        value: `呼叫\`${error.parsed}\`時發現無效標示符\`${error.content}\``,
                        inline: false
                    })
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            } else if (error instanceof mismatchBarket) {
                embed.setTitle("表達式錯誤")
                    .setDescription(`表達式\`${statement}\`的括弧未閉合`)
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            }
            else {
                embed.setTitle("未知錯誤")
                    .setDescription(`等某人修吧`)
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
                console.log(error);
            }
        } finally {
            await interaction.editReply({
                embeds: [embed],
                ephemeral: ephemeral ? MessageFlags.Ephemeral : undefined
            });
        }
    }
}