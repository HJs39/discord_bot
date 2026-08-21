const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { client } = require('../assets/client.js');
const { defined_function } = require('../assets/defined_function.js');
const { shunting_yard } = require('./calc.js');
const _ = require('lodash');

module.exports = {
    command: new SlashCommandBuilder()
        .setName("calc_help")
        .setDescription("get information about \"calc\" command")
        .addBooleanOption(option => option.setName("custom_function")
            .setDescription("whether the result is about custom function or not")),
    eval: async function (interaction) {
        const custom_func = interaction.options.getBoolean("custom_function") ?? false;
        const embed = new EmbedBuilder();
        if (custom_func) {
            embed.setTitle("某人還沒做完")
                .setDescription("敬請期待")
                .setColor("#b3e9ff")
                .setFooter({
                    text: `在${_.get(interaction, 'channel.name', '未知')}`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        } else {
            embed.setTitle("命令說明")
                .setDescription("- `/calc`: 執行數學運算，允許使用任何內建的或被`/define`定義的函數\n算式應保證:\n1. 括弧完整閉合\n2. 不包含識別符\n\n- `/define`: 定義一個可被`/calc`調用的函數\n  - `function_name`: 必填，此參數為函數的名稱。此參數將作為函數在`/calc`命令或`process`參數內被呼叫時的識別符。\n  - `process`: 必填，此參數為函數的行為，應為一個滿足`/calc`命令要求的數學算式，但可用`argument_list`參數中定義的參數。\n  - `argument_list`: 選填，此函數的參數列表，使用`,`分割，在函數執行時列表內的識別符將被替換為實際值。\n  - `descrition`: 選填，用於在`/calc_help`中說明此函數的用途，上限100字。")
                .addFields(
                    {
                        name: "運算子",
                        value: "- `a+b`: 返回a與b相加後的值\n- `+a`: 返回a的絕對值\n- `a-b`: 返回a減去b後的值\n- `-a`: 返回a的負值\n- `a*b`: 返回a與b相乘後的值\n- `a/b`: 返回a除以b後的值\n- `a%b`: 返回a取b的模\n- `a^b`: 返回a的b次方的值\n- `!a`: 返回a階乘的值",
                        inline: false
                    },
                    {
                        name: "內建函數",
                        value: "- `abs(a)`: 返回a的絕對值\n- `cbrt(a)`: 返回a的立方根\n- `ceil(a)`: 返回a向上取整後的值\n- `cos(a)`: 返回以a弧度的cos值\n- `cosh(a)`: 返回a的雙曲餘弦值\n- `exp(a)`: 返回自然對數的a次方的值\n- `floor(a)`: 返回a向下取整後的值\n- `log(a)`: 返回以自然對數為底的a的對數\n- `log(a,b)`: 返回以a為底的b的對數\n- `log2(a)`: 返回以2為底的a的對數\n- `log10(a)`: 返回以10為底的a的對數\n- `neg(a)`: 若a為正，返回a的負值;若a為負，返回a\n- `pow(a,b)`: 返回a的b次方\n- `round(a)`: 返回a小數點後被四捨五入後的值\n- `sin(a)`: 返回以a弧度的sin值\n- `sinh(a)`: 返回a的雙曲正弦值\n- `sqrt(a)`: 返回a的平方根\n- `tan(a)`: 返回a弧度的tan值\n- `tanh(a)`: 返回a的雙曲正切值\n- `trunc(a)`: 返回a的整數部分",
                        inline: false
                    },
                ).setColor("#b3e9ff")
                .setFooter({
                    text: `在${_.get(interaction, 'channel.name', '未知')}`,
                    iconURL: client.user.avatarURL(),
                })
                .setTimestamp();
        }
        await interaction.reply({ embeds: [embed] });
    }
}