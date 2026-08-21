const { Collection } = require('discord.js');
const { defined_function } = require('../assets/defined_function.js');
const _ = require('lodash');

const operator = ['+', '-', '*', '/', '%', '^', '!'];

/**
 * check the character is a letter or not
 * @param {string} char a character to check
 * @returns {boolean} true if it is a lowercase or uppercase letter, false for otherwise
 */
function is_letter(char) {
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * check the character is a number or not
 * @param {string} char a character to check
 * @returns {boolean} true if "char" is a ASCII number character, false for otherwise
 */
function is_number(char) {
    const code = char.charCodeAt(0);
    return (code >= 48 && code <= 57);
}

const is_dot = char => char === '.';
const is_dash = char => char === '_';
const is_arg_separator = char => char === ',';
const is_bracket = char => char === '(' || char === ')';
const is_right_combine = char => char === '!' || char === '^';
const may_swtich_negative = char => char === '+' || char === '-';
const is_vaild_function_name = char => is_letter(char) || is_number(char) || is_dash(char);
const is_white_space = char => (/\s/).test(char);
const is_all_num = str => !Number.isNaN(Number(str));
const is_operator = char => operator.includes(char);

/**
 * an identifier enumeration
 * @readonly
 * @enum {string}
 */
const stats = Object.freeze({
    number: 'number',
    function: 'function',
    identifier: 'identifier',
    operator: 'operator',
    switch_negative: 'switch_negative',
    right_bracket: 'right_bracket',
    left_bracket: 'left_bracket'
});

/**
 * get the rank from operator
 * @param {string} char the operator(must be a single character)
 * @returns {number} the rank of the operator
 */
function rank_op(char) {
    switch (char) {
        case '^':
            return 5;
        case '!':
            return 4;
        case '*':
        case '/':
        case '%':
            return 3;
        case '+':
        case '-':
            return 2;
        default:
            return 0;
    }
}

/**
 * get how much argument the operator need
 * @param {string} char an operator
 * @returns {number} the number of the argument count the operator required
 */
function operator_arg(char) {
    switch (char) {
        case '^':
        case '*':
        case '/':
        case '%':
        case '+':
        case '-':
            return 2;
        case '!':
            return 1;
        case '(':
        case ')':
            return 0;
        default:
            return undefined;
    }
}

class Stack {
    /**
     * 
     * @param {Array} array an array the Stack internal use to contain the elements
     */
    constructor(array) {
        this.items = array;
    }
    pop() {
        return this.items.pop();
    }
    push(element) {
        return this.items.push(element);
    }
    peek() {
        return this.items[this.items.length - 1];
    }
    is_empty() {
        return this.items.length == 0;
    }
}

/**
 * the base object in the array "shunting_yard" function return
 * @class shunting_yard_obj
 * @property {stats} type the type of this element is
 * @property {string} content a string wrapped by "shunting_yard" function
 * @property {number} [argument_count] the required number of the function or the operator
 * @property {string[]} [argument_list] the argument list when "shunting_yard" function analysis a function, it just use to count the "argument_list"
 * @global
 */
class shunting_yard_obj {
    /**
     * @constructor
     * @param {stats} Type the type of this element
     * @param {string} Content the raw string after process
     * @param {number} [Argument_count] the required number of argument to call this method
     * @param {string[]} [Arg_list] the argument list of function call
     */
    constructor(Type, Content, Argument_count, Arg_list) {
        this.type = Type;
        this.content = Content;
        this.argument_count = Argument_count;
        this.argument_list = Arg_list;
    }
}

/**
 * @class invaildFunctionName
 * @extends Error
 * @property {string} parsed the content already be parsed
 * @property {string} content the character which raised this error
 */
class invaildFunctionName extends Error {
    constructor(message, parsed, content) {
        super(message);
        this.parsed = parsed;
        this.content = content;
    }
}

/**
 * @class mismatchBarket
 * @extends Error
 */
class mismatchBarket extends Error {
    constructor(message) {
        super(message);
    }
}

/**
 * parse an Infix notation to Reverse Polish notation by shunting yard algorithm
 * @param {string} statement the Infix notation string
 * @returns {shunting_yard_obj[]} the Reverse Polish notation array
 * @throws {invaildFunctionName} throw when a "." appeared in an identifer
 * @throws {mismatchBarket} throw when mismatch left or right bracket
 */
function shunting_yard(statement) {
    const operator_stack = new Stack(new Array());
    const output_stack = new Stack(new Array());
    const argument_list = new Array();
    const add_additional_arg_list = new Array();
    var full_content = '';
    var function_call = 0;
    var is_function = false;
    // ^^^
    // check by function argument list
    // on the other hand, it means we need to start analysis argument list
    var may_be_function = false;
    var add_additional_arg = false;
    var is_identifier = false;
    var is_first = true;
    var last_char = '';
    for (const c of statement) {
        if (may_be_function) {
            // is a vaild function name, but have not read the argument list.
            if (is_white_space(c)) {
                // white space, threat it as a identifier, not a function call.
                may_be_function = false;
                // is identifier and it is complete readed(split by white space)
                output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                full_content = '';
                is_first = true;
                continue;
            } else if (c === '(') {
                // read argument list, and threat it as a function call.
                // "a(b*c)" won't be threat as "a*(b*c)" like it in math
                is_function = true;
                function_call += 1;
                may_be_function = false;
                operator_stack.push(new shunting_yard_obj(stats.function, full_content, 0, new Array()));
                // 0 is a placeholder, the argument count that function need would be 
                // analysis later
                operator_stack.push(new shunting_yard_obj(stats.left_bracket, c, operator_arg(c)));
                // in "calc" command, pass a function as argument is invaild
                // the cause is that I'm too lazy to implement it
                argument_list.push(new Array());
                full_content = '';
                last_char = c;
                is_first = true;
                continue;
            } else if (c === ')') {
                // because pass a function as argument is invaild
                // we can assume it is a identifier
                may_be_function = false;
                output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                while (!operator_stack.is_empty() && operator_stack.peek().content !== '(') {
                    output_stack.push(operator_stack.pop());
                }
                if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                operator_stack.pop();
                // discard left bracket
                full_content = '';
                last_char = c;
                is_first = true;
                continue;
            } else if (is_vaild_function_name(c)) {
                full_content += c;
                continue;
            } else if (is_operator(c)) {
                output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                last_char = c;
                is_first = true;
                full_content = '';
                continue;
            } else {
                // invaild input such as "." in function name, not ascii, etc.
                throw new invaildFunctionName('Analysis a unknow identifier', full_content, c);
            }
            // may function
        } else if (is_function) {
            if (is_identifier) {
                // if it is already be marked as identifier, it won't be first
                if (is_white_space(c)) {
                    output_stack.push(new shunting_yard_obj(stats.identifier, full_content));

                    full_content = '';
                    is_identifier = false;
                    is_first = true;
                    continue;
                } else if (c === ',') {
                    // split argument list
                    // "," after left bracket with no identifier is vaild
                    var add_arg_list = false;
                    if (full_content.length !== 0) {
                        if (is_all_num(full_content)) {
                            output_stack.push(new shunting_yard_obj(stats.number, full_content));
                        } else {
                            output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                        } add_arg_list = true;
                    }
                    while (!operator_stack.is_empty() && operator_stack.peek().content !== '(') {
                        output_stack.push(operator_stack.pop());
                        add_arg_list = true;
                    }
                    if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                    // argument list is not over, do not discard left bracket
                    if (add_arg_list) {
                        argument_list[function_call - 1].push(full_content);
                    }
                    full_content = '';
                    last_char = c;
                    is_identifier = false;
                    add_additional_arg = false;
                    is_first = true;
                    continue;
                } else if (c === '(') {
                    // function call in a function argument list
                    // add an arugment list
                    operator_stack.push(new shunting_yard_obj(stats.function, full_content, 0, new Array()));
                    operator_stack.push(new shunting_yard_obj(stats.left_bracket, c));
                    argument_list.push(new Array());
                    add_additional_arg_list.push(add_additional_arg);
                    add_additional_arg = false;
                    function_call += 1;
                    full_content = '';
                    last_char = c;
                    is_first = true;
                    is_identifier = false;
                    continue;

                } else if (is_operator(c)) {
                    // because "calc" command not have two character operator
                    // so we don't need to process it at this scope
                    if (may_swtich_negative(c) &&
                        (is_operator(last_char) ||
                            last_char === '(' ||
                            last_char === ',')) {
                        operator_stack.push(new shunting_yard_obj(stats.switch_negative, c, 1));
                        continue;
                    }
                    if (full_content.length != 0) {
                        output_stack.push(new shunting_yard_obj(stats.number, full_content));
                        full_content = '';
                    }
                    while (!operator_stack.is_empty() &&
                        (operator_stack.peek().type == stats.switch_negative ||
                            (!is_right_combine(c) && rank_op(c) <= rank_op(operator_stack.peek().content)) ||
                            (is_right_combine(c) && rank_op(c) < rank_op(operator_stack.peek().content)))) {
                        output_stack.push(operator_stack.pop());
                    }
                    operator_stack.push(new shunting_yard_obj(stats.operator, c, operator_arg(c)));
                    last_char = c;
                    is_first = true;
                    continue;
                } else if (c === ')') {
                    // end of argument list
                    var add_arg_list = false;
                    if (full_content.length !== 0) {
                        if (is_all_num(full_content)) {
                            output_stack.push(new shunting_yard_obj(stats.number, full_content));
                        } else {
                            output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                        } add_arg_list = true;
                    }
                    while (!operator_stack.is_empty() && operator_stack.peek().content !== '(') {
                        add_additional_arg = false;
                        output_stack.push(operator_stack.pop());
                    }
                    if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                    operator_stack.pop();
                    // discard left bracket
                    if (operator_stack.peek().type == stats.function) {
                        if (add_arg_list) {
                            argument_list[function_call - 1].push(full_content);
                            full_content = '';
                        }
                        if (add_additional_arg) {
                            argument_list[function_call - 1].push('placeholder');
                        }
                        var cache = operator_stack.pop();
                        cache.argument_list = argument_list.pop();
                        cache.argument_count = cache.argument_list.length;
                        function_call -= 1;
                        output_stack.push(cache);
                    }
                    if (function_call == 0) {
                        is_function = false;
                    } else {
                        add_additional_arg = add_additional_arg_list.pop();
                    }
                    full_content = '';
                    last_char = c;
                    is_identifier = false;
                    continue;
                } else {
                    full_content += c;
                    last_char = c;
                    continue;
                }
            } else {
                if (is_first) {
                    if (is_white_space(c)) continue;
                    if (is_operator(c)) {
                        if (may_swtich_negative(c) &&
                            (is_operator(last_char) ||
                                last_char === '(' ||
                                last_char === ',')) {
                            operator_stack.push(new shunting_yard_obj(stats.switch_negative, c, 1));
                            continue;
                        }
                        if (full_content.length != 0) {
                            output_stack.push(new shunting_yard_obj(stats.number, full_content));
                            full_content = '';
                        }
                        while (!operator_stack.is_empty() &&
                            (operator_stack.peek().type == stats.switch_negative ||
                                (!is_right_combine(c) && rank_op(c) <= rank_op(operator_stack.peek().content)) ||
                                (is_right_combine(c) && rank_op(c) < rank_op(operator_stack.peek().content)))) {
                            output_stack.push(operator_stack.pop());
                        }
                        operator_stack.push(new shunting_yard_obj(stats.operator, c, operator_arg(c)));
                        last_char = c;
                        continue;
                    } else if (is_bracket(c)) {
                        if (c === '(') {
                            operator_stack.push(new shunting_yard_obj(stats.left_bracket, c));
                            last_char = c;
                            continue;
                        } else {
                            while (!operator_stack.is_empty() && operator_stack.peek().content !== '(') {
                                add_additional_arg = false;
                                output_stack.push(operator_stack.pop());
                            }
                            if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                            operator_stack.pop();
                            // discard left bracket
                            if (operator_stack.peek().type == stats.function) {
                                // find a function tag after discard a left bracket
                                // so it must be the end of arugment list
                                if (add_arg_list) {
                                    argument_list[function_call - 1].push(full_content);
                                    full_content = '';
                                }
                                if (add_additional_arg) {
                                    argument_list[function_call - 1].push('placeholder');
                                }
                                var cache = operator_stack.pop();
                                cache.argument_list = argument_list.pop();
                                cache.argument_count = cache.argument_list.length;
                                function_call -= 1;
                                output_stack.push(cache);
                            }
                            if (full_content.length != 0) full_content = '';
                            // if not find function tag, it must be a calculate statement
                            if (function_call == 0) {
                                is_function = false;
                            } else {
                                add_additional_arg = add_additional_arg_list.pop();
                            }
                            last_char = c;
                            continue;
                        }
                    } else {
                        is_first = false;
                        full_content += c;
                        if (!is_number(c) && !is_dot(c)) is_identifier = true;
                        last_char = c;
                        continue;
                    }
                } else {
                    // it not first and not identifier, so it must be a float, int or ','
                    if (is_white_space(c)) {
                        // split number
                        if (is_dot(full_content.at(-1))) throw new ParseError('invaild number when analysis', full_content);
                        output_stack.push(new shunting_yard_obj(stats.number, full_content + c));
                        // although it is number, we still pass string into output
                        // will use Number to parse the number
                        full_content = '';
                        is_first = true;
                        continue;
                    } else if (c === ',') {
                        // split argument list
                        // "," after left bracket with no identifier is vaild
                        var add_arg_list = false;
                        if (full_content.length !== 0) {
                            if (is_all_num(full_content)) {
                                output_stack.push(new shunting_yard_obj(stats.number, full_content));
                            } else {
                                output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                            } add_arg_list = true;
                        }
                        while (!operator_stack.is_empty() && operator_stack.peek().content !== '(') {
                            output_stack.push(operator_stack.pop());
                            add_arg_list = true;
                        }
                        if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                        // argument list is not over, do not discard left bracket
                        if (add_arg_list) {
                            argument_list[function_call - 1].push(full_content);
                        }
                        full_content = '';
                        last_char = c;
                        is_first = true;
                        continue;
                    } else if (is_operator(c)) {
                        if (may_swtich_negative(c) &&
                            (is_operator(last_char) ||
                                last_char === '(' ||
                                last_char === ',')) {
                            operator_stack.push(new shunting_yard_obj(stats.switch_negative, c, 1));
                            continue;
                        }
                        if (full_content.length != 0) {
                            output_stack.push(new shunting_yard_obj(stats.number, full_content));
                            full_content = '';
                        }
                        while (!operator_stack.is_empty() &&
                            (operator_stack.peek().type == stats.switch_negative ||
                                (!is_right_combine(c) && rank_op(c) <= rank_op(operator_stack.peek().content)) ||
                                (is_right_combine(c) && rank_op(c) < rank_op(operator_stack.peek().content)))) {
                            output_stack.push(operator_stack.pop());
                        }
                        operator_stack.push(new shunting_yard_obj(stats.operator, c, operator_arg(c)));
                        last_char = c;
                        continue;
                    } else if (is_bracket(c)) {
                        if (c === '(') {
                            // not identifier(not start with letter) and trail with left bracket
                            // throw error
                            throw new invaildFunctionName("unknow statement", full_content, c);
                        } else {
                            var add_arg_list = false;
                            if (full_content.length !== 0) {
                                if (is_all_num(full_content)) {
                                    output_stack.push(new shunting_yard_obj(stats.number, full_content));
                                } else {
                                    output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
                                }
                                add_arg_list = true;
                            }
                            while (!operator_stack.is_empty() && operator_stack.peek().content !== '(') {
                                add_additional_arg = false;
                                output_stack.push(operator_stack.pop());
                            }
                            if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                            operator_stack.pop();
                            // discard left bracket
                            if (operator_stack.peek().type == stats.function) {
                                // find a function tag after discard a left bracket
                                // so it must be the end of arugment list
                                if (add_arg_list) {
                                    argument_list[function_call - 1].push(full_content);
                                    full_content = '';
                                }
                                if (add_additional_arg) {
                                    argument_list[function_call - 1].push('placeholder');
                                }
                                var cache = operator_stack.pop();
                                cache.argument_list = argument_list.pop();
                                cache.argument_count = cache.argument_list.length;
                                function_call -= 1;
                                output_stack.push(cache);
                            }
                            if (full_content.length != 0) full_content = '';
                            // if not find function tag, it must be a calculate statement
                            if (function_call == 0) {
                                is_function = false;
                                add_additional_arg = false;
                            } else {
                                add_additional_arg = add_additional_arg_list.pop();
                            }
                            last_char = c;
                            is_first = true;
                            continue;
                        }
                    }
                    // letter is allowed, we can use pass a parameter like "0xff", "0b1011"
                    // although the parameter like "0xf.f" is passed at this moment
                    // it will throw an error when actually execute
                    // so we don't need to throw it at now
                    full_content += c;
                    last_char = c;
                    is_first = false;
                    continue;
                }
            }
            //is function
        } else if (is_operator(c) || is_bracket(c)) {
            // because "calc" command not have two character operator
            // so we don't need to process it at this scope
            if (c === '(') {
                if (full_content.length != 0) output_stack.push(new shunting_yard_obj(stats.number, full_content));
                // ^^^
                // we can assume it is number
                operator_stack.push(new shunting_yard_obj(stats.left_bracket, c, 0));
                full_content = '';
                is_first = true;
                continue;
            } else if (c === ')') {
                if (full_content.length != 0) output_stack.push(new shunting_yard_obj(stats.number, full_content));
                // meaningless bracket is allowed such as "1 ()*8" eq "1*8"
                while (!operator_stack.is_empty() && operator_stack.peek().content != '(') {
                    output_stack.push(operator_stack.pop());
                }
                if (operator_stack.is_empty()) throw new mismatchBarket("mismatch left bracket");
                operator_stack.pop();
                // discard one left bracket
                full_content = '';
                is_first = true;
                continue;
            } else {
                if (may_swtich_negative(c) &&
                    (is_operator(last_char) ||
                        last_char === '(' ||
                        last_char === ',' ||
                        last_char === '')) {
                    operator_stack.push(new shunting_yard_obj(stats.switch_negative, c, 1));
                    last_char = c;
                    continue;
                }
                if (full_content.length != 0) {
                    output_stack.push(new shunting_yard_obj(stats.number, full_content));
                    full_content = '';
                }
                while (!operator_stack.is_empty() &&
                    (operator_stack.peek().type == stats.switch_negative ||
                        (!is_right_combine(c) && rank_op(c) <= rank_op(operator_stack.peek().content)) ||
                        (is_right_combine(c) && rank_op(c) < rank_op(operator_stack.peek().content)))) {
                    output_stack.push(operator_stack.pop());
                }
                operator_stack.push(new shunting_yard_obj(stats.operator, c, operator_arg(c)));
                is_first = true;
                last_char = c;
                continue;
            }
            // is operator or bracket
        } else {
            // not operator
            if (is_first) {
                if (is_white_space(c)) continue;
                full_content += c;
                if (!is_number(c)) {
                    may_be_function = true;
                }
                last_char = c;
                is_first = false;
                continue;
            } else {
                if (is_white_space(c)) {
                    output_stack.push(new shunting_yard_obj(stats.number, full_content));
                    full_content = '';
                    last_char = c;
                    is_first = true;
                    continue;
                }
                // not first and not identifier(first letter not number)
                full_content += c;
                // append it directly
                last_char = c;
                continue;
            }
        }
    }
    if (full_content.length != 0) {
        if (is_all_num(full_content)) output_stack.push(new shunting_yard_obj(stats.number, full_content));
        else output_stack.push(new shunting_yard_obj(stats.identifier, full_content));
    }
    while (!operator_stack.is_empty()) {
        if (operator_stack.peek().type == stats.function) {
            var cache = operator_stack.pop();
            cache.argument_list = argument_list.pop();
            cache.argument_count = cache.argument_list.length;
            output_stack.push(cache);
        } else if (operator_stack.peek().type == stats.left_bracket) {
            throw new mismatchBarket("mismatch right bracket");
        } else {
            output_stack.push(operator_stack.pop());
        }
    }
    return output_stack.items;
}

/**
 * @class ParseError
 * @extends Error
 * @property {string} content the string content raised this error
 */
class ParseError extends Error {
    constructor(message, content) {
        super(message);
        this.content = content;
    }
}

/**
 * @class ExecutionError
 * @extends Error
 * @property {string} content the function name
 * @property {number} arg_count the argument count when the function called
 */
class ExecutionError extends Error {
    constructor(message, content, arg_count) {
        super(message);
        this.content = content;
        this.arg_count = arg_count;
    }
}

/**
 * @class IdentifierError
 * @extends Error
 * @property {string} content the string content raised this error
 */
class IdentifierError extends Error {
    constructor(message, content) {
        super(message);
        this.content = content;
    }
}

/**
 * function identifier
 * @class function_object
 * @property {string} name the name of the function
 * @property {number} param_count the number this function required
 */
class function_object {
    /**
     * @constructor
     * @param {string} name the name of the function
     * @param {number} param_count the number this function required 
     */
    constructor(name, param_count) {
        this.name = name;
        this.param_count = param_count;
    }
}

/**
 * get some param from register
 * @param {Array} register the source register
 * @param {number} num the number to get element from register
 * @returns {Array} an array contained the specific number of parameter from register
 */
function warp_param(register, num) {
    var result = new Array();
    for (var i = 0; i < num; ++i)result.push(register.pop());
    return result;
}

const call_operator = new Collection();
call_operator.set('+', (arr) => arr[1] + arr[0]);
call_operator.set('-', (arr) => arr[1] - arr[0]);
call_operator.set('*', (arr) => arr[1] * arr[0]);
call_operator.set('/', (arr) => arr[1] / arr[0]);
call_operator.set('%', (arr) => arr[1] % arr[0]);
call_operator.set('^', (arr) => Math.pow(arr[1], arr[0]));
call_operator.set('!', (arr) => {
    let result = 1;
    for (let i = 1; i <= arr[0];) {
        result *= i++;
    }
    return result;
});
const builtin_function = new Collection();
builtin_function.set(new function_object('abs', 1), (arr) => Math.abs(arr[0]));
builtin_function.set(new function_object('cbrt', 1), (arr) => Math.cbrt(arr[0]));
builtin_function.set(new function_object('ceil', 1), (arr) => Math.ceil(arr[0]));
builtin_function.set(new function_object('cos', 1), (arr) => Math.cos(arr[0]));
builtin_function.set(new function_object('cosh', 1), (arr) => Math.cosh(arr[0]));
builtin_function.set(new function_object('exp', 1), (arr) => Math.exp(arr[0]));
builtin_function.set(new function_object('floor', 1), (arr) => Math.floor(arr[0]));
builtin_function.set(new function_object('log', 1), (arr) => Math.log(arr[0]));
builtin_function.set(new function_object('log2', 1), (arr) => Math.log2(arr[0]));
builtin_function.set(new function_object('log10', 1), (arr) => Math.log10(arr[0]));
builtin_function.set(new function_object('log', 2), (arr) => Math.log(arr[0]) / Math.log(arr[1]));
builtin_function.set(new function_object('neg', 1), (arr) => arr[0] >= 0 ? -(arr[0]) : arr[0]);
builtin_function.set(new function_object('pow', 2), (arr) => Math.pow(arr[1], arr[0]));
builtin_function.set(new function_object('round', 1), (arr) => Math.round(arr[0]));
builtin_function.set(new function_object('sin', 1), (arr) => Math.sin(arr[0]));
builtin_function.set(new function_object('sinh', 1), (arr) => Math.sinh(arr[0]));
builtin_function.set(new function_object('sqrt', 1), (arr) => Math.sqrt(arr[0]));
builtin_function.set(new function_object('tan', 1), (arr) => Math.tan(arr[0]));
builtin_function.set(new function_object('tanh', 1), (arr) => Math.tanh(arr[0]));
builtin_function.set(new function_object('trunc', 1), (arr) => Math.trunc(arr[0]));

const builtin_function_list = [new function_object('abs', 1),
new function_object('cbrt', 1), new function_object('ceil', 1),
new function_object('cos', 1), new function_object('cosh', 1),
new function_object('exp', 1), new function_object('floor', 1),
new function_object('log', 1), new function_object('log2', 1),
new function_object('log10', 1), new function_object('pow', 2),
new function_object('round', 1), new function_object('sin', 1),
new function_object('sinh', 1), new function_object('sqrt', 1),
new function_object('tan', 1), new function_object('tanh', 1),
new function_object('trunc', 1), new function_object('log', 2),
new function_object('neg', 1)];

/**
 * find a function from a Collection by function name and argument count
 * @param {Collection} source the function collection
 * @param {function_object} val the specific function identifier
 * @returns {function_object} the function be find
 * @throws {ExecutionError} throw when cannot find the function
 */
function find_func(source, val) {
    for (let key of source.keys()) {
        if (key.name == val.name && key.argument_count == val.argument_count) {
            return source.get(key);
        }
    }
    throw new ExecutionError("undefined function", val.name);
}

/**
 * check whether the function exit in registered function list(would not check the argument count)
 * @param {function_object[]} source the array contained function declared infomation
 * @param {function_object} val the function identifier
 * @returns {boolean} true when the function is exit, false for otherwise
 */
function check_func(source, val) {
    for (let key of source) {
        if (key.name == val.name) {
            return true;
        }
    }
    return false;
}

/**
 * execute the Reverse Polish notation parsed by "shunting_yard" function
 * @param {shunting_yard_obj[]} shunting_yard_statement the Reverse Polish notation be parsed by "shunting_yard" function
 * @returns {number} the result after calculated Reverse Polish notation
 * @throws {ParseError} throw when the "number" state element cannot be parsed
 * @throws {IdentifierError} throw when there are any "identifier" state element exit in statement
 */
function execution(shunting_yard_statement) {
    var register = new Array();
    for (var op of shunting_yard_statement) {
        if (op.type == stats.number) {
            const cahce = Number(op.content);
            if (Number.isNaN(cahce)) {
                throw new ParseError(`${op.content} is not a vaild number`, op.content);
            }
            register.push(cahce);
        } else if (op.type == stats.operator) {
            register.push(call_operator.get(op.content)(warp_param(register, op.argument_count)));
        } else if (op.type == stats.switch_negative) {
            if (op.content === '+') register.push(Math.abs(register.pop()));
            else register.push(-(register.pop()));
        } else if (op.type == stats.function) {
            let check = new function_object(op.content, op.argument_count);
            if (check_func(builtin_function_list, check)) {
                register.push(find_func(builtin_function, check)(warp_param(register, op.argument_count)));
            } else {
                register.push(execution_function(check, warp_param(register, op.argument_count)));
            }
        } else if (op.type == stats.identifier) {
            throw new IdentifierError("cannot use identifier at top statement", op.content);
        }
    }
    return register.pop();
}

/**
 * execute a statement of a function
 * @param {function_object} tag the identifier of the function
 * @param  {...number} args the param list to call this function
 * @returns {number} the result of this function return
 * @throws {ExecutionError} throw when the function is not exit
 * @throws {ParseError} throw when the "number" state element cannot be parsed
 */
function execution_function(tag, ...args) {
    var register = new Array();
    var shunting_yard_statement;
    var arg_list = { ...args };
    var map;
    if (_.has(defined_function, `${tag.name}.${tag.param_count}`)) {
        shunting_yard_statement = _.get(defined_function, `${tag.name}.${tag.param_count}.statement`);
        map = _.get(defined_function, `${tag.name}.${tag.param_count}.arg_list`);
    } else {
        throw new ExecutionError("try to call undefined function", tag.name, tag.param_count);
    }
    for (var op of shunting_yard_statement) {
        if (op.type == stats.number) {
            const cahce = Number(op.content);
            if (Number.isNaN(cahce)) {
                throw new ParseError(`${op.content} is not a vaild number`, op.content);
            }
            register.push(cahce);
        } else if (op.type == stats.operator) {
            register.push(call_operator.get(op.content)(warp_param(register, op.argument_count)));
        } else if (op.type == stats.switch_negative) {
            if (op.content === '+') register.push(Math.abs(register.pop()));
            else register.push(-(register.pop()));
        } else if (op.type == stats.function) {
            let check = new function_object(op.content, op.argument_count);
            if (check_func(builtin_function_list, check)) {
                register.push((find_func(builtin_function, check)(warp_param(register, op.argument_count))));
            } else {
                register.push(execution_function(check, warp_param(register, op.argument_count)));
            }
        } else if (op.type == stats.identifier) {
            register.push(_.get(map, op.content));
        }
    }
    return register.pop();
}

module.exports = {
    shunting_yard,
    execution,
    invaildFunctionName,
    mismatchBarket,
    ExecutionError,
    ParseError,
    IdentifierError
}