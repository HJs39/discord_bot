/**
 * just an alias of assets folder
 * this file will include anything that LLM component and export it
 * to ensure all component would not reference out of this folder by themselves
 */

/**@import {API_config_t} from './API_interactor' */

/**@type {API_config_t} */
const API_config = require('../../assets/API_config.json');
const { assets_path } = require('../../assets/assets_path');
const message_spliter = require('../massage_spliter.js');
const timer = require('../timer');
const placeholder_replacer = require('../placeholder_replacer');

/**
 * @typedef {string} snowflake
 * @see {@link https://discord.js.org/docs/packages/discord.js/main/Snowflake:TypeAlias}
 * @global
 */

module.exports = {
    API_config: API_config,
    assets_path: assets_path,
    message_spliter: message_spliter,
    timer: timer,
    placeholder_replacer: placeholder_replacer,
};