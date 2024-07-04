import { defaultEvent } from './EventDispatcher';

interface initLoaderOptions {
    callback?: Function;
    callbackMode?: 'always' | 'newJS' | 'newCSS';
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

function initLoader({
    callback = () => {},
    callbackMode = 'always',
    rootElement = document,
    markup = '',
}: initLoaderOptions = {}) {
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
        if (callbackMode === 'always') {
            callback();
        }
        return;
    }

    let collectedScripts = [];
    let collectedStyles = [];
    let eventsOnLoad = [];
    let hasOneDebug = false;
    elements.forEach((element) => {
        const dataset = (element as HTMLElement).dataset;
        const useCache = !getBooleanData(dataset.noCache);
        const debug = getBooleanData(dataset.debug);
        const css = dataset.css;
        const js = dataset.js;
        const mjs = dataset.mjs;
        const split = dataset.split || ',';
        const eventOnLoad = dataset.eventOnLoad;
        eventsOnLoad.push(eventOnLoad);
        let scriptExecution = dataset.loader || false;
        if (scriptExecution !== 'async' && scriptExecution !== 'defer') {
            scriptExecution = false;
        }
        const styles = css ? LoaderMap(split, css, 'css', useCache, debug) : false;
        const modules = mjs ? LoaderMap(split, mjs, 'mjs', useCache, debug, scriptExecution) : false;
        const scripts = js ? LoaderMap(split, js, 'js', useCache, debug, scriptExecution) : false;

        if (styles) {
            collectedStyles = [...collectedStyles, ...styles];
        }
        if (modules) {
            collectedScripts = [...collectedScripts, ...modules];
        }
        if (scripts) {
            collectedScripts = [...collectedScripts, ...scripts];
        }

        if (debug) {
            hasOneDebug = true;
            console.log('LOADER: element setting', { styles, modules, scripts, eventOnLoad });
        }
    });

    // unique arrays
    eventsOnLoad = [...new Set(eventsOnLoad)].filter(Boolean);
    const styles = uniqueyArrayByUrl(collectedStyles);
    const scripts = uniqueyArrayByUrl(collectedScripts);

    if (hasOneDebug) {
        console.log('LOADER: all settings', { styles, scripts, eventsOnLoad });
    }

    // Load styles and scripts
    Loader(styles).then(() => {
        // Run callback if there are no scripts
        if ((!scripts.length && callbackMode === 'always') || callbackMode === 'newCSS') {
            fireEvents(eventsOnLoad);
            callback();
        }
    });
    Loader(scripts).then(() => {
        if (callbackMode === 'always' || callbackMode === 'newJS') {
            fireEvents(eventsOnLoad);
            callback();
        }
    });

    return { styles, scripts };
}

function Loader(items: LoadOptions | LoadOptions[]) {
    return items instanceof Array ? Promise.all(items.map(exec)) : exec(items);
}

function LoaderMap(
    split: string,
    items: string,
    type: 'js' | 'css' | 'mjs',
    useCache: boolean = true,
    debug: boolean = false,
    scriptExecution: 'async' | 'defer' | false = false,
) {
    return items.split(split).map((url) => ({ url, type, useCache, debug, scriptExecution }));
}

function exec({ url, type, useCache, debug, scriptExecution }) {
    if (!url) {
        throw new Error('LOADER: You must provide a url to load');
    }

    const cacheEntry = cache[url];

    if (cacheEntry && useCache) {
        if (debug) {
            console.log('LOADER: cache hit', url);
        }
        return cacheEntry;
    } else {
        const element = type === 'css' ? getStyleByUrl(url) : getScriptByUrl(url);

        if (element) {
            const promise = Promise.resolve(element);
            if (useCache) {
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
    return document.querySelector(`script[src="${url}"]`);
}

function getStyleByUrl(url) {
    return document.querySelector(`link[href="${url}"]`);
}

function createStyle({ url }) {
    if (!url) {
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

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

function fireEvents(eventNames) {
    eventNames.forEach((eventName) => {
        defaultEvent(eventName);
    });
}

function uniqueyArrayByUrl(arr) {
    const urls = [];
    return arr.filter((item) => {
        if (urls.includes(item.url)) {
            return false;
        }
        urls.push(item.url);
        return true;
    });
}

export { Loader, LoaderMap, initLoader as default, initLoader };
export type { LoadOptions, initLoaderOptions };
