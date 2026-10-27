const jev_config = require('../../assets/private-jev_config.json');
const _ = require('lodash');

/**
 * @typedef noul_t
 * @property {number} result
 */

/**
 * @typedef choice_t
 * @property {string} result
 * @property {number} confidence
 * @property {Map<string,number>} probabilities
 * @property {number} [none_probability]
 */

/**
 * @typedef score_t
 * @property {number} accumulate
 * @property {number} confidence
 * @property {Map<string,number>} probabilities
 * @property {Map<string,string>} legend
 */

/**
 * @typedef metadata_t
 * @property {number} input
 * @property {number} output
 * @property {string} model
 */

/**
 * @typedef JEV_result_t
 * @property {Map<string,noul_t>} noul
 * @property {Map<string,choice_t>} choice_t
 * @property {Map<string,score_t>} score
 * @property {metadata_t} metadata
 */

let erase_cache_count = 0;

class JEV {
    static async #try_to_earse_kv_cache() {
        erase_cache_count += 1;
        if (_.get(jev_config, 'KV-cache-erase-round') >= erase_cache_count && _.has(jev_config, 'local-host-url')) return;
        const url = _.get(jev_config, 'local-host-url');
        const response = await fetch(url + '/slots', {
            method: 'GET'
        });
        if (!response.ok) return;
        erase_cache_count = 0;
        /**@type {{id:number,n_ctx:number,speculative:boolean,is_processing:boolean}[]} */
        const result = await response.json();
        const slots = result.filter(v => v.id !== 0 && !v.is_processing);
        for (let s of slots) {
            await fetch(url + `/slots/${s.id}?action=erase`, {
                method: 'POST'
            });
        }
        return;
    }

    static async send_request(state, question) {
        let request_data = {
            model: jev_config.model === undefined ? undefined : jev_config.model,
            state: state,
            questions: question
        };
        if (jev_config.addon_param !== undefined) _.assign(request_data, jev_config.addon_param);
        const response = await fetch(jev_config.url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': jev_config.key === undefined ? undefined : `Bearer ${jev_config.key}`
                },
                body: JSON.stringify(request_data)
            }
        );
        if (!response.ok) return undefined;
        const result = await response.json();
        let output = {
            noul: {},
            choice: {},
            score: {},
            metadata: {
                input: result.usage.input_tokens,
                output: result.usage.output_tokens,
                model: result.model
            }
        };

        for (const [k, v] of Object.entries(result.answers)) {
            if (v.type === "choice") {
                _.assign(output.choice, {
                    [k]: {
                        result: v.choice,
                        confidence: v.confidence,
                        probabilities: v.probabilities,
                        none_probability: _.get(v, 'none_probability', undefined)
                    }
                });
            } else if (v.type === "noul") {
                _.assign(output.noul, {
                    [k]: {
                        result: v.noul
                    }
                });
            } else if (v.type === "score") {
                let probabilities = {};
                let legend = {};
                for (const [d, p] of Object.entries(v.legend)) {
                    _.assign(probabilities, { [p]: _.get(v.probabilities, d) });
                    _.assign(legend, { [p]: d });
                }
                _.assign(output.score, {
                    [k]: {
                        accumulate: v.score,
                        confidence: v.confidence,
                        probabilities: probabilities,
                        legend: legend
                    }
                })
            }
        }

        if (_.get(jev_config, 'local-host', false) && _.get(jev_config, 'KV-cache-erase-round', -1) !== -1) await this.#try_to_earse_kv_cache();
        return output;
    }
}

module.exports = JEV;