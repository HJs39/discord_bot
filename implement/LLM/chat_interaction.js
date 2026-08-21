/**
 * @typedef chat_interaction
 * @property {string} role - the role of this message
 * @property {string} content - the message content
 * @property {string} [name] - users internal name or personas identity name
 * @global
 */

/**
 * different from the implement of jasonkao402
 * "chat_interaction" is just a node of full message, not the pair of interaction
 * @example
 * {
 *     "role": "assistant",
 *     "content": "{{response}}",
 *     "name": "{{user_internal_name}}"
 * }
 */