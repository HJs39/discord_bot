const API_interactor = require("./API_interactor");
const response_receiver = require('./response_reciver');
const interaction_processor = require('./interaction_processor');
const persona_manager = require('./persona_manager');
const message_repository = require('./message_repository');
const user_repository = require('./user_repository');
const _ = require('lodash');
const logged_messages = require('../../assets/message_repository.json');
const logged_user = require('../../assets/user_repository.json');
const { persona, type_t } = require("./persona");
const { placeholder_replacer } = require("./assets");

class memory_error extends Error {
    constructor(name, message) {
        super(message);
        this.name = name;
    }
}

class LLM_interface {

    /**@type {API_interactor} */
    #API_interactor;
    /**@type {persona_manager} */
    #personas;
    /**@type {message_repository} */
    #messages;
    /**@type {user_repository} */
    #users;
    /**
     * 
     * @param {boolean} always_fetch_model_list whether fetch model list automatically when switch API 
     * @param {boolean} [debug] switch to debug mode
     */
    constructor(always_fetch_model_list, debug = false) {
        this.#API_interactor = new API_interactor(always_fetch_model_list, debug);
        this.#messages = new message_repository(logged_messages);
        this.#users = new user_repository(logged_user);
        this.#personas = new persona_manager();
    }

    //#region chat
    /**
     * start a chat with a created persona
     * @param {number} id persona's internal id
     * @param {chat_interaction} lastest lastest user input
     * @param {ArrayBuffer} image an {@link ArrayBuffer} of image
     * @param {string} image_type images MIME type
     * @returns {response_receiver} response receiver
     */
    chat_oneshot_by_default(id, lastest, image, image_type) {
        let persona = this.#personas.get(id);
        let user_info = '';
        for (const user of this.#users.fetch(persona.used_user)) {
            let replacer = new placeholder_replacer([
                ['name', user.internal_name],
                ['description', user.description]
            ]);
            user_info += replacer.replace(persona.user_format);
        }
        let system_instruction = new placeholder_replacer([['user', user_info]]).replace(persona.persona);

        /**@type {chat_interaction[]} */
        let history = new Array();
        if (persona.memory.raw_short_term.length < persona.memory.short_term_max) {
            if (persona.phony_chat.length !== 0) {
                history.push(_.takeRight(persona.phony_chat, persona.memory.short_term_max - persona.memory.raw_short_term.length));
            }
            history.push(interaction_processor.flat_context(this.#messages.fetch(persona.memory.raw_short_term)));
        } else {
            history.push(interaction_processor.flat_context(this.#messages.fetch(_.takeRight(persona.memory.raw_short_term, persona.memory.short_term_max))));
        }

        /**@type {import("./API_interactor").image_t} */
        var useable_image = {};
        if (image !== undefined && image_type !== undefined) {
            _.assign(
                useable_image,
                { body: Buffer.from(image).toString('base64') },
                { type: image_type.slice(image_type.indexOf('/') + 1) }
            );
        } else {
            useable_image = undefined;
        }
        return new response_receiver(
            this.#API_interactor,
            system_instruction,
            history,
            lastest,
            useable_image
        );
    }

    /**
     * use specific model to start a chat with created persona
     * @param {string} name model name
     * @param {number} id persona's internal id
     * @param {chat_interaction} lastest lastest user input
     * @param {ArrayBuffer} image an {@link ArrayBuffer} of image
     * @param {string} image_type images MIME type
     * @returns {response_receiver} response receiver
     */
    chat_oneshot_by_specific(name, id, lastest, image, image_type) {
        let persona = this.#personas.get(id);
        let user_info = '';
        for (const user of this.#users.fetch(persona.used_user)) {
            let replacer = new placeholder_replacer([
                ['name', user.internal_name],
                ['description', user.description]
            ]);
            user_info += replacer.replace(persona.user_format);
        }
        let system_instruction = new placeholder_replacer([['user', user_info]]).replace(persona.persona);

        /**@type {chat_interaction[]} */
        let history = new Array();
        if (persona.memory.raw_short_term.length < persona.memory.short_term_max) {
            if (persona.phony_chat.length !== 0) {
                history.push(_.takeRight(persona.phony_chat, persona.memory.short_term_max - persona.memory.raw_short_term.length));
            }
            history.push(interaction_processor.flat_context(this.#messages.fetch(persona.memory.raw_short_term)));
        } else {
            history.push(interaction_processor.flat_context(this.#messages.fetch(_.takeRight(persona.memory.raw_short_term, persona.memory.short_term_max))));
        }

        /**@type {import("./API_interactor").image_t} */
        var useable_image = {};
        if (image !== undefined && image_type !== undefined) {
            _.assign(
                useable_image,
                { body: Buffer.from(image).toString('base64') },
                { type: image_type.slice(image_type.indexOf('/') + 1) }
            );
        } else {
            useable_image = undefined;
        }
        return new response_receiver(
            this.#API_interactor,
            persona.persona,
            history,
            lastest,
            useable_image,
            name
        );
    }

    /**
     * start a chat by customize persona setting and history
     * @param {string|chat_interaction[]} system_instruction 
     * 
     * persona setting
     * 
     * can use an array of {@link chat_interaction} or string
     * 
     * require whole role are "system"
     * @param {chat_interaction[]} history {@link chat_interaction} array of chat history 
     * @param {chat_interaction} lastest lastest input(always assume it send by user)
     * @param {ArrayBuffer} image an {@link ArrayBuffer} of image
     * @param {string} image_type images MIME type
     * @returns {response_receiver} response receiver
     */
    chat_oneshot_customize_by_default(system_instruction, history, lastest, image = undefined, image_type = undefined) {
        var system = '';
        console.log('[info]: start prepare chat data');
        if (Array.isArray(system_instruction)) system = interaction_processor.combine(system_instruction).interactions[0].content;
        else system = system_instruction;
        console.log('[info]: complete process system_instruction');
        var useable_history = interaction_processor.combine(history).interactions;
        console.log(`[info]: complete combine history\n  ${JSON.stringify(useable_history, undefined, 4)}`);
        /**@type {import("./API_interactor").image_t} */
        var useable_image = {};
        if (image !== undefined && image_type !== undefined) {
            _.assign(
                useable_image,
                { body: Buffer.from(image).toString('base64') },
                { type: image_type.slice(image_type.indexOf('/') + 1) }
            );
        } else {
            useable_image = undefined;
        }
        console.log('[info]: complete process image');
        return new response_receiver(
            this.#API_interactor,
            system,
            useable_history,
            lastest,
            useable_image
        );
    }

    /**
     * switch default use model
     * @param {string} model_id model name
     * @returns {boolean} whether switch is seccessful
     */
    select_default_model(model_id) {
        return this.#API_interactor.select_default_model(model_id);
    }

    /**
     * 
     * @returns {string[]} 
     */
    get_model_list_cache() {
        return this.#API_interactor.model_list();
    }

    /**
     * 
     * @returns {Promise<string[]>} list from API
     */
    async update_model_list() {
        return this.#API_interactor.fetch_model_list();
    }
    //#endregion

    /**
     * get persona by id
     * @param {number} id 
     * @returns {persona}
     */
    get_persona(id) {
        return this.#personas.get(id);
    }

    get_persona_list_by_author(author) {
        return this.#personas.filter_by_author(author);
    }

    get_list_user_seeable(snowflake) {
        const list = this.#personas.persona_list();
        list.push(this.#personas.delete_persona());
        return list.filter((p) => p.author === snowflake || p.type === type_t.public || p.type === type_t.default);
    }

    deprecated_persona(persona_id) {
        return this.#personas.delete_persona(persona_id);
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
        this.#personas.create_persona(
            id,
            display_name,
            internal_name,
            type,
            author,
            persona_instruction,
            format,
            reply_format,
            phony_chat,
            user_format,
            summarize_instruction,
            memory
        );
    }

    edit_persona(id, display_name, internal_name, persona_instruction, format, reply_format, user_format, phony_chat, summarize_instruction, short_term_max, summarize_start_index) {
        if (!this.#personas.has(id)) throw new memory_error('persona_not_exit', 'cannot edit a not exist persona');
        else if (this.#personas.has_deprecated(id)) throw new memory_error('persona_has_been_deprecated', 'cannot edit a deprecated persona');
        let persona = this.#personas.get(id);
        persona.display_name = display_name || persona.display_name;
        persona.internal_name = internal_name || persona.internal_name;
        persona.persona = persona_instruction || persona.persona;
        persona.format = format || persona.format;
        persona.reply_format = reply_format || persona.reply_format;
        persona.user_format = user_format || persona.user_format;
        persona.phony_chat = phony_chat || persona.phony_chat;
        persona.summarize_instruction = summarize_instruction || persona.summarize_instruction;
        persona.memory.short_term_max = short_term_max || persona.memory.short_term_max;
        persona.memory.summarize_start_index = summarize_start_index || persona.memory.summarize_start_index;
    }

    export_persona(id){
        if (!this.#personas.has(id)) throw new memory_error('persona_not_exit', 'cannot export a not exist persona');
        let persona=this.#personas.get(id);
        return {
            name: persona.display_name,
            json: JSON.stringify(persona)
        };
    }

    /**
     * summarize memory for persona
     * @param {number} persona_id persona's internal id
     * @returns {response_receiver} response receiver
     */
    summarize(persona_id) {
        if (!this.#personas.has(persona_id)) throw new memory_error('persona_not_exit', 'try to summarize momory with a not exist persona');
        else if (this.#personas.has_deprecated(persona_id)) throw new memory_error('persona_has_been_deprecated', 'try to summarize memory with deprecated persona');
        let persona = this.#personas.get(persona_id);
        let orignal_memory = persona.memory.summarized.at(-1) ?? '';

        let user_info = '';
        for (const user of this.#users.fetch(persona.used_user)) {
            let replacer = new placeholder_replacer([
                ['name', user.internal_name],
                ['description', user.description]
            ]);
            user_info += replacer.replace(persona.user_format);
        }
        let system_instruction = new placeholder_replacer([['user', user_info]]).replace(persona.persona);

        /**@type {chat_interaction[]} */
        let history = new Array();
        for (const instruction of persona.summarize_instruction) {
            if (instruction.role !== 'placeholder') history.push(instruction);
            else history.push(interaction_processor.flat_context(this.#messages.fetch(snowflake).filter(/**@type {context} */context => !context.summarized)));
        }
        let lastest = history.pop();
        return new response_receiver(
            this.#API_interactor,
            system_instruction,
            history,
            lastest
        );
    }

}

module.exports = LLM_interface;