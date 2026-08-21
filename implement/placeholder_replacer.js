class placeholder_replacer {
    /**@type {Map<string,string>} */
    #dictionary;

    /**
     * construct a replacer
     * @param {Map<string,string>|Array<Array<string>>} placeholders 
     */
    constructor(placeholders = [[]]) {
        this.#dictionary = new Map(placeholders);
    }

    /**
     * 
     * @param {string} source 
     */
    replace(source) {
        return source.replace(/\\?(?!\\)\$\{(.*?)\}/g, (full_match, identity) => {
            if (full_match.startsWith('\\')) return full_match.slice(1);
            else if (this.#dictionary.has(identity)) return this.#dictionary.get(identity);
            else return full_match;
        });
    }
}

module.exports = placeholder_replacer;