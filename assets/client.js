const { Client, GatewayIntentBits, Collection } = require('discord.js');
const cooldown = require('./cooldown.json');
const bot_assets = require('./bot_assets.json');
const LLM_interface = require('../implement/LLM/LLM_interface');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
/**@type {Collection} */
client.commands = new Collection();
client.cooldown = new Collection();
for (const func of cooldown) {
    client.cooldown.set(func, new Collection());
}
/**@type {LLM_interface} */
client.LLM = new LLM_interface(false, true);
client.is_owner = (id) => { return id === bot_assets.owner; };

module.exports.client = client;