/**
 * @typedef parsed_format_t
 * @property {string} result
 * @property {Array<string>} normal_macro
 * @property {Array<string>} time_macro
 * @global
 */

class format_parser {
    /**
     * 
     * @param {string} format 
     * @returns {parsed_format_t}
     */
    static parse(format) {
        /**@type {Array<string>} */
        const normal_macro = new Array();
        /**@type {Array<string>} */
        const time_macro = new Array();
        const result = format.replace(/\\?(?!\\)\$\{(.*?)\}/g, (full_match, identity) => {
            if (full_match.startsWith('\\')) return full_match;
            if (identity.startsWith('time:')) {
                const time = identity.slice(6);
                time_macro.push(time);
                return `\${${time}}`;
            } else {
                normal_macro.push(identity);
                return full_match;
            }
        });
        return {
            result: result,
            normal_macro: normal_macro,
            time_macro: time_macro
        };
    }
}

module.exports = format_parser;