interface RequestSummary {
  origin: string;
  method: string;
  headers: string;
}

type RequestId = string;
const pendingRequests: Record<RequestId, RequestSummary> = {};

chrome.webRequest.onSendHeaders.addListener(
  ({ type, initiator, requestId, method, requestHeaders }) => {
    if (type === "main_frame") return;
    let origin: string;
    try {
      const { hostname, origin: _origin } = new URL(initiator);
      if (!["webserver.run"].includes(hostname)) return;
      origin = _origin;
    } catch {
      return;
    }
    const headers =
      requestHeaders.find(({ name }) => name.toLowerCase() === "access-control-request-headers")?.value ?? "";
    pendingRequests[requestId] = { origin, method, headers };
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.webRequest.onHeadersReceived.addListener(
  ({ requestId, responseHeaders }) => {
    if (!(requestId in pendingRequests)) return;
    const { origin, method, headers } = pendingRequests[requestId];
    delete pendingRequests[requestId];
    responseHeaders = responseHeaders.filter(({ name }) => !/^access-control-/i.test(name));
    responseHeaders.push({ name: "access-control-allow-credentials", value: "true" });
    responseHeaders.push({ name: "access-control-allow-headers", value: headers });
    responseHeaders.push({ name: "access-control-allow-methods", value: method });
    responseHeaders.push({ name: "access-control-allow-origin", value: origin });
    responseHeaders.push({
      name: "access-control-expose-headers",
      value: responseHeaders.map(({ name }) => name).join(", "),
    });
    return { responseHeaders };
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["blocking", "responseHeaders", "extraHeaders"]
);
