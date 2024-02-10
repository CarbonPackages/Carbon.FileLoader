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
  const elements = [...rootElement.querySelectorAll(`[${dataLoader}]`)];
  if (!markup && elements.length === 0) {
    callback();
    return;
  }
  let scripts = [];
  let styles = [];
  elements.forEach((element) => {
    const dataset = element.dataset;
    const useCache = !getBooleanData(dataset.noCache);
    const debug = getBooleanData(dataset.debug);
    if (dataset?.css) {
      styles = [...styles, ...LoaderMap(dataset.css, "css", useCache, debug)];
    }
    if (dataset?.mjs) {
      scripts = [...scripts, ...LoaderMap(dataset.mjs, "mjs", useCache, debug)];
    }
    if (dataset?.js) {
      scripts = [...scripts, ...LoaderMap(dataset.js, "js", useCache, debug)];
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
function LoaderMap(items, type, useCache = true, debug = false) {
  return items.split(",").map((url) => ({ url, type, useCache, debug }));
}
function exec({ url, type, useCache, debug }) {
  if (!url) {
    throw new Error("LOADER: You must provide a url to load");
  }
  const cacheEntry = cache[url];
  if (cacheEntry) {
    if (debug) {
      console.log("LOADER: cache hit", url);
    }
    return cacheEntry;
  } else {
    const element2 = type === "css" ? getStyleByUrl(url) : getScriptByUrl(url);
    if (element2) {
      const promise = Promise.resolve(element2);
      if (url) {
        cache[url] = promise;
      }
      return promise;
    }
  }
  const element = type === "css" ? createStyle({ url }) : createScript({ url, type });
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
  return checkElement(url && document.querySelector(`script[src='${url}']`));
}
function getStyleByUrl(url) {
  return checkElement(url && document.querySelector(`link[href='${url}']`));
}
function checkElement(element) {
  if (element && element.dataset.marker !== "true") {
    return element;
  }
}
function createStyle({ url }) {
  if (!url) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.dataset.marker = "true";
  return link;
}
function createScript({ url, type }) {
  if (!url) {
    return;
  }
  const script = document.createElement("script");
  if (type === "mjs") {
    script.type = "module";
  }
  script.defer = true;
  script.dataset.marker = "true";
  script.src = url;
  return script;
}
export {
  Loader,
  LoaderMap,
  initLoader as default,
  initLoader
};
