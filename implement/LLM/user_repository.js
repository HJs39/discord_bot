/**
 * @import {User} from 'discord.js'
 * @import {snowflake} from './assets'
 */
/**
 * @typedef user
 * @property {string} name this user's username, same as {@link User.username}
 * @property {string} internal_name this user's internal name(set by user or this user's username same as {@link user.name})
 * @property {string} description this user's self description
 * @property {number} current_use current used persona id
 * @global
 */

/**
 * @class user_repository
 * @property {Map<snowflake,user>} repository
 */
class user_repository {

    /**
     * init repository
     * @param {[snowflake,user][]} source 
     */
    constructor(source) {
        this.repository = new Map(source);
    }

    /**
     * check the user by discord snowflake
     * @param {snowflake} snowflake 
     * @returns {boolean} whether this user is exit in repository
     */
    is_exit(snowflake) {
        return this.repository.has(snowflake);
    }

    /**
     * add a user into repository
     * @param {snowflake} snowflake 
     * @param {string} user_name 
     * @param {string} internal_name 
     * @param {string} description 
     */
    add(snowflake, user_name, internal_name, description) {
        this.repository.set(snowflake, {
            name: name,
            internal_name: internal_name,
            description: description
        });
    }

    /**
     * get user by discord snowflake
     * @param {snowflake} snowflake 
     * @returns {user} user object
     */
    get(snowflake) {
        return this.repository.get(snowflake);
    }

    /**
     * get user information by multiple snowflake
     * @param {snowflake[]} snowflakes 
     * @returns {user[]}
     */
    fetch(snowflakes) {
        let result = [];
        for (const snowflake of snowflakes) {
            result.push(this.repository.get(snowflake));
        }
        return result;
    }

    /**
     * save current user information to files
     */
    save() {
        fs.writeFileSync(path.join(assets_path, 'user_repository.json'), JSON.stringify([...this.repository]), 'utf-8');
    }
}

module.exports = user_repository;