// Resources/Private/Assets/EventDispatcher.ts
function defaultEvent(eventName, { bubbles = true, cancelable = true, composed = true } = {}, element = document) {
  element.dispatchEvent(new Event(eventName, { bubbles, cancelable, composed }));
}

// Resources/Private/Assets/Loader.ts
var head = document.head;
var cache = {};
var dataLoader = "data-loader";
var getBooleanData = (value) => value === void 0 || value === "false" ? false : true;
function initLoader({
  callback = () => {
  },
  callbackMode = "always",
  rootElement = document,
  markup = ""
} = {}) {
  if (markup) {
    if (!markup.includes(` ${dataLoader}`)) {
      callback();
      return;
    }
    const templateElement = document.createRange().createContextualFragment(`<template>${markup}</template>`).firstElementChild;
    rootElement = templateElement.content;
  }
  const elements = getElements(rootElement);
  if (elements.length === 0) {
    if (callbackMode === "always") {
      callback();
    }
    return;
  }
  let collectedScripts = [];
  let collectedStyles = [];
  let eventsOnLoad = [];
  let hasOneDebug = false;
  elements.forEach((element) => {
    const dataset = element.dataset;
    const useCache = !getBooleanData(dataset.noCache);
    const debug = getBooleanData(dataset.debug);
    const css = dataset.css;
    const js = dataset.js;
    const mjs = dataset.mjs;
    const split = dataset.split || ",";
    const eventOnLoad = dataset.eventOnLoad;
    eventsOnLoad.push(eventOnLoad);
    let scriptExecution = dataset.loader || false;
    if (scriptExecution !== "async" && scriptExecution !== "defer") {
      scriptExecution = false;
    }
    const styles2 = css ? LoaderMap(split, css, "css", useCache, debug) : false;
    const modules = mjs ? LoaderMap(split, mjs, "mjs", useCache, debug, scriptExecution) : false;
    const scripts2 = js ? LoaderMap(split, js, "js", useCache, debug, scriptExecution) : false;
    if (styles2) {
      collectedStyles = [...collectedStyles, ...styles2];
    }
    if (modules) {
      collectedScripts = [...collectedScripts, ...modules];
    }
    if (scripts2) {
      collectedScripts = [...collectedScripts, ...scripts2];
    }
    if (debug) {
      hasOneDebug = true;
      console.log("LOADER: element setting", { styles: styles2, modules, scripts: scripts2, eventOnLoad });
    }
  });
  eventsOnLoad = [...new Set(eventsOnLoad)].filter(Boolean);
  const styles = uniqueyArrayByUrl(collectedStyles);
  const scripts = uniqueyArrayByUrl(collectedScripts);
  if (hasOneDebug) {
    console.log("LOADER: all settings", { styles, scripts, eventsOnLoad });
  }
  Loader(styles).then(() => {
    if (!scripts.length && callbackMode === "always" || callbackMode === "newCSS") {
      fireEvents(eventsOnLoad);
      callback();
    }
  });
  Loader(scripts).then(() => {
    if (callbackMode === "always" || callbackMode === "newJS") {
      fireEvents(eventsOnLoad);
      callback();
    }
  });
  return { styles, scripts };
}
function Loader(items) {
  return items instanceof Array ? Promise.all(items.map(exec)) : exec(items);
}
function LoaderMap(split, items, type, useCache = true, debug = false, scriptExecution = false) {
  return items.split(split).map((url) => ({ url, type, useCache, debug, scriptExecution }));
}
function exec({ url, type, useCache, debug, scriptExecution }) {
  if (!url) {
    throw new Error("LOADER: You must provide a url to load");
  }
  const cacheEntry = cache[url];
  if (cacheEntry && useCache) {
    if (debug) {
      console.log("LOADER: cache hit", url);
    }
    return cacheEntry;
  } else {
    const element2 = type === "css" ? getStyleByUrl(url) : getScriptByUrl(url);
    if (element2) {
      const promise = Promise.resolve(element2);
      if (useCache) {
        cache[url] = promise;
      }
      return promise;
    }
  }
  const element = type === "css" ? createStyle({ url }) : createScript({ url, type, scriptExecution });
  const pending = appendAndLoad(element);
  if (useCache) {
    cache[url] = pending;
  }
  return pending;
}
function appendAndLoad(element) {
  return new Promise(function(resolve, reject) {
    let done = false;
    element.onload = element.onreadystatechange = function() {
      if (!done && (!element.readyState || element.readyState === "loaded" || element.readyState === "complete")) {
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
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  return link;
}
function createScript({ url, type, scriptExecution }) {
  if (!url) {
    return;
  }
  const script = document.createElement("script");
  if (type === "mjs") {
    script.type = "module";
  }
  if (scriptExecution) {
    script[scriptExecution] = true;
  }
  script.src = url;
  return script;
}
function getElements(rootElement) {
  let elements = [...rootElement.querySelectorAll(`[${dataLoader}]`)];
  const templates = [...rootElement.querySelectorAll("template")];
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
export {
  Loader,
  LoaderMap,
  initLoader as default,
  initLoader
};
