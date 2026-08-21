const { REST, Routes, SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const { clientId, test_server_guildId, token } = require('./assets/bot_assets.json');
const fs = require('node:fs');
const path = require('node:path');

const global_command_list = [];
const global_command_name_list = [];
const test_server_command_list = [];
const test_command_name_list = [];

const test_command_filter_list = ['battle_white_list'];

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

{
    const command_folder_path = [path.join(__dirname, 'slash_commands'), path.join(__dirname, 'context_commands')];
    for (const folder_path of command_folder_path) {
        const command_files = fs.readdirSync(folder_path).filter(file => file.endsWith('.js'));
        for (const file of command_files) {
            const file_path = path.join(folder_path, file);
            const command = require(file_path);
            if ('command' in command) {
                if (test_command_filter_list.includes(command.command.name)) {
                    test_server_command_list.push(command.command.toJSON());
                    test_command_name_list.push(command.command.name);
                } else {
                    global_command_list.push(command.command.toJSON());
                    global_command_name_list.push(command.command.name);
                }
            } else {
                console.log(`[Error]: ${file} does not have required property "command".\n  Full path: ${file_path}`);
            }
        }
    }
    test_server_command_list.push(...global_command_list);
}

// and deploy your commands!
(async () => {
    try {
        // The put method is used to fully refresh all commands in the guild with the current set
        const test_server_commands = await rest.put(Routes.applicationGuildCommands(clientId, test_server_guildId), { body: test_server_command_list });
        const global_commands = await rest.put(Routes.applicationCommands(clientId), { body: global_command_list });

        console.log(`[Info]: Successfully register ${test_server_commands.length} of application commands to test server!`);
        console.log('  additional application command list:');
        for (const command_name of test_command_name_list) console.log(`    ${command_name}`);
        console.log(`[Info]: Successfully register ${global_commands.length} of application commands to global!`);
        console.log('  application command list:');
        for (const command_name of global_command_name_list) console.log(`    ${command_name}`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();