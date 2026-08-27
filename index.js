const discord = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const message_spliter = require('./implement/massage_spliter');
const { token } = require('./assets/bot_assets.json');
const { client } = require('./assets/client.js');
const bot_assets = require('./assets/bot_assets.json');
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

client.on(discord.Events.ShardDisconnect, (event, id) => {
    console.log(`[Info]: Alice is disconnect from discord!\n  id: ${id}\n  event code: ${event.code}`);
});

process.on('exit', code => {
    console.log(`[Info]: Alice is shutdown by exit program!\n  code: ${code}`);
});

client.login(token);