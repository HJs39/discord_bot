const cats = require('./cats.json');
const fs = require('node:fs');
const path = require('node:path');
const _ = require('lodash');

module.exports.cats = cats;
module.exports.providers = _.union(_.map(cats, 'provider'));

process.on('exit', code => {
    fs.writeFileSync(path.join(__dirname, 'cats.json'), JSON.stringify(cats), 'utf-8');
});