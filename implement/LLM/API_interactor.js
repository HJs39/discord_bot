/**
 * @import {user} from './context';
 * @import {chat_interation} from './chat_interaction';
 * @import {OpenAI} from 'openai';
 */

/**
 * @typedef model_info
 * @property {boolean} stream - wheather this model need to use stream or not
 * @property {string} name - this models name
 * @global
 */
/**
 * @typedef API_config_t
 * @property {string} url - the url to call API
 * @property {string} key - API key
 * @property {number} max_tokens - maximum token that model can response
 * @property {number} [temperature] - temperature setting
 * @property {number} [top_p] - top_p parameter
 * @property {number} [presence_penalty]
 * @property {number} [frequency_penalty]
 * @property {number} rpm - rate limit per minute for this API call
 * @property {number} concurrent_limit - how much request can this API handle at same time
 * @property {object} extra_body - the extra body append in request
 * @property {number} round_robin_quota - number of requests before switching to the next API key
 * @property {boolean} allowed_image - whether this API source allowed image send
 * @property {model_info[]} avalible_model - the list of model information
 * @property {model_info} current_use - default use model id
 * @global
 */

/**
 * @typedef API
 * @property {OpenAI} openai - OpenAI object
 * @property {model_info[]} avalible_model - the list of model id
 * @property {model_info} current_use - default use model id
 * @property {number} max_tokens - maximum token that model can response
 * @property {object} extra_body - the extra body append in request
 * @property {number} rpm - rate limit per minute for this API call
 * @property {number} [temperature] - temperature setting
 * @property {number} [top_p] - top_p parameter
 * @property {number} [presence_penalty]
 * @property {number} [frequency_penalty]
 * @property {number} concurrent_limit - how much request can this API handle at same time
 * @property {number} round_robin_quota - number of requests before switching to the next API key
 * @property {boolean} allowed_image - whether this API source allowed image send
 * from jasonkao402
 * @see {@link https://github.com/jasonkao402/PyDiscordBot/blob/master/cog/llmAgentAPI.py}
 * @global
 */

/**
 * @typedef token_usage_t
 * @property {number} prompt - number of total prompt token usage
 * @property {number} output - number of total output token count
 * @property {number} total - number of total token count
 * @global
 */

/**
 * @typedef API_result
 * @property {string} COT - COT of this chat
 * @property {string} content - content of response that API returned
 * @property {token_usage_t} [token_usage] - see {@link token_usage_t}
 * @property {boolean} failed - whether this request is failed or not
 * @global
 */

/**
 * @typedef image_t
 * @property {string} body - base64 image
 * @property {string} type - the image type(ex:jpeg,png...)
 * @global
 */

const OpenAI = require('openai');
const interaction_processor = require('./interaction_processor');
const _ = require('lodash');


class API_interactor {
    /**@type {Array<API>} */
    #APIs;
    /**@type {number} */
    #current_API_id;
    /**@type {number} */
    #current_quota;
    /**@type {NodeJS.Timeout|undefined} */
    #rpm_timer;
    /**@type {number} */
    #rpm_count;
    /**@type {number} */
    #idel_count;
    /**@type {number} */
    #concurrent_limit;
    /**
     * 
     * @param {API_config_t} API_config API config load from  file
     * @param {boolean} always_fetch_model_list - whether fetch model list automatically when switch API 
     * @param {boolean} [debug] - switch to debug mode
     */
    constructor(API_config, always_fetch_model_list, debug = false) {
        this.#APIs = [];
        for (const  /**@type {API_config_t} */ config of API_config) {
            this.#APIs.push({
                openai: new OpenAI({
                    baseURL: config.url,
                    apiKey: config.key
                }),
                avalible_model: config.avalible_model,
                extra_body: config.extra_body,
                rpm: config.rpm,
                temperature: _.get(config, "temperature") ?? undefined,
                top_p: _.get(config, "top_p") ?? undefined,
                presence_penalty: _.get(config, "presence_penalty") ?? undefined,
                frequency_penalty: _.get(config, "frequency_penalty") ?? undefined,
                concurrent_limit: config.concurrent_limit,
                round_robin_quota: config.round_robin_quota,
                allowed_image: config.allowed_image,
                current_use: config.current_use,
                max_tokens: config.max_tokens
            });
        }
        this.#current_API_id = 0;
        this.#current_quota = 0;
        this.current_rpm = this.#APIs[this.#current_API_id].rpm;
        this.chatting = 0;
        this.#concurrent_limit = this.#APIs[this.#current_API_id].concurrent_limit;
        this.always_fetch_model_list = always_fetch_model_list;
        this.debug = debug;
        this.model_cache = [];
        this.avalible_model_cache = this.#APIs[this.#current_API_id].avalible_model;
        if (always_fetch_model_list) {
            this.#update_model_list();
        }
        this.#rpm_timer = undefined;
        this.#rpm_count = 0;
        this.#idel_count = 0;
    }

    /**
     * get model list from current API
     * @returns {Promise<Array<string[]>>} - list of model from API, empty if catch any error
     */
    async fetch_model_list() {
        const list = [];
        try {
            const api_model_list = await this.#APIs[this.#current_API_id].openai.models.list();
            for await (const model of api_model_list) list.push(model.id);
        } catch {
            return [];
        }
        this.model_cache = list;
        return list;
    }

    async #update_model_list() {
        const list = [];
        try {
            const api_model_list = await this.#APIs[this.#current_API_id].openai.models.list();
            for await (const model of api_model_list) list.push(model.id);
        } catch (error) {
            console.log(`[error]: ${this.#current_API_id} API cannot fetch model list\n  more info:${error.message}`);
            this.model_cache = [];
            return;
        }
        this.model_cache = list;
    }

    /**
     * 
     * @returns {string[]} model list cache
     */
    model_list() {
        return this.model_cache;
    }

    /**
     * 
     * @returns {model_info[]}
     */
    avalible_models() {
        return this.avalible_model_cache;
    }

    #raise_rpm_refresh() {
        if (this.#rpm_timer !== undefined) return;
        this.#rpm_timer = setInterval(() => {
            if (this.#rpm_count === 0) this.#idel_count += 1;
            if (this.#idel_count >= 5) {
                this.#idel_count = 0;
                clearInterval(this.#rpm_timer);
                this.#rpm_timer = undefined;
                return;
            }
            this.#rpm_count = 0;
        }, 60000);
        this.#rpm_timer.unref();
    }

    #update_rpm_refresh() {
        if (this.#rpm_timer !== undefined) clearInterval(this.#rpm_timer);
        this.#idel_count = 0;
        this.#rpm_timer = setInterval(() => {
            if (this.#rpm_count === 0) this.#idel_count += 1;
            if (this.#idel_count >= 5) {
                this.#idel_count = 0;
                clearInterval(this.#rpm_timer);
                this.#rpm_timer = undefined;
                return;
            }
            this.#rpm_count = 0;
        }, 60000);
        this.#rpm_timer.unref();
    }

    #update_api() {
        const id_cache = this.#current_API_id;
        this.#current_API_id = (this.#current_API_id + 1) % this.#APIs.length;
        this.#current_quota = 0;
        if (this.#current_API_id !== id_cache) {
            this.chatting = 0;
            //^^^^^^^^^^^^^^^
            // reset current chatting counter if API is switched to ensure last API chatting
            // would not block current API call
            if (this.always_fetch_model_list) this.#update_model_list();
            else this.model_cache = [];
            this.#update_rpm_refresh();
            this.#rpm_count = 0;
            this.current_rpm = this.#APIs[this.#current_API_id].rpm;
            this.#current_quota = 0;
            this.#concurrent_limit = this.#APIs[this.#current_API_id].concurrent_limit;
            this.avalible_model_cache = this.#APIs[this.#current_API_id].avalible_model;
            return true;
        }
        return false;
    }

    /**
     * 
     * @param {API_config_t} config 
     */
    reload_api_config(config) {
        this.#APIs = [];
        for (const  /**@type {API_config_t} */ config of API_config) {
            this.#APIs.push({
                openai: new OpenAI({
                    baseURL: config.url,
                    apiKey: config.key
                }),
                avalible_model: config.avalible_model,
                extra_body: config.extra_body,
                rpm: config.rpm,
                temperature: _.get(config, "temperature") ?? undefined,
                top_p: _.get(config, "top_p") ?? undefined,
                presence_penalty: _.get(config, "presence_penalty") ?? undefined,
                frequency_penalty: _.get(config, "frequency_penalty") ?? undefined,
                concurrent_limit: config.concurrent_limit,
                round_robin_quota: config.round_robin_quota,
                allowed_image: config.allowed_image,
                current_use: config.current_use,
                max_tokens: config.max_tokens
            });
        }
        this.#current_API_id = 0;
        this.#current_quota = 0;
        this.current_rpm = this.#APIs[this.#current_API_id].rpm;
        this.chatting = 0;
        this.#concurrent_limit = this.#APIs[this.#current_API_id].concurrent_limit;
        this.always_fetch_model_list = always_fetch_model_list;
        this.debug = debug;
        this.model_cache = [];
        this.avalible_model_cache = this.#APIs[this.#current_API_id].avalible_model;
        if (always_fetch_model_list) {
            this.#update_model_list();
        }
        if (this.#rpm_timer !== undefined) clearInterval(this.#rpm_timer);
        this.#rpm_timer = undefined;
        this.#rpm_count = 0;
        this.#idel_count = 0;
    }

    /**
     * call api
     * @param {API} current_use_API - the API that use at current
     * @param {string} name - model name
     * @param {boolean} stream - whether this call use stream mode or not
     * @param {string} system_instruction - personas instruction
     * @param {chat_interaction[]} history - chat history, include summarized memory
     * @param {chat_interaction} lastest - lastest formatted user input
     * @param {image_t} [image] - base64 image from message, undefined if there is no image
     * @returns {Primise<API_result>} - the result responses from API or error message
     */
    async call_api(current_use_API, name, stream, system_instruction, history, lastest, image) {
        this.chatting += 1;
        this.#rpm_count += 1;
        var API_switch = false;
        console.log(`[info]: ${this.debug ? 'debug mode' : 'nomal mode'}`);
        try {
            const message = interaction_processor.combine([
                { "role": "system", "content": system_instruction },
                ...history
            ]).interactions;
            this.#raise_rpm_refresh();
            if (image !== undefined) {
                message.push({
                    "role": "user",
                    "name": lastest.name,
                    "content": [
                        { "type": "text", "text": lastest.content },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/${image.type};base64,${image.body}`,
                                "detail": 'low'
                            }
                        }
                    ]
                });
            } else {
                console.log(`[info]: no image send`);
                message.push(lastest);
            }
            this.#current_quota += 1;
            if (this.#current_quota >= current_use_API.round_robin_quota) {
                console.log(`[info]: switch API`);
                API_switch = this.#update_api();
            }
            if (stream) {
                // handle streaming chat
                if (this.debug) {
                    if (!API_switch) this.chatting -= 1;
                    console.log(`[info]: debug stream request`);
                    console.log(`[info]: request data:\n${JSON.stringify(
                        {
                            model: name,
                            messages: message,
                            max_tokens: current_use_API.max_tokens,
                            temperature: current_use_API.temperature,
                            presence_penalty: current_use_API.presence_penalty,
                            frequency_penalty: current_use_API.frequency_penalty,
                            top_p: current_use_API.top_p,
                            extra_body: current_use_API.extra_body,
                            stream: true
                        },
                        undefined,
                        4
                    )}`);
                    return {
                        COT: '',
                        content: 'debug response from stream chatting',
                        token_usage: {
                            prompt: 0,
                            output: 0,
                            total: 0
                        },
                        failed: false
                    }
                }
                var COT = '';
                var content = '';
                var token_usage = undefined;
                console.log(`[info]: request data:\n${JSON.stringify(
                    {
                        model: name,
                        messages: message,
                        max_tokens: current_use_API.max_tokens,
                        temperature: current_use_API.temperature,
                        presence_penalty: current_use_API.presence_penalty,
                        frequency_penalty: current_use_API.frequency_penalty,
                        top_p: current_use_API.top_p,
                        extra_body: current_use_API.extra_body,
                        stream: true
                    },
                    undefined,
                    4
                )}`);
                const response = await current_use_API.openai.chat.completions.create({
                    model: name,
                    messages: message,
                    max_tokens: current_use_API.max_tokens,
                    temperature: current_use_API.temperature,
                    presence_penalty: current_use_API.presence_penalty,
                    frequency_penalty: current_use_API.frequency_penalty,
                    top_p: current_use_API.top_p,
                    extra_body: current_use_API.extra_body,
                    stream: true
                });
                for await (const chunk of response) {
                    if (_.has(chunk.choices[0], 'delta.reasoning_content') || _.has(chunk.choices[0], 'delta.reasoning')) COT += _.get(chunk.choices[0], 'delta.reasoning_content', null) ?? _.get(chunk.choices[0], 'delta.reasoning_content', null) ?? '';
                    /**@see {@link https://github.com/jasonkao402/PyDiscordBot/blob/master/cog/llmAgentAPI.py#L119} 180,181 */
                    if (_.has(chunk.choices[0], 'delta.content')) content += _.get(chunk.choices[0], 'delta.content', '');
                    if (chunk.usage) token_usage = chunk.usage;
                }
                if (!API_switch) this.chatting -= 1;
                return {
                    COT: COT,
                    content: content,
                    token_usage: {
                        prompt: _.get(token_usage, 'prompt_tokens', 0),
                        output: _.get(token_usage, 'completion_tokens', 0),
                        total: _.get(token_usage, 'total_tokens', 0)
                    },
                    failed: false
                };
            }
            if (this.debug) {
                if (!API_switch) this.chatting -= 1;
                console.log(`[info]: request data:\n${JSON.stringify(
                    {
                        model: name,
                        messages: message,
                        max_tokens: current_use_API.max_tokens,
                        temperature: current_use_API.temperature,
                        presence_penalty: current_use_API.presence_penalty,
                        frequency_penalty: current_use_API.frequency_penalty,
                        top_p: current_use_API.top_p,
                        extra_body: current_use_API.extra_body,
                        stream: false
                    },
                    undefined,
                    4
                )}`);
                return {
                    COT: '',
                    content: 'debug response from normal chatting',
                    token_usage: {
                        prompt: 0,
                        output: 0,
                        total: 0
                    },
                    failed: false
                }
            }
            console.log(`[info]: request data:\n${JSON.stringify(
                {
                    model: name,
                    messages: message,
                    max_tokens: current_use_API.max_tokens,
                    temperature: current_use_API.temperature,
                    presence_penalty: current_use_API.presence_penalty,
                    frequency_penalty: current_use_API.frequency_penalty,
                    top_p: current_use_API.top_p,
                    extra_body: current_use_API.extra_body,
                    stream: false
                },
                undefined,
                4
            )}`);
            const response = await current_use_API.openai.chat.completions.create({
                model: name,
                messages: message,
                max_tokens: current_use_API.max_tokens,
                temperature: current_use_API.temperature,
                presence_penalty: current_use_API.presence_penalty,
                frequency_penalty: current_use_API.frequency_penalty,
                top_p: current_use_API.top_p,
                extra_body: current_use_API.extra_body,
                stream: false
            });
            if (!API_switch) this.chatting -= 1;
            return {
                COT: _.get(response.choices[0], 'message.reasoning_content', null) ?? _.get(response.choices[0], 'message.reasoning_content', null) ?? '',
                /**@see {@link https://github.com/jasonkao402/PyDiscordBot/blob/master/cog/llmAgentAPI.py#L119} 180,181 */
                content: _.get(response.choices[0], 'message.content', ''),
                token_usage: {
                    prompt: _.get(response.usage, 'prompt_tokens', 0),
                    output: _.get(response.usage, 'completion_tokens', 0),
                    total: _.get(response.usage, 'total_tokens', 0)
                },
                failed: false
            };
        } catch (error) {
            if (!API_switch) this.chatting -= 1;
            return {
                COT: '',
                content: error.message,
                token_usage: {},
                failed: true
            };
        }
    }

    /**
     * chat with default model
     * @param {string} system_instruction - personas instruction
     * @param {chat_interaction[]} history - chat history, include summarized memory
     * @param {chat_interaction} lastest - lastest formatted user input
     * @param {image_t} [image] - base64 image from message, undefined if there is no image
     * @returns {Primise<API_result>} - the result responses from API or error message
     */
    async chat(system_instruction, history, lastest, image) {
        const current_API = this.#APIs[this.#current_API_id];
        console.log('[info]: call API');
        return this.call_api(
            current_API,
            current_API.current_use.name,
            current_API.current_use.stream,
            system_instruction,
            history,
            lastest,
            image
        );
    }

    /**
     * chat by select model
     * @param {string} name - specific name of model
     * @param {string} system_instruction - personas instruction
     * @param {chat_interaction[]} history - chat history, include summarized memory
     * @param {chat_interaction} lastest - lastest formatted user input
     * @param {image_t} [image] - base64 image from message, undefined if there is no image
     * @returns {Primise<API_result>} - the result responses from API or error message
     */
    async chat_by_name(name, system_instruction, history, lastest, image) {
        const current_API = this.#APIs[this.#current_API_id];
        const model = current_API.avalible_model.find(model => model.name === name);
        if (model === undefined) {
            return {
                COT: '',
                content: 'unknow model name',
                token_usage: {},
                failed: true
            };
        }
        return this.call_api(
            current_API,
            model.name,
            model.stream,
            system_instruction,
            history,
            lastest,
            image
        );
    }

    select_default_model(name) {
        const current_API = this.#APIs[this.#current_API_id];
        const model = current_API.avalible_model.find(model => model.name === name);
        if (model === undefined) return false;
        current_API.current_use = model;
        return true;
    }

    api_callable() {
        return this.chatting < this.#concurrent_limit && (this.#rpm_count < this.current_rpm);
    }

    current_model() {
        return this.#APIs[this.#current_API_id].current_use;
    }

    /**
     * check this API allowed send image or not
     * @returns {boolean} whether current API allowed send image or not
     */
    allowed_image() {
        return this.#APIs[this.#current_API_id].allowed_image;
    }
}

module.exports = API_interactor;