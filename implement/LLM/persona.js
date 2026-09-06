/**
 * @import {snowflake} from './assets'
 */

const z = require('zod');

/**
 * @readonly
 * @enum {'system'|'public'|'private'}
 */
const type_t = Object.freeze({
    system: 'system',
    public: 'public',
    private: 'private'
});

/**
 * @class persona_memory
 * @property {number} short_term_max the maximum count of raw chat message send to AI(include)
 * @property {number} summarize_start_index the minimum index of raw chat message send to AI when summary
 * @property {snowflake[]} raw_short_term array of snowflake that map to assistant's response message
 * @property {string[]} summarized summarized memory
 */
class persona_memory {
    /**
     * construct and init a persona memory object
     * @param {number} short_term_max set the maximum count of raw chat message send to AI
     * @param {number} summarize_start_index set the minimum index of raw chat message send to AI when summary
     */
    constructor(short_term_max, summarize_start_index) {
        this.short_term_max = short_term_max;
        this.summarize_start_index = summarize_start_index;
        this.raw_short_term = new Array();
        this.summarized = new Array();
    }

    /**
     * append a new message for this persona
     * @param {snowflake} snowflake 
     */
    append_new_raw(snowflake) {
        this.raw_short_term.push(snowflake);
    }

    erase_top_raw() {
        this.raw_short_term.pop();
    }

    append_new_summarized(summarized) {
        this.summarized.push(summarized);
    }

    erase_top_summarized() {
        this.summarized.pop();
    }
}

/**
 * @class persona
 * @property {string} display_name - this persona's display name, used in user's select list and list command
 * @property {string} internal_name - this persona's internal name, used in macro and reference
 * @property {string} identity_name - this persona's name used in "name" parameter in request message
 * @property {type_t} type - current stats of this persona
 * @property {snowflake} author - who create this persona
 * @property {boolean} deprecated - wether this persona is deprecated or not
 * @property {string} persona - AI's current persona setting
 * @property {string} profile - like user's profile, used when reference to a persona send message
 * @property {string} format - format of user input at normal style(mention with no reply)
 * @property {string} reply_format - format of user input at reply style(mention with reply, reply to bot in specific channel)
 * @property {string} user_format how to format user profile when process prompt
 * @property {chat_interaction[]} phony_chat - fake chat history for prompt injection
 * @property {chat_interaction[]} summarize_instruction - fake chat history for prompt injection in summarize mode, include placeholder
 * @property {snowflake} used_user - which user in repository has used this persona
 * @property {persona_memory} memory - persona's memory, see {@link persona_memory}
 * @global
 */
class persona {
    /**
     * deprecated default always false
     * @param {string} display_name this persona's display name, used in user's select list and list command
     * @param {string} internal_name this persona's internal name, used in macro and reference
     * @param {string} identity_name this persona's name used in "name" parameter in request message
     * @param {type_t} type current stats of this persona
     * @param {snowflake} author who create this persona
     * @param {string} persona AI's persona setting
     * @param {string} profile - like user's profile, used when reference to a persona send message
     * @param {string} format format of user input at normal style(mention with no reply)
     * @param {string} reply_format format of user input at reply style(mention with reply, reply to bot in specific channel)
     * @param {string} user_format how to format user profile when process prompt
     * @param {chat_interaction[]} phony_chat fake chat history for prompt injection
     * @param {chat_interaction[]} summarize_instruction fake chat history for prompt injection in summarize mode, include placeholder
     * @param {persona_memory} memory persona's memory, see {@link persona_memory}
     */
    constructor(display_name, internal_name, identity_name, type, author, persona, profile, format, reply_format, user_format, phony_chat, summarize_instruction, memory) {
        this.display_name = display_name;
        this.internal_name = internal_name;
        this.identity_name = identity_name;
        this.type = type;
        this.author = author;
        this.deprecated = false;
        this.persona = persona;
        this.profile = profile;
        this.format = format;
        this.reply_format = reply_format;
        this.user_format = user_format;
        this.phony_chat = phony_chat;
        this.summarize_instruction = summarize_instruction;
        this.used_user = new Array(author);
        this.memory = memory
    }
}

const import_persona_t = z.object({
    display_name: z.string().max(64),
    internal_name: z.string().max(64),
    identity_name: z.string().max(64).refine(s => /^[a-zA-Z0-9_-]+$/.test(s)),
    type: z.enum(['system', 'private', 'public']).transform(t => t === 'system' ? 'private' : t),
    author: z.string(),
    deprecated: z.boolean().prefault(false),
    persona: z.string(),
    profile: z.string().prefault(''),
    format: z.string().prefault('${message}'),
    reply_format: z.string().prefault('${message}'),
    user_format: z.string(),
    phony_chat: z.array(
        z.object({
            role: z.enum(['placeholder', 'assistant', 'user']),
            content: z.string(),
            name: z.string().optional()
        })
    ),
    summarize_instruction: z.array(
        z.object({
            role: z.enum(['assistant', 'user', 'placeholder']),
            content: z.string(),
            name: z.string().optional()
        })
    ).superRefine((resource, ctx) => {
        const sub = resource.filter(r => r.role === 'placeholder');
        if (sub.length !== 1) return ctx.addIssue('invaild number of placeholder');
    }),
    used_user: z.array(z.string()).prefault([]),
    memory: z.object({
        short_term_max: z.int().prefault(10),
        summarize_start_index: z.int().prefault(10),
        raw_short_term: z.array(z.string()),
        summarized: z.array(z.string())
    })
});

module.exports = {
    persona,
    persona_memory,
    type_t,
    import_persona_t
};