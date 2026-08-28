(function () {
    "use strict";

    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1") return;

    var VISITOR_KEY = "hok_visitor_id";
    var SESSION_KEY = "hok_session_id";

    function uuid() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (character) {
            return (character ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> character / 4).toString(16);
        });
    }

    function stored(storage, key) {
        try { var value = storage.getItem(key); if (!value) { value = uuid(); storage.setItem(key, value); } return value; }
        catch (_) { return uuid(); }
    }

    var visitorId = stored(localStorage, VISITOR_KEY);
    var sessionId = stored(sessionStorage, SESSION_KEY);
    var parameters = new URLSearchParams(window.location.search);
    var payload = {
        visitorId: visitorId,
        sessionId: sessionId,
        page: window.location.pathname,
        pageTitle: document.title,
        referrer: document.referrer || "",
        utmSource: parameters.get("utm_source") || "",
        utmMedium: parameters.get("utm_medium") || "",
        utmCampaign: parameters.get("utm_campaign") || "",
        utmContent: parameters.get("utm_content") || "",
        utmTerm: parameters.get("utm_term") || ""
    };

    window.HOKAnalytics = { visitorId: visitorId, sessionId: sessionId };
    fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true, credentials: "same-origin" }).catch(function () { /* Analytics must never interrupt the website. */ });
})();
