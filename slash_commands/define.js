const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const { defined_function } = require('../assets/defined_function.js');
const { shunting_yard } = require('../implement/shunting_yard.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('define')
        .setDescription('add a custom function to "calc" command(everyone can use it)')
        .addStringOption(option => option.setName("function_name")
            .setDescription("the identifier for your function")
            .setRequired(true))
        .addStringOption(option => option.setName('process')
            .setDescription('what will this function actually do when it be called.')
            .setRequired(true))
        .addStringOption(option => option.setName("argument_list")
            .setDescription("a list of argument you can use in this function.(use \",\" to split element)."))
        .addStringOption(option => option.setName("description")
            .setDescription("describe what will your function do")
            .setMaxLength(100)),
    eval: async function (interaction) {
        await interaction.deferReply();
        const function_name = interaction.options.getString('funtion_name');
        const process = interaction.options.getString('process');
        const argument_list = interaction.options.getString('argument_list') ?? "";
        const description = interaction.options.getString("description") ?? "";
        const arguments = argument_list.split(',');
        const channel_name = _.get(interaction, 'channel.name', '未知');
        _.forEach(argument_list, _.trim);
        const embed = new EmbedBuilder();
        try {
            const statement = shunting_yard(process);
            if (_.has(defined_function, `${function_name}.${arguments.length}`)) {
                embed.setTitle("註冊失敗")
                    .setDescription(`以\`${arguments.length}\`個參數呼叫的\`${function_name}\`已經存在`)
                    .setColor("#ff0000")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            } else {
                if (_.has(defined_function, `${function_name}`)) {
                    _.assign(_.get(defined_function, `${function_name}`), {
                        [arguments.length]: {
                            statement: statement,
                            arg_list: arguments,
                            description: description,
                            author: interaction.user.id
                        }
                    });
                } else {
                    _.assign(defined_function, {
                        [function_name]: {
                            [arguments.length]: {
                                statement: statement,
                                arg_list: arguments,
                                description: description,
                                author: interaction.user.id
                            }
                        }
                    });
                }
                embed.setTitle("註冊成功")
                    .setDescription(`以\`${arguments.length}\`個參數呼叫的\`${function_name}\`現在可以在"calc"中使用了!`)
                    .setColor("#b3e9ff")
                    .setFooter({
                        text: `在${channel_name}`,
                        iconURL: client.user.avatarURL(),
                    })
                    .setTimestamp();
            }
        } catch {
            embed.setTitle('錯誤')
                .setDescription(`\`${process}\`解析失敗`)
                .setColor("#ff0000")
                .setFooter({
                    text: `在${channel_name}`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        } finally {
            await interaction.editReply({
                embeds: [embed]
            });
        }
    }
};