const questions = require('./would_you_rather.json');
const path = require('node:path');
const fs = require('node:fs');

module.exports = questions;

process.on('exit', (code) => {
    fs.writeFileSync(path.join(__dirname, 'would_you_rather.json'), JSON.stringify(questions), 'utf-8');
});