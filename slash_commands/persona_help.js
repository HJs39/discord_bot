const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { colors } = require('../assets/embed_color.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('persona_help')
        .setDescription('get information of create a persona')
        .addBooleanOption(option => option.setName('ephemeral')
            .setDescription('select the information would be ephemeral or not(defualt is false)')),
    eval: async function (interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral');
        const embed = new EmbedBuilder()
            .setTitle("persona撰寫說明")
            .setDescription("也可以在想要直接寫json檔時參照這個說明。\n-# 我覺得我寫high了，實在是加太多功能了...")
            .addFields(
                {
                    name: "display_name與internal_name",
                    value: "- display_name: 在`/list_persona`命令中使用的名稱，這著名稱只用來辨別persona的差異，AI不會讀到這個。\n- internal_name: 實際使用的名稱，也應該是AI自我認知的名稱，在你回覆Alice發送的其他訊息時會被用到，詳見`reply_format`欄位。",
                    inline: false
                },
                {
                    name: "type",
                    value: "當前這個persona的狀態，主要有以下三種：\n- `public`: 其他使用者能看見、能使用，但沒有編輯權。\n- `private`: 只有你自己能看見。\n- `system`: 系統默認，只能透過後台更改(json檔填這個會被改為`private`)",
                    inline: false
                },
                {
                    name: "deprecated",
                    value: "當前這個persona是否被棄用了，即對persona使用`/delete_persona`指令後的狀態。\n當處於`true`時其他人創建新的persona就會直接取代掉被棄用的persona的位置。\n在persona被取代前隨時可以用`/undo_delete`取消棄用(給你一個後悔藥)。",
                    inline: false
                },
                {
                    name: "persona",
                    value: "這個persona的主要設定，上限4000字。\n會用`system`的`role`注入到聊天開頭。\n\n可用宏:\n- `${user}`: 會被取代為格式化過的user設定，詳見`user_format`欄位。",
                    inline: false
                },
                {
                    name: "format",
                    value: "向系統說明當使用者使用persona聊天時應該怎麼處理使用者的訊息。\n\n使用時機:\n- 機器人被提及(mention)時。\n\n註: mention優先即高於reply，所以才有兩個格式化的差異，如果你不在意的話也可以兩個用一樣的格式，實際上並不影響。\n\n可用宏:\n- `${user}`: 發送訊息的使用者的暱稱(用`/create_profile`或`/edit_profile`設定的那個)。\n-  `${time:[code]}`: 以`[code]`進行格式化的訊息發送時間。注意！**`time:`前綴是必要的！`[code]`才是你要改的地方！**支援的代碼可以參照[這個](https://momentjs.cn/docs/#/parsing/string-format/)(對，我是用moment做的)。\n- `${message}`: 訊息的內容。",
                    inline: false
                },
                {
                    name: "reply_format",
                    value: "向系統說明當使用者使用persona聊天時應該怎麼處理使用者的訊息。\n\n使用時機:\n- 機器人在特定頻道被回覆時。\n\n註: mention優先即高於reply，所以才有兩個格式化的差異，如果你不在意的話也可以兩個用一樣的格式，實際上並不影響。\n\n可用宏:\n- `${user}`: 發送訊息的使用者的暱稱(用`/create_profile`或`/edit_profile`設定的那個)。\n-  `${time:[code]}`: 以`[code]`進行格式化的訊息發送時間。注意！**`time:`前綴是必要的！`[code]`才是你要改的地方！**支援的代碼可以參照[這個](https://momentjs.cn/docs/#/parsing/string-format/)(對，我是用moment做的)。\n- `${message}`: 訊息的內容。\n- `${target_user}`: 被回覆的對象的暱稱，如果對象是這個機器人就會改為發送出那個訊息的persona的internal_name。\n- `${target_message}`: 被回覆的對象的訊息內容",
                    inline: false
                },
                {
                    name: "user_format",
                    value: "向系統說明如何處理使用者的profile資料。\n\n註： 處理完後會取代掉放在`persona`的`${user}`宏。\n\n可用宏:\n- `${name}`: 使用者的暱稱。\n- `${description}`: 使用者的自我描述",
                    inline: false
                },
                {
                    name: "phony_chat",
                    value: "偽造的聊天紀錄，會在聊天紀錄不足時被套用，但不會在用`/memo`指令時被總結。\n始終是一個`user`配一個`assistant`(你用連續的`user`或連續的`assistant`可能會有預期外的結果，建議別用)。\n如果你要寫json請記住，**這是一個Array。**\n\n欄位說明:\n- `role`: 只能是`user`或`assistant`，用來表示這個訊息是誰發出的。\n- `name`: 只有在`role`為`user`時才填，應該填入使用者名稱(username)。\n- `content`: 訊息的內容。",
                    inline: false
                },
                {
                    name: "summarize_instruction",
                    value: "在使用`/memo`指令時的偽造對話。\n如果你要寫json請記住，**這是一個Array。**\n\n欄位說明: 與`phony_chat`一致。\n\n特殊欄位說明: `summarize_instruction`中必須有個`role`為`placeholder`的欄位，這個欄位的`content`與`name`都不重要，系統只要讀到這個欄位就會開始注入尚未被總結的對話紀錄。",
                    inline: false
                },
                {
                    name: "used_user",
                    value: "就是有使用過這個persona的使用者的discord id，不用管這個。",
                    inline: false
                },
                {
                    name: "memory",
                    value: "用來記錄persona記憶相關的設定的欄位。\n\n欄位說明:\n- `short_term_max`: 每次對話系統要抓取的對話歷史數量，一次抓一組`user`+`assistant`的訊息。\n- `summarize_start_index`: 使用`/memo`指令時從哪裡開始抓紀錄，小於這個數字的對話不會被丟給AI總結。\n- `raw_message_snowflake`: 系統內部的用來索引訊息的辨識符，亂刪會導致記缺失，亂填也沒用。\n- `summarized`: 已經被總結的記憶會放在這，使用`/bonk`指令刪除的就是這個。**注意！如果使用`/bonk`指令刪除記憶並不會讓被總結的對話回歸未總結狀態，那些資料會永遠遺失！**",
                    inline: false
                },
            )
            .setColor(colors.normal)
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            flags: ephemeral ? MessageFlags.Ephemeral : undefined
        });
    }
}