const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { Chart } = require('chart.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { LLM_interface } = require('../implement/LLM/LLM_interface');
const placeholder_replacer = require('../implement/placeholder_replacer');
const JEV = require('../implement/LLM/jev');
const config = require('../assets/private-battle_API_config.json');

(async () => {
    const llm = new LLM_interface(config, false, false);

    const persona = llm.get_persona(16);
    const test_memory = _.take(llm.fetch_contexts(persona.memory.raw_short_term), 100);
    const cur_time = moment(new Date());
    const backup = [];

    for (const c of test_memory) {
        const user = llm.get_user(c.user);
        const result = await JEV.send_request({
            "persona name": persona.internal_name,
            "interact user": user.name,
            "user send": (new placeholder_replacer([['user', user.internal_name]])).replace(c.user_input),
            "persona reply": c.assistant_message,
            "reply timestamp": moment(c.send_at).format(),
            "current timestamp": cur_time.format()
        }, {
            "memorable": {
                "type": "noul",
                "instructions": `As ${persona.internal_name}'s perspective, is this interaction a non-repeatable, memory-worthy memory with ${user.name}? Ignore small talk, spam-like content, repetition, perishable or too long ago interaction.`
            },
            "topic": {
                "type": "choice",
                "instructions": `Which topical domain best describes the subject matter of the message?`,
                "criteria": {
                    "tech_work": "Coding, AI, engineering, work projects, or technical troubleshooting.",
                    "entertainment": "Gaming, anime, media, streams, or recreational hobbies.",
                    "life_routine": "Food, travel, physical surroundings, daily schedule, or real-world errands.",
                    "venting_care": "Personal struggles, negative emotions, health/fatigue, or seeking emotional support.",
                    "intimacy": "Romance, affection, relationship dynamics, or NSFW/sensual teasing."
                }
            },
            "intent": {
                "type": "choice",
                "instructions": "What is the primary communicative function of the user's message?",
                "criteria": {
                    "directive": "Setting rules, persona constraints, or correcting the AI's previous mistake.",
                    "disclosure": "Sharing concrete personal facts, ongoing statuses, preferences, or specific life events.",
                    "expressive": "Venting emotions, reacting, joking, flirting, or pure subjective bantering without new factual info.",
                    "phatic": "Short greetings, acknowledgments (e.g., 'ok', 'lol'), or empty filler to keep conversation flowing."
                }
            },
            "decision_impact": {
                "type": "score",
                "instructions": `As ${persona.internal_name}'s perspective, how serious is it when he or she decide or interact with ${user.name} without this memory in future?`,
                "criteria": [
                    "No impact — generic knowledge the LLM already has",
                    "Minor — slightly better phrasing only",
                    "Moderate — would get a preference or detail wrong",
                    "High — would give a factually wrong answer about this person"
                ]
            }
        });/*
        let max_score = null;
        for (const entry of Object.entries(_.get(result.score, "decision_impact").probabilities)) {
            if (!max_score || entry[1] > max_score[1]) {
                max_score = entry;
            }
        }*/
        backup.push(_.cloneDeep(result));
        console.log(`completion: ${(backup.length / test_memory.length) * 100}%`)
    }

    fs.writeFileSync(path.join(__dirname, 'StartLux-Decision-testv2-data.json'), JSON.stringify(backup));
})()