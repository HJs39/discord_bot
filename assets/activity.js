const activities = require('./activity.json');
const path = require('node:path');
const fs = require('node:fs');

module.exports = activities;

process.on('exit', (code) => {
    fs.writeFileSync(path.join(__dirname, 'activity.json'), JSON.stringify(activities), 'utf-8');
});