export function throttle(fn, delay) {
    let timerId;
    let lastExecTime = 0;
    return () => {
        const context = this;
        const args = arguments;
        const elapsedTime = performance.now() - lastExecTime;
        const execute = () => {
            fn.apply(context, args);
            lastExecTime = performance.now();
        };
        if (!timerId) {
            execute();
        }
        if (timerId) {
            clearTimeout(timerId);
        }
        if (elapsedTime > delay) {
            execute();
        } else {
            timerId = setTimeout(execute, delay);
        }
    };
}
