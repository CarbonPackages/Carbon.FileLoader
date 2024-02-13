// Resources/Private/Assets/Loader.ts
var head = document.head;
var cache = {};
var dataLoader = "data-loader";
var getBooleanData = (value) => value === void 0 || value === "false" ? false : true;
function initLoader({ callback = () => {
}, rootElement = document, markup = "" } = {}) {
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
    callback();
    return;
  }
  let scripts = [];
  let styles = [];
  elements.forEach((element) => {
    const dataset = element.dataset;
    const useCache = !getBooleanData(dataset.noCache);
    const debug = getBooleanData(dataset.debug);
    let scriptExecution = dataset.scriptExecution || false;
    if (scriptExecution !== "async" && scriptExecution !== "defer") {
      scriptExecution = false;
    }
    if (dataset?.css) {
      styles = [...styles, ...LoaderMap(dataset.css, "css", useCache, debug)];
    }
    if (dataset?.mjs) {
      scripts = [...scripts, ...LoaderMap(dataset.mjs, "mjs", useCache, debug, scriptExecution)];
    }
    if (dataset?.js) {
      scripts = [...scripts, ...LoaderMap(dataset.js, "js", useCache, debug, scriptExecution)];
    }
  });
  styles = [...new Set(styles)];
  scripts = [...new Set(scripts)];
  Loader(styles).then(() => {
    if (!scripts.length) {
      callback();
    }
  });
  Loader(scripts).then(callback);
  return { styles, scripts };
}
function Loader(items) {
  return items instanceof Array ? Promise.all(items.map(exec)) : exec(items);
}
function LoaderMap(items, type, useCache = true, debug = false, scriptExecution = false) {
  return items.split(",").map((url) => ({ url, type, useCache, debug, scriptExecution }));
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
export {
  Loader,
  LoaderMap,
  initLoader as default,
  initLoader
};
