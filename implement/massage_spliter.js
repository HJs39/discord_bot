
class message_spliter {

    /**
     * 
     * @param {string} message 
     * @returns {string[]} a array of message
     */
    static split(message) {
        if (message.length < 1800) return [message];
        const messages = [];
        for (var i = 0; i < message.length;) {
            messages.push(message.slice(i, i + 1800));
            i += 1800;
        }
        return messages;
    }
}

module.exports = message_spliter;