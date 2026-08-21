const path = require('node:path');
const fs = require('node:fs');
const { persona, type_t } = require('./persona');
const { assets_path } = require('./assets');

/**
 * @class persona_error
 * same as {@link Error}, just a alias
 */
class persona_error extends Error {
    constructor(message) {
        super(message);
    }
}

/**
 * @typedef filtered_persona_t
 * @property {number} id index in orignal array
 * @property {persona} persona {@link persona} object
 */

/**
 * @class persona_manager
 * to manage the personas
 */
class persona_manager {
    /**@type {persona[]} */
    #personas;
    constructor() {
        this.#personas = require(path.join(assets_path, 'personas'));
    }

    /**
     * search a useable persona id to put new persona
     * @returns {number} a deprecated persona's id or the index after last in current array
     */
    search_useable_id() {
        const id = this.#personas.findIndex((p) => !p.deprecated);
        if (id === -1) return this.#personas.length
        else return id;
    }

    /**
     * set a persona to deprecated state
     * @param {number} id the identity of the persona
     */
    delete_persona(id) {
        if (this.#personas[id].type === type_t.default) throw new persona_error('cannot deprecate system provide persona');
        this.#personas[id].deprecated = true;
    }
    /**
     * undo the action of delete persona(if the persona has not been covered)
     * @param {number} id the identity of the persona
     */
    undo_delete(id) {
        if (this.#personas[id].deprecated) this.#personas[id].deprecated = false;
    }

    /**
     * create a persona by id
     * @param {number} id the identity of the persona
     * @param {string} display_name this persona's display name, used in user's select list and list command
     * @param {string} internal_name this persona's internal name, used in request message
     * @param {type_t} type current stats of this persona
     * @param {snowflake} author - who create this persona
     * @param {string} persona_instruction AI's persona setting
     * @param {string} format format of user input at normal style(mention with no reply)
     * @param {string} reply_format format of user input at reply style(mention with reply, reply to bot in specific channel)
     * @param {string} user_format how to format user profile when process prompt
     * @param {chat_interaction[]} phony_chat fake chat history for prompt injection
     * @param {chat_interaction[]} summarize_instruction fake chat history for prompt injection in summarize mode, include placeholder
     * @param {persona_memory} memory persona's memory, see {@link persona_memory}
     */
    create_persona(id, display_name, internal_name, type, author, persona_instruction, format, reply_format, user_format, phony_chat, summarize_instruction, memory) {
        if (id === this.#personas.length) {
            this.#personas.push(new persona(
                display_name,
                internal_name,
                type,
                author,
                persona_instruction,
                format,
                reply_format,
                user_format,
                phony_chat,
                summarize_instruction,
                memory
            ));
        } else {
            let persona = this.#personas[id];
            persona.display_name = display_name;
            persona.internal_name = internal_name;
            persona.type = type;
            persona.author = author;
            persona.persona = persona_instruction;
            persona.format = format;
            persona.reply_format = reply_format;
            persona.phony_chat = phony_chat;
            persona.summarize_instruction = summarize_instruction;
            persona.memory = memory;
        }
    }

    /**
     * save all current persona setting to assets immediately
     */
    save() {
        fs.writeFileSync(path.join(assets_path, 'personas.json'), JSON.stringify(this.#personas), 'utf-8');
    }

    /**
     * get the list of deprecated personas
     * @returns {filtered_persona_t[]} a list of deprecated personas
     */
    deprecated_persona_list() {
        let result = new Array();
        return this.#personas.forEach((p, index) => {
            if (p.deprecated) result.push({
                id: index,
                persona: persona
            });
        });
    }

    /**
     * get the list of NOT deprecated personas
     * @returns {persona[]} a list of useable personas
     */
    persona_list() {
        let result = new Array();
        return this.#personas.forEach((p, index) => {
            if (!p.deprecated) result.push({
                id: index,
                persona: persona
            });
        });
    }

    /**
     * filter by snowflake
     * @param {import('./assets').snowflake} author author's discord user snowflake
     * @returns {filtered_persona_t[]}
     */
    filter_by_author(author) {
        let result = new Array();
        return this.#personas.forEach((p, index) => {
            if (p.author === author) result.push({
                id: index,
                persona: persona
            });
        });
    }

    /**
     * check this persona is exit
     * @param {number} id persona's internal id
     * @returns {boolean}
     */
    has(id) {
        return this.#personas.length > id;
    }

    /**check this persona has been deprecated or not
     * check whether a persona is exit
     * @param {number} id persona's internal id
     * @returns 
     */
    has_deprecated(id) {
        return this.#personas[id].deprecated;
    }

    /**
     * get persona by id
     * @param {number} id persona id
     * @returns {persona}
     */
    get(id) {
        return this.#personas[id];
    }
}

module.exports = persona_manager;