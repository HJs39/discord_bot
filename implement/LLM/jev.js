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
 * @property {Map<string,number>} result
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

class JEV {
    static async send_request(stats, question) {
        const jev_url = 'http://127.0.0.1:8017/v1/systemone';
        let request_data = {
            state: stats,
            questions: question
        };
        const response = await fetch(jev_url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }
        );
        if (!response.ok) return undefined;
        const result = await response.json();
        let output = {
            noul: new Map(),
            choice: new Map(),
            score: new Map(),
            metadata: {
                input: result.usage.input_tokens,
                output: result.usage.output_tokens,
                model: result.model
            }
        };

        for (const [k, v] of Object.entries(result.answers)) {
            if (v.type === "choice") {
                output.choice.set(k, {
                    result: v.choice,
                    confidence: v.confidence,
                    probabilities: v.probabilities,
                    none_probability: _.get(v, 'none_probability', undefined)
                });
            } else if (v.type === "noul") {
                output.noul.set(k, {
                    result: v.noul
                });
            } else if (v.type === "score") {
                let probabilities = new Map();
                for (const p of v.legend) probabilities.set(p, _.get(v.probabilities, p));

                output.score.set(k, {
                    accumulate: v.score,
                    confidence: v.confidence,
                    probabilities: probabilities
                });
            }
        }
        return output;
    }
}

module.exports = JEV;