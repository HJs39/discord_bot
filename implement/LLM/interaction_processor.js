/**@import {chat_interaction} from './chat_interaction' */
const { roleMention } = require('discord.js');
const context = require('./context');
const user_repository = require('./user_repository');

class interaction_processor {
    /**
     * combine the same role
     * 
     * Note:
     * 
     *  the content in each {@link interactions} should be formatted
     * @param {chat_interaction[]} interactions 
     * @returns {{interactions:chat_interaction[],is_user:boolean}} 
     * a object include an array of interaction already combined adjacent same role and
     * a boolean represent the same role is user or not
     */
    static combine(interactions) {
        if (interactions.length === 0) return { interactions: [], is_user: false };
        /**@type {Array<chat_interaction>} */
        const result = [];
        /**@type {chat_interaction} */
        var current = undefined;
        /**@type {boolean} */
        var is_user = false;
        for (const interaction of interactions) {
            if (current === undefined) {
                current = interaction;
            } else if (current.role === interaction.role) {
                current.content += `\n\n${interaction.content}`;
                /**
                 * like:
                 * Alice send at YYYY/MM/DD HH:mm:ss:
                 * **something**
                 * 
                 * 
                 * User send at YYYY/MM/DD HH:mm:ss:
                 * **something**
                 * 
                 * or
                 * 
                 * Alice send at YYYY/MM/DD HH:mm:ss:
                 * **something**
                 * 
                 * 
                 * [[User reply the message of Alice send at YYYY/MM/DD HH:mm:ss]]
                 * User send at YYYY/MM/DD HH:mm:ss :
                 * **something**
                 */
                if (current.role === 'user') is_user = true;
            } else {
                result.push(current);
                current = interaction;
            }
        }
        if (current !== undefined) result.push(current);
        return { interactions: result, is_user: is_user };
    }

    /**
     * convert context object to chat interaction object
     * @param {user_repository} repository 
     * @param {context[]} contexts 
     * @returns {chat_interaction[]}
     */
    static flat_context(repository, contexts) {
        /**@type {chat_interaction[]} */
        let result = new Array();
        for (const c of contexts) {
            result.push({
                role: 'assistant',
                content: c.assistant_message
            });
            result.push({
                role: 'user',
                name: repository.get(c.user).internal_name,
                content: c.user_input
            });
        }
        return result;
    }
    // Ok, it is necessary
}

module.exports = interaction_processor;