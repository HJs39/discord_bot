const discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const message_spliter = require('./implement/massage_spliter');
const context = require('./implement/LLM/context');
const placeholder_replacer = require('./implement/placeholder_replacer');
const format_parser = require('./implement/LLM/format_parser');
const response_receiver = require('./implement/LLM/response_reciver');
const { cooldown_helper } = require('./implement/cooldown.js');
const { persona } = require('./implement/LLM/persona');
const { client } = require('./assets/client.js');
const bot_assets = require('./assets/bot_assets.json');
const moment = require('moment');
const _ = require('lodash');

async function try_send_message_to_debug_channel(message) {
    if (client.debug_channel === null) {
        console.log('[error]: mismatch debug channel!');
    } else {
        for (const split_mes of message_spliter.split(message)) {
            if (/^\s/.test(split_mes)) await client.debug_channel.send('.' + split_mes);
            else await client.debug_channel.send(split_mes);
        }
    }
}

async function handle_error(error) {
    if (error instanceof discord.DiscordAPIError) {
        await try_send_message_to_debug_channel(`[${error.code}]: ${error.message}`);
        for (const key of _.keys(error.rawError)) {
            await try_send_message_to_debug_channel(`${key}: ${error.rawError[key]}`);
        }
    } else {
        await try_send_message_to_debug_channel(error.message);
    }
}

async function try_reply(interaction) {
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'This error would be logged and may be fixed later!',
                flags: discord.MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: 'This error would be logged and may be fixed later!',
                flags: discord.MessageFlags.Ephemeral,
            });
        }
    } catch (/**@type {discord.DiscordAPIError} */error) {

        await try_send_message_to_debug_channel('failed to send error message for user!\ncause:\n');
        await handle_error(error);
    }
}


client.once(discord.Events.ClientReady, async (readyClient) => {
    console.log(`Alice is login as ${readyClient.user.tag}!`);
    try {
        const channel = await client.channels.fetch(bot_assets.opening_channel);
        channel.send('愛麗絲睡醒拉!');
        client.user.setStatus('idle');
        client.user.setActivity('正在偷懶...', { type: discord.ActivityType.Playing });
        client.debug_channel = await client.channels.fetch(bot_assets.debug_channel);
    } catch (error) {
        console.log(`[Error]: failed to send opening message\n  Details: ${error}`);
    }
});

{
    const command_folder_path = [path.join(__dirname, 'slash_commands'), path.join(__dirname, 'context_commands')];
    for (const folder_path of command_folder_path) {
        const command_files = fs.readdirSync(folder_path).filter(file => file.endsWith('.js'));
        for (const file of command_files) {
            const file_path = path.join(folder_path, file);
            const command = require(file_path);
            if ('command' in command && 'eval' in command) {
                client.commands.set(command.command.name, command);
            } else {
                console.log(`[Error]: ${file} does not have required property.\n  Full path: ${file_path}\n  required:\n    command: ${'command' in command}\n    eval: ${'eval' in command}\n    content: ${JSON.stringify(command)}`);
            }
        }
    }
}

client.on(discord.Events.InteractionCreate, async (interaction) => {
    if (interaction.isAutocomplete()) {
        //because autocomplete cannot defer, check it first
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.complete(interaction);
        } catch (error) {
            console.log(`[Error]: cannot autocomplete the command "${interaction.commandName}"'s option`);
        }
    } else if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.eval(interaction);
        } catch (error) {
            console.error(error);
            await try_reply(interaction);
            await handle_error(error);
        }
    } else if (interaction.isContextMenuCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.eval(interaction);
        } catch (error) {
            console.error(error);
            await try_reply(interaction);
            await handle_error(error);
        }
    } else if (interaction.isModalSubmit()) {
        const commands = interaction.customId.split(' ');
        if (commands[0] === 'ignore') return;
        const command = interaction.client.commands.get(commands[0]);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.handle_modal(interaction, commands);
        } catch (error) {
            console.error(error);
            await try_reply(interaction);
            await handle_error(error);
        }
    } else if (interaction.isStringSelectMenu()) {
        const commands = interaction.customId.split(' ');
        const command = interaction.client.commands.get(commands[0]);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.handle_select(interaction, commands);
        } catch (error) {
            console.error(error);
            await try_reply(interaction);
            await handle_error(error);
        }
    }
});

client.on(discord.Events.MessageCreate, async (message) => {
    const mention_regex = new RegExp(`<@${client.user.id}>`, 'g');
    if (message.author.bot) return;
    else if (!bot_assets.chatable_channel.includes(message.channel.id)) return;
    else if (!message.mentions.users.has(client.user.id)) return;
    if (!client.chat.user_exist(message.author.id)) {
        await message.reply({
            content: '你還沒有建立個人資料！\n試著用`/create_profile`建立一個新的吧！'
        });
        return;
    }
    /**@type {import('../implement/LLM/user_repository').user} */
    const user = client.chat.get_user(message.author.id);
    /**@type {persona} */
    let used_persona = undefined;
    const placeholder = [];
    const user_send_at = moment(new Date());
    /**@type {import('./implement/LLM/persona_manager.js').filtered_persona_t} */
    let format = undefined;
    if (message.type === discord.MessageType.Reply) {
        const reference = message.reference;
        if (!reference) return;
        let input = '';
        let ref_mes = undefined;

        try {
            ref_mes = await message.fetchReference();
            placeholder.push(['target_message', ref_mes]);
            if (ref_mes.author.id === client.user.id) {
                /**@type {context} */
                const self_send = client.chat.get_message_context(ref_mes.id);
                if (!self_send) return;
                placeholder.push(['target_user', client.chat.get_persona(self_send.persona_id).internal_name]);
            } else if (client.chat.user_exist(ref_mes.author.id)) {
                placeholder.push(['target_user', client.chat.get_user(ref_mes.author.id).internal_name]);
            } else {
                placeholder.push(['target_user', ref_mes.author.displayName]);
            }
        } catch (error) {
            console.error(error);
            await handle_error(error);
            return;
        }

        if (mention_regex.test(message.content)) used_persona = client.chat.get_persona(user.current_use);
        else used_persona = client.chat.get_persona(client.chat.get_message_context(ref_mes.id).persona_id);

        if (!used_persona.used_user.includes(user.snowflake)) used_persona.used_user.push(user.snowflake);
        format = format_parser.parse(used_persona.reply_format);

        for (const time of format.time_macro) {
            placeholder.push([time, user_send_at.format(time)]);
        }
        const content = message.content.replace(/<@(\d+)>/g, (full_match, id) => {
            if (client.chat.user_exist(id)) {
                return `@${client.chat.get_user(id).internal_name}`;
            } else if (id === client.user.id) {
                return `@${used_persona.internal_name}`;
            } else {
                const user = client.users.cache.get(userId);
                if (user) return `@${user.displayName}`;
                else return `@未知使用者`;
            }
        });
        placeholder.push(['message', content]);
        input = new placeholder_replacer(placeholder).replace(format.result);

        /**@type {ArrayBuffer} */
        let image_buffer = undefined;
        /**@type {string} */
        let image_type = undefined;
        if (message.attachments.size > 0 && message.attachments.first().contentType?.startsWith('image/')) {
            const download_image = await fetch(message.attachments.first().url);
            const byte_image = await download_image.arrayBuffer();
            image_buffer = Buffer.from(byte_image);
            image_type = message.attachments.first().contentType.slice(6);
        }
        const typing = setInterval(() => {
            message.channel.sendTyping();
        }, cooldown_helper.from_second(8));
        try {
            /**@type {response_receiver} */
            const receiver = client.chat.chat_oneshot_by_default(
                user.current_use,
                {
                    role: 'user',
                    content: (new placeholder_replacer([['user', user.internal_name]])).replace(input),
                    name: user.name
                },
                image_buffer,
                image_type);

            let result = await receiver.get_result();

            if (result.failed) {
                clearInterval(typing);
                await message.reply({
                    content: `generate failed:\n${result.content}`
                });
            } else {
                clearInterval(typing);
                if (result.content.length > 1800) {
                    for (const split_mes of message_spliter.split(result.content)) {
                        const reply_mes = await message.reply({
                            content: split_mes
                        });
                        client.chat.save_context(
                            reply_mes.id,
                            new context(
                                new Date(),
                                split_mes,
                                user.current_use,
                                user.snowflake,
                                input
                            )
                        );
                        used_persona.memory.raw_short_term.push(reply_mes.id);
                        input = '';
                    }
                } else {
                    const reply_mes = await message.reply({
                        content: result.content
                    });
                    client.chat.save_context(
                        reply_mes.id,
                        new context(
                            new Date(),
                            result.content,
                            user.current_use,
                            user.snowflake,
                            input
                        )
                    );
                    used_persona.memory.raw_short_term.push(reply_mes.id);
                }
                try {
                    const channel = await client.channels.fetch(bot_assets.COT_channel);
                    for (const split_mes of message_spliter.split(result.COT)) {
                        await channel.send(split_mes);
                    }
                } catch (error) {
                    console.log(`[Error]: failed to send response COT\n  Details: ${error}`);
                }
            }
        } catch (error) {
            clearInterval(typing);
            console.error(error);
            await handle_error(error);
        }
    } else {
        used_persona = client.chat.get_persona(user.current_use);

        if (!used_persona.used_user.includes(user.snowflake)) used_persona.used_user.push(user.snowflake);

        format = format_parser.parse(used_persona.format);

        for (const time of format.time_macro) {
            placeholder.push([time, user_send_at.format(time)]);
        }
        const content = message.content.replace(/<@(\d+)>/g, (full_match, id) => {
            if (client.chat.user_exist(id)) {
                return `@${client.chat.get_user(id).internal_name}`;
            } else if (id === client.user.id) {
                return `@${used_persona.internal_name}`;
            } else {
                const user = client.users.cache.get(userId);
                if (user) return `@${user.displayName}`;
                else return `@未知使用者`;
            }
        });
        placeholder.push(['message', content]);
        input = new placeholder_replacer(placeholder).replace(format.result);

        /**@type {ArrayBuffer} */
        let image_buffer = undefined;
        /**@type {string} */
        let image_type = undefined;
        if (message.attachments.size > 0 && message.attachments.first().contentType?.startsWith('image/')) {
            const download_image = await fetch(message.attachments.first().url);
            const byte_image = await download_image.arrayBuffer();
            image_buffer = Buffer.from(byte_image);
            image_type = message.attachments.first().contentType.slice(6);
        }

        const typing = setInterval(() => {
            message.channel.sendTyping();
        }, cooldown_helper.from_second(8));
        try {
            /**@type {response_receiver} */
            const receiver = client.chat.chat_oneshot_by_default(
                user.current_use,
                {
                    role: 'user',
                    content: (new placeholder_replacer([['user', user.internal_name]])).replace(input),
                    name: user.name
                },
                image_buffer,
                image_type);

            let result = await receiver.get_result();

            if (result.failed) {
                clearInterval(typing);
                await message.reply({
                    content: `generate failed:\n${result.content}`
                });
            } else {
                clearInterval(typing);
                if (result.content.length > 1800) {
                    for (const split_mes of message_spliter.split(result.content)) {
                        const reply_mes = await message.reply({
                            content: split_mes
                        });
                        client.chat.save_context(
                            reply_mes.id,
                            new context(
                                new Date(),
                                split_mes,
                                user.current_use,
                                user.snowflake,
                                input
                            )
                        );
                        used_persona.memory.raw_short_term.push(reply_mes.id);
                        input = '';
                    }
                } else {
                    const reply_mes = await message.reply({
                        content: result.content
                    });
                    client.chat.save_context(
                        reply_mes.id,
                        new context(
                            new Date(),
                            result.content,
                            user.current_use,
                            user.snowflake,
                            input
                        )
                    );
                    used_persona.memory.raw_short_term.push(reply_mes.id);
                }
                try {
                    const channel = await client.channels.fetch(bot_assets.COT_channel);
                    for (const split_mes of message_spliter.split(result.COT)) {
                        await channel.send(split_mes);
                    }
                } catch (error) {
                    console.log(`[Error]: failed to send response COT\n  Details: ${error}`);
                }
            }
        } catch (error) {
            clearInterval(typing);
            console.error(error);
            await handle_error(error);
        }
    }
});

client.on(discord.Events.ShardDisconnect, (event, id) => {
    console.log(`[Info]: Alice is disconnect from discord!\n  id: ${id}\n  event code: ${event.code}`);
});

process.on('exit', code => {
    console.log(`[Info]: Alice is shutdown by exit program!\n  code: ${code}`);
});

client.login(bot_assets.token);