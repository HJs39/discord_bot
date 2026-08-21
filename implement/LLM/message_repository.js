/**
 * @import {snowflake} from './assets'
 */

const path = require('path');
const fs = require('fs');
const { context } = require('./context');
const { assets_path } = require('./assets');

/**
 * @class message_repository
 * @property {Map<snowflake,context>} repository - base container of messages
 */
class message_repository {

    /**
     * 
     * @param {[snowflake,import('./context').file_context_node_t][]} resource 
     */
    constructor(resource) {
        for (let node of resource) {
            node[1].send_at = new Date(node[1].send_at);
        }
        /**
        * @type {Map<snowflake,context>}
        */
        this.repository = new Map(resource);
    }

    /**
     * check the message by messages snowflake
     * @param {snowflake} snowflake - messages snowflake
     * @returns {boolean} whether the message is send form bot
     */
    include(snowflake) {
        return this.repository.has(snowflake);
    }

    /**
     * get message from repository by snowflake
     * @param {snowflake} snowflake - messages snowflake
     * @returns {context} message
     */
    get(snowflake) {
        return this.repository.get(snowflake);
    }

    /**
     * get message by multiple snowflake
     * @param {snowflake[]} snowflakes - a list of messages snowflake
     * @returns {context[]} snowflakes correspond messages
     */
    fetch(snowflakes) {
        let result = [];
        for (const snowflake of snowflakes) {
            result.push(this.repository.get(snowflake));
        }
        return result;
    }

    push(snowflake, context) {
        this.repository.set(snowflake, context);
    }

    /**
     * save current message to files
     */
    save() {
        fs.writeFileSync(path.join(assets_path, 'message_repository.json'), JSON.stringify([...this.repository]), 'utf-8');
    }
}

module.exports = message_repository;