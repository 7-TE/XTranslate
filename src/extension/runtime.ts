// Chrome extension's runtime api helpers
import InstalledDetails = chrome.runtime.InstalledDetails;
import { Message, MessageType } from './messages'
import { sendMessageToTab } from "./tabs";

export function getManifest() {
  return chrome.runtime.getManifest() as chrome.runtime.ManifestV3;
}

export function getURL(path = ""): string {
  return chrome.runtime.getURL(path);
}

export function isBackgroundPage(): boolean {
  const serviceWorkerScript = getManifest().background.service_worker;
  return location.href.startsWith(getURL(serviceWorkerScript));
}

export function isOptionsPage(): boolean {
  const optionsHtmlPage = getManifest().options_ui.page;
  return location.href.startsWith(getURL(optionsHtmlPage));
}

export function getStyleUrl() {
  var manifest = getManifest();
  var filePath = manifest.content_scripts.map(script => script.css)[0][0];
  return getURL(filePath);
}

export async function sendMessage<Request, Response = any, Error = any>({ tabId, ...message }: Message<Request> & { tabId?: number }): Promise<Response> {
  let resolve: (data: Response) => void;
  let reject: (error: Error) => void;

  if (tabId) {
    sendMessageToTab(tabId, message, responseCallback);
  } else {
    chrome.runtime.sendMessage(message, responseCallback);
  }

  function responseCallback(res: { data?: Response, error?: Error } = {}) {
    const resultFields = Object.getOwnPropertyNames(res) as (keyof typeof res)[];

    if (resultFields.includes("data")) resolve(res.data);
    if (resultFields.includes("error")) reject(res.error);
    else resolve(null); // called in case `onMessage(() => undefined)`

    // fix: "Could not establish connection. Receiving end does not exist."
    if (chrome.runtime.lastError) {
      // do nothing
    }
  }

  return new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
}

export interface OnMessageCallback<Request, Response> {
  (req: Request): Promise<Response> | Response;
}

export function onMessage<Request, Response = unknown>(type: MessageType, getResult: OnMessageCallback<Request, Response>) {
  let _listener: (...args: any) => any;

  chrome.runtime.onMessage.addListener(function listener(message: Message<Request>, sender, sendResponse) {
    _listener = listener;

    if (message.type === type) {
      Promise.resolve(getResult(message.payload))
        .then(data => sendResponse({ data }))
        .catch(error => sendResponse({ error }));
    }

    // wait for async response
    // read more: https://developer.chrome.com/docs/extensions/mv3/messaging/
    return true;
  });

  // unsubscribe disposer
  return () => {
    chrome.runtime.onMessage.removeListener(_listener);
  };
}

export function openOptionsPage() {
  return new Promise(resolve => {
    chrome.runtime.openOptionsPage(() => resolve(null));
  });
}

export function onInstall(callback: (reason: "install" | "update" | "chrome_update", details: InstalledDetails) => void) {
  const callbackWrapper = (event: InstalledDetails) => {
    callback(event.reason as "update", event);
  };
  chrome.runtime.onInstalled.addListener(callbackWrapper);
  return () => chrome.runtime.onInstalled.removeListener(callbackWrapper);
}
