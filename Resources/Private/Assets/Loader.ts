interface initLoaderOptions {
    callback?: Function;
    rootElement?: HTMLElement | Document | DocumentFragment | HTMLTemplateElement;
    markup?: string;
}

interface LoadOptions {
    url: string;
    type: 'js' | 'css' | 'mjs';
    scriptExecution: 'async' | 'defer' | false;
    useCache: boolean;
    debug: boolean;
}

const head = document.head;
const cache = {};

const dataLoader = 'data-loader';

const getBooleanData = (value) => (value === undefined || value === 'false' ? false : true);

function initLoader({ callback = () => {}, rootElement = document, markup = '' }: initLoaderOptions = {}) {
    // If markup is provided, use it to create a new rootElement
    if (markup) {
        // Early chek if markup contains data-loader
        if (!markup.includes(` ${dataLoader}`)) {
            callback();
            return;
        }
        // createContextualFragment just interprets table fragments as text nodes unless they're wrapped with a template.
        const templateElement = document.createRange().createContextualFragment(`<template>${markup}</template>`)
            .firstElementChild as HTMLTemplateElement;
        rootElement = templateElement.content;
    }

    const elements = getElements(rootElement);

    // Early check if there are no elements with data-loader
    if (elements.length === 0) {
        callback();
        return;
    }

    let scripts = [];
    let styles = [];
    elements.forEach((element) => {
        const dataset = (element as HTMLElement).dataset;
        const useCache = !getBooleanData(dataset.noCache);
        const debug = getBooleanData(dataset.debug);
        let scriptExecution = dataset.scriptExecution || false;
        if (scriptExecution !== 'async' && scriptExecution !== 'defer') {
            scriptExecution = false;
        }

        if (dataset?.css) {
            styles = [...styles, ...LoaderMap(dataset.css, 'css', useCache, debug)];
        }
        if (dataset?.mjs) {
            scripts = [...scripts, ...LoaderMap(dataset.mjs, 'mjs', useCache, debug, scriptExecution)];
        }
        if (dataset?.js) {
            scripts = [...scripts, ...LoaderMap(dataset.js, 'js', useCache, debug, scriptExecution)];
        }
    });

    // unique arrays
    styles = [...new Set(styles)];
    scripts = [...new Set(scripts)];

    // Load styles and scripts
    Loader(styles).then(() => {
        // Run callback if there are no scripts
        if (!scripts.length) {
            callback();
        }
    });
    Loader(scripts).then(callback);

    return { styles, scripts };
}

function Loader(items: LoadOptions | LoadOptions[]) {
    return items instanceof Array ? Promise.all(items.map(exec)) : exec(items);
}

function LoaderMap(
    items: string,
    type: 'js' | 'css' | 'mjs',
    useCache: boolean = true,
    debug: boolean = false,
    scriptExecution: 'async' | 'defer' | false = false,
) {
    return items.split(',').map((url) => ({ url, type, useCache, debug, scriptExecution }));
}

function exec({ url, type, useCache, debug, scriptExecution }) {
    if (!url) {
        throw new Error('LOADER: You must provide a url to load');
    }

    const cacheEntry = cache[url];

    if (cacheEntry) {
        if (debug) {
            console.log('LOADER: cache hit', url);
        }
        return cacheEntry;
    } else {
        const element = type === 'css' ? getStyleByUrl(url) : getScriptByUrl(url);

        if (element) {
            const promise = Promise.resolve(element);
            if (url) {
                cache[url] = promise;
            }
            return promise;
        }
    }

    const element = type === 'css' ? createStyle({ url }) : createScript({ url, type, scriptExecution });
    const pending = appendAndLoad(element);

    if (useCache) {
        cache[url] = pending;
    }

    return pending;
}

function appendAndLoad(element) {
    return new Promise(function (resolve, reject) {
        // Handle loading
        let done = false;

        // Attach handlers for all browsers.
        //
        // References:
        // http://stackoverflow.com/questions/4845762/onload-handler-for-script-tag-in-internet-explorer
        // http://stevesouders.com/efws/script-onload.php
        // https://www.html5rocks.com/en/tutorials/speed/script-loading/
        //
        element.onload = element.onreadystatechange = function () {
            if (
                !done &&
                (!element.readyState || element.readyState === 'loaded' || element.readyState === 'complete')
            ) {
                done = true;
                element.onload = element.onreadystatechange = null;
                resolve(element);
            }
        };

        element.onerror = reject;

        head.appendChild(element);
    });
}

function getScriptByUrl(url) {
    return checkElement(url && document.querySelector(`script[src='${url}']`));
}

function getStyleByUrl(url) {
    return checkElement(url && document.querySelector(`link[href='${url}']`));
}

function checkElement(element: HTMLElement) {
    if (element && element.dataset.marker !== 'true') {
        return element;
    }
}

function createStyle({ url }) {
    if (!url) {
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.marker = 'true';

    return link;
}

function createScript({ url, type, scriptExecution }) {
    if (!url) {
        return;
    }

    const script = document.createElement('script');
    if (type === 'mjs') {
        script.type = 'module';
    }
    if (scriptExecution) {
        script[scriptExecution] = true;
    }
    script.dataset.marker = 'true';
    script.src = url;

    return script;
}

function getElements(rootElement) {
    let elements = [...rootElement.querySelectorAll(`[${dataLoader}]`)];
    // Get all template elements
    const templates = [...rootElement.querySelectorAll('template')];
    // Get all elements inside templates
    templates.forEach((template) => {
        elements = [...elements, ...template.content.querySelectorAll(`[${dataLoader}]`)];
    });
    return elements;
}

export { Loader, LoaderMap, initLoader as default, initLoader };
export type { LoadOptions, initLoaderOptions };
