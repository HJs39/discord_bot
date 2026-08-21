class timer {
    static wait(millisecond) {
        return new Promise((resolve) => {
            setTimeout(resolve, millisecond);
        });
    }

    static async wait_until(condition, duration = 10000) {
        return new Promise((resolve) => {
            const counter = setInterval(() => {
                if (condition()) {
                    clearInterval(counter);
                    resolve();
                }
            }, duration);
        });
    }
}

module.exports = timer;