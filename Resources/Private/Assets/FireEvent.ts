function fireEvent(eventName, options, element = document) {
    if (options?.detail === undefined) {
        defaultEvent(eventName, options, element);
        return;
    }
    customEvent(eventName, options.detail, options, element);
}

function defaultEvent(eventName, { bubbles = true, cancelable = true, composed = true } = {}, element = document) {
    element.dispatchEvent(new Event(eventName, { bubbles, cancelable, composed }));
}

function customEvent(
    eventName,
    detail,
    { bubbles = true, cancelable = true, composed = true } = {},
    element = document,
) {
    element.dispatchEvent(new CustomEvent(eventName, { detail, bubbles, cancelable, composed }));
}

export { fireEvent as default, fireEvent, defaultEvent, customEvent };
