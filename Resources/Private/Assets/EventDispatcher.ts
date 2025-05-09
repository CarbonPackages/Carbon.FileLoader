type Element = HTMLElement | Document | DocumentFragment | HTMLTemplateElement | Window;

function eventDispatcher(eventName: string, options: any = {}, element: Element = document) {
    if (options?.detail === undefined) {
        defaultEvent(eventName, options, element);
        return;
    }
    customEvent(eventName, options.detail, options, element);
}

function defaultEvent(
    eventName: string,
    { bubbles = true, cancelable = true, composed = true } = {},
    element: Element = document,
) {
    element.dispatchEvent(new Event(eventName, { bubbles, cancelable, composed }));
}

function customEvent(
    eventName: string,
    detail: any,
    { bubbles = true, cancelable = true, composed = true } = {},
    element: Element = document,
) {
    element.dispatchEvent(new CustomEvent(eventName, { detail, bubbles, cancelable, composed }));
}

export { eventDispatcher as default, eventDispatcher, defaultEvent, customEvent };
