// background.js - MCP File Upload Helper
// Uses chrome.scripting + DataTransfer API - NO debugger, NO file picker

const WS_URL = "ws://localhost:9010";

let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;

chrome.alarms.create("keepalive", { periodInMinutes: 0.25 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepalive") {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    } else {
      connect();
    }
  }
});

function isInjectableUrl(url) {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");
}

async function handleUploadFile(message) {
  var filePath = message.payload.filePath;
  var selector = message.payload.selector || 'input[type="file"]';
  var requestId = message.requestId;

  try {
    var fileData = message.payload.fileData;
    var fileName = message.payload.fileName || filePath.split(/[/\\]/).pop();

    if (!fileData) {
      throw new Error("No fileData in message");
    }

    var tabs = await chrome.tabs.query({ currentWindow: true });
    var tab = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].url && tabs[i].url.includes("mail.google.com")) {
        tab = tabs[i];
        break;
      }
    }
    if (!tab) {
      var active = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = active[0];
    }
    if (!tab) throw new Error("No active tab");

    if (!isInjectableUrl(tab.url)) {
      throw new Error("Cannot inject on this page (" + (tab.url || "unknown") + "). Open Gmail compose first.");
    }

    var results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function(selector, fileData, fileName) {
        var el = document.querySelector(selector);
        if (!el) return { success: false, error: "Element not found: " + selector };

        try {
          var raw = atob(fileData);
          var bytes = new Uint8Array(raw.length);
          for (var i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
          }

          var ext = fileName.split('.').pop().toLowerCase();
          var mimeMap = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif'
          };
          var mime = mimeMap[ext] || 'application/octet-stream';

          var file = new File([bytes], fileName, { type: mime });
          var dt = new DataTransfer();
          dt.items.add(file);
          el.files = dt.files;

          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));

          return { success: true, fileName: fileName, fileSize: file.size };
        } catch (e) {
          return { success: false, error: e.message };
        }
      },
      args: [selector, fileData, fileName]
    });

    if (results && results[0] && results[0].result) {
      var res = results[0].result;
      if (res.success) {
        sendToServer({
          type: "upload_result",
          requestId: requestId,
          success: true,
          message: "File set: " + res.fileName + " (" + res.fileSize + " bytes) on " + selector
        });
      } else {
        throw new Error(res.error || "Unknown error in injected script");
      }
    } else {
      throw new Error("No result from injected script");
    }

  } catch (error) {
    sendToServer({
      type: "upload_result",
      requestId: requestId,
      success: false,
      error: error.message
    });
  }
}

function sendToServer(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = function () {
    console.log("Connected to upload server");
    reconnectAttempts = 0;
    sendToServer({ type: "register_extension" });
  };

  ws.onmessage = function (event) {
    try {
      var message = JSON.parse(event.data);
      if (message.type === "upload_file") {
        handleUploadFile(message);
      }
    } catch (error) {
      console.error("Message parse error:", error);
    }
  };

  ws.onclose = function () {
    console.log("Disconnected from upload server");
    ws = null;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      var delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connect, delay);
    }
  };

  ws.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
}

connect();
console.log("MCP File Upload Helper loaded");
