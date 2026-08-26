const { Client, GatewayIntentBits, Collection } = require('discord.js');
const LLM_interface = require('../implement/LLM/LLM_interface');
const cooldown = require('./cooldown.json');
const bot_assets = require('./bot_assets.json');
const battle_API_config = require('./private-battle_API_config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
/**@type {Collection} */
client.commands = new Collection();
client.cooldown = new Collection();
for (const func of cooldown) {
    client.cooldown.set(func, new Collection());
}
/**@type {LLM_interface} */
client.battle = new LLM_interface(battle_API_config, false, false);
client.is_owner = (id) => { return id === bot_assets.owner; };

module.exports.client = client;