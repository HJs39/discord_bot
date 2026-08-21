const { client } = require('../assets/client.js');


class cooldown {
    /**
     * check the command cooldown is passed or not
     * @param {string} command command name to search the cooldown
     * @param {string} user user's id
     * @param {number} current current timestamp(millisecond)
     * @param {number} duration cooldown duration(millsecond)
     * @returns {boolean} true if cooldown already passed or not exit, false for it is still cooldown
     */
    static check(command, user, current, duration) {
        if (!client.cooldown.get(command).has(user)) return true;
        return (current - client.cooldown.get(command).get(user)) >= duration;
    }
    /**
     * set new cooldown to user
     * @param {string} command command name for this setting
     * @param {string} user user's id
     * @param {number} current current timestamp(millisecond)
     */
    static set(command, user, current) {
        client.cooldown.get(command).set(user, current);
    }
    /**
     * transform the millisecond from second(for readable)
     * @param {number} second 
     * @returns {number} the millisecond of the "second"
     */
    static from_second(second) {
        return second * 1000;
    }
}

module.exports.cooldown_helper = cooldown;