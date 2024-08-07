function eventListener(name: string, callback: Function, once = true) {
    if (typeof name !== 'string' || typeof callback !== 'function') {
        throw new Error('eventListener: name must be a string and callback must be a function');
    }
    document.addEventListener(name, (event) => callback(event), { once });
}

export { eventListener as default, eventListener };
