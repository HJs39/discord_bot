const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { Chart } = require('chart.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const data = require('./StartLux-Decision-testv2-data.json');

(async () => {
    const result_arr = [];
    for (const d of data) {
        result_arr.push({
            memorable: _.get(d.noul, "memorable").result,
            topic: _.get(d.choice, "topic").result,
            intent: _.get(d.choice, 'intent').result,
            decision_impact: _.get(d.score, 'decision_impact').accumulate
        });
    }

    const TOPIC_COLORS = {
        tech_work: '#4363d8',
        entertainment: '#f58231',
        life_routine: '#3cb44b',
        venting_care: '#e6194b',
        intimacy: '#911eb4',
    };

    const INTENT_STYLES = {
        directive: 'rect',
        disclosure: 'triangle',
        expressive: 'star',
        phatic: 'rectRot', // 菱形
    };

    const OUTPUT_NAME = 'JEV-memorize-type-testv2-StartLux-Decision';
    console.log(data.length);
    async function generateScatterChart() {
        const width = 1100;
        const height = 750;

        const chartJSNodeCanvas = new ChartJSNodeCanvas({
            width,
            height,
            backgroundColour: 'white',
        });

        const topics = Object.keys(TOPIC_COLORS);
        const intents = Object.keys(INTENT_STYLES);

        // 每個 topic 一個 dataset（決定顏色），每個點依 intent 設定形狀
        const topicDatasets = topics.map((topic) => {
            const points = data.filter((d) => d.choice.topic.result === topic);
            return {
                label: `topic: ${topic}`,
                data: points.map((d) => ({ x: d.noul.memorable.result, y: d.score.decision_impact.accumulate })),
                backgroundColor: TOPIC_COLORS[topic],
                borderColor: TOPIC_COLORS[topic],
                pointStyle: points.map((d) => INTENT_STYLES[d.choice.intent.result]),
                pointRadius: 8,
                pointHoverRadius: 10,
            };
        });

        // 沒有資料的灰色「圖例專用」dataset，只用來在圖例中顯示 intent 對應的形狀
        const intentLegendDatasets = intents.map((intent) => ({
            label: `intent: ${intent}`,
            data: [],
            backgroundColor: '#555555',
            borderColor: '#555555',
            pointStyle: INTENT_STYLES[intent],
            pointRadius: 8,
        }));
        const configuration = {
            type: 'scatter',
            data: { datasets: [...topicDatasets, ...intentLegendDatasets] },
            options: {
                responsive: false,
                animation: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Memorable vs Decision Impact (color: topic, shape: intent)',
                        font: { size: 20 },
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            // topic 的圖例一律顯示圓形，避免被第一個點的形狀誤導
                            generateLabels: (chart) =>
                                Chart.defaults.plugins.legend.labels
                                    .generateLabels(chart)
                                    .map((item) =>
                                        item.datasetIndex < topics.length
                                            ? { ...item, pointStyle: 'circle' }
                                            : item
                                    ),
                        },
                    },
                },
                scales: {
                    x: {
                        title: { display: true, text: 'memorable', font: { size: 14 } },
                    },
                    y: {
                        title: { display: true, text: 'decision_impact', font: { size: 14 } },
                    },
                },
            },
        };
        console.log('start image generate');
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        console.log('complete image generation');
        const outputPath = path.join(__dirname, `${OUTPUT_NAME}.png`);
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`散佈圖已儲存至：${outputPath}`);
    }
    try {
        await generateScatterChart();
    } catch (err) {
        console.error('產生散佈圖時發生錯誤：', err);
        process.exit(1);
    }
})();