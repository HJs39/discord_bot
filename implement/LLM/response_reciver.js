const { timer } = require('./assets');
const API_interactor = require('./API_interactor');

class response_receiver {

    /**@type {import('./API_interactor').API_result|undefined} */
    #result;
    /**@type {NodeJS.Timeout} */
    #request;
    /**@type {boolean} */
    #generate;

    /**
     * 
     * @param {API_interactor} API 
     * @param {string} system_instruction 
     * @param {chat_interaction[]} history 
     * @param {chat_interaction} lastest 
     * @param {import('./API_interactor').image_t} image 
     * @param {string} name 
     */
    constructor(API, system_instruction, history, lastest, image = undefined, name = undefined) {
        console.log(`[info]: construct receiver`);
        this.#result = undefined;
        this.#generate = false;
        this.#request = setInterval(() => {
            console.log(`[info]: in request loop`);
            if (API.api_callable()) {
                console.log('[info]: send request to API');
                if (name !== undefined) this.#result = API.chat_by_name(name, system_instruction, history, lastest, image);
                else this.#result = API.chat(system_instruction, history, lastest, image);
                this.#generate = true;
                clearInterval(this.#request);
            }
        }, 10000);
    }

    async get_result() {
        if (!this.#generate) await timer.wait_until(() => this.#generate);
        return this.#result;
    }

    is_generating() {
        return this.#generate && this.#request !== undefined;
    }
}

module.exports = response_receiver;