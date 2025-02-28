//-- Background service worker

import "../packages.setup";
import "./contextMenu"
import { isProduction } from "../common-vars";
import { blobToBase64DataUrl, createLogger, parseJson } from "../utils";
import { ChromeTtsPayload, getURL, MessageType, onInstall, onMessage, openOptionsPage, ProxyRequestPayload, ProxyResponsePayload, ProxyResponseType, SaveToHistoryPayload } from '../extension'
import { rateLastTimestamp } from "../components/app/app-rate.storage";
import { generateId, historyStorage, IHistoryStorageItem, importHistory, loadHistory, toStorageItem, toTranslationResult } from "../components/user-history/history.storage";
import type { TranslatePayload } from "../vendors/translator";

const logger = createLogger({ systemPrefix: '[BACKGROUND]' });

onInstall((reason) => {
  if (reason === "install" || !isProduction) {
    rateLastTimestamp.set(Date.now());
    openOptionsPage();
  }
});

/**
 * Network proxy for `options` and `content-script` pages (to avoid CORS, etc.)
 */
onMessage(MessageType.PROXY_REQUEST, async ({ url, responseType, requestInit }: ProxyRequestPayload) => {
  logger.info(`proxying request (${responseType}): ${url}`);

  const httpResponse = await fetch(url, requestInit);
  const payload: ProxyResponsePayload<any> = {
    url,
    headers: Object.fromEntries(httpResponse.headers),
    data: undefined,
  };

  switch (responseType) {
    case ProxyResponseType.JSON:
      payload.data = await parseJson(httpResponse);
      break;

    case ProxyResponseType.TEXT:
      payload.data = await httpResponse.text();
      break;

    case ProxyResponseType.DATA_URL:
      const blob = await httpResponse.blob();
      payload.data = await blobToBase64DataUrl(blob);
      break;

    case ProxyResponseType.BLOB:
      const buffer = await httpResponse.arrayBuffer();
      const transferableDataContainer = new Uint8Array(buffer);
      payload.data = Array.from(transferableDataContainer);
      break;
  }

  return payload;
});

/**
 * Saving history of translations
 */
onMessage(MessageType.SAVE_TO_HISTORY, async (payload: SaveToHistoryPayload) => {
  await loadHistory();
  const storageItem = toStorageItem(payload.translation);

  logger.info("saving item to history", storageItem);
  importHistory(storageItem);
});

/**
 * Handling saved translations from history without http-traffic
 */
onMessage(MessageType.GET_FROM_HISTORY, async (payload: TranslatePayload) => {
  await loadHistory();

  const { text, from, to, vendor } = payload;
  const translationId = generateId(text, from, to);
  const storageItem: IHistoryStorageItem = historyStorage.toJS().translations[translationId]?.[vendor];

  if (storageItem) {
    const result = toTranslationResult(storageItem);
    logger.info("handling translation from history item lookup", { result, payload });
    return result;
  }
});

/**
 * Handling chrome.tts apis for user-script pages and options (app) page
 */
onMessage(MessageType.CHROME_TTS_PLAY, (payload: ChromeTtsPayload) => {
  const { text, lang, rate = 1.0 } = payload;
  chrome.tts.speak(text, { lang, rate, });
});

onMessage(MessageType.CHROME_TTS_STOP, () => {
  chrome.tts.stop();
});

/**
 * Adgoal integration
 */
importScripts(getURL('adgoal/background.bundle.js'));

export const universalSearchCredentials = {
  API_PUBLIC_KEY: 'ADfU2KbHWQ',
  MEMBER_HASH: '1HlP4gKx',
  PANEL_HASH: 'mfje9JoyzV'
};
