const functions = require('./defined_function.json');
const path = require('node:path');
const fs = require('node:fs');

module.exports = {
    defined_function: functions
};

process.on('exit', code => {
    fs.writeFileSync(path.join(__dirname, 'defined_function.json'), JSON.stringify(functions), 'utf-8');
});