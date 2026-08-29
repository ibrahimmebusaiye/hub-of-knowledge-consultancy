(function () {
    "use strict";
    var form = document.getElementById("contact-form");
    var message = document.getElementById("form-message");
    if (!form || !message) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var button = form.querySelector('button[type="submit"]');
        var data = Object.fromEntries(new FormData(form).entries());
        data.sessionId = window.HOKAnalytics && window.HOKAnalytics.sessionId ? window.HOKAnalytics.sessionId : sessionStorage.getItem("hok_session_id") || undefined;
        message.className = "mt-4 text-sm text-center text-slate-600";
        message.textContent = "Sending your enquiry…";
        button.disabled = true;
        button.classList.add("opacity-60", "cursor-wait");

        try {
            var response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "same-origin" });
            var body = await response.json();
            if (!response.ok) throw new Error(body.error && body.error.message ? body.error.message : "Your enquiry could not be sent.");
            message.className = "mt-4 text-sm text-center text-green-700 font-semibold";
            message.textContent = body.data.message;
            form.reset();
        } catch (error) {
            message.className = "mt-4 text-sm text-center text-red-600 font-semibold";
            message.textContent = error.message || "Your enquiry could not be sent. Please try again.";
        } finally {
            button.disabled = false;
            button.classList.remove("opacity-60", "cursor-wait");
        }
    });
})();
