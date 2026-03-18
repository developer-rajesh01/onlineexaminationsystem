import API_BASE_URL from "../config/api";

const apiClient = async (endpoint, options = {}) => {

    const token = localStorage.getItem("token");

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);

    // session expired handling
    if (response.status === 401) {

        alert("Session expired. You logged in from another device.");

        localStorage.clear();
        sessionStorage.clear();
        window.location.href = window.location.origin + "/onlineexaminationsystem/login";
        return;
    }

    return response.json();
};

export default apiClient;