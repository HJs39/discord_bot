/**
 * @import {snowflake} from './assets'
 * @import {user} from './user_repository'
 */

/**
 * the context message node wrap from discord
 * @class context
 * @property {Date} send_at a date object for moment parse
 * @property {string} assistant_message raw message content from API
 * @property {number} persona_id the owner of this message(for wrap from user "Alice" to persona name)
 * @property {snowflake} user user's information
 * @property {string} user_input formatted user input for summarize
 * @property {boolean} summarized whether this context has been summarized
 * @global
 */
class context {
    /**
     * construct a context
     * @param {Date} send_at a date object for moment parse
     * @param {string} assistant_message raw message content from discord
     * @param {number} persona_id the owner of this message(for wrap from user "Alice" to persona name)
     * @param {snowflake} user user's snowflake(use to search user imformation from user_repository)
     * @param {string} user_input formatted user input for summarize
     */
    constructor(send_at, assistant_message, persona_id, user, user_input) {
        this.send_at = send_at;
        this.assistant_message = assistant_message;
        this.persona_id = persona_id;
        this.user = user;
        this.user_input = user_input;
        this.summarized = false;
    }
}

/**
 * @typedef file_context_node_t
 * @property {string} send_at from Date object
 * @property {string} assistant_message
 * @property {number} persona_id
 * @property {snowflake} user
 * @property {string} user_input
 * @property {boolean} summarized
 * @global
 */

module.exports = context;