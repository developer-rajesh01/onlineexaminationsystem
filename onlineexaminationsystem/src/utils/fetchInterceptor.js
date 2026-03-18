import API_BASE_URL from "../config/api";

const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {

    const token = localStorage.getItem("token");

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };

    // automatically prepend base url if needed
    if (typeof url === "string" && !url.startsWith("http")) {
        url = `${API_BASE_URL}${url}`;
    }

    const response = await originalFetch(url, config);

    // handle session expiration
    if (response.status === 401) {

        alert("Session expired. You logged in from another device.");

        localStorage.clear();
        sessionStorage.clear();
        window.location.href = window.location.origin + "/onlineexaminationsystem/login";
    }

    return response;
};