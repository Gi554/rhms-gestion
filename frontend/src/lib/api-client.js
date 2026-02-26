import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem("accessToken", access);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const api = {
    // Auth
    login: (credentials) => apiClient.post("/api/auth/token/", credentials),
    refreshToken: (refresh) => apiClient.post("/api/auth/token/refresh/", { refresh }),
    getProfile: () => apiClient.get("/api/auth/me/"),
    updateProfile: (data) => apiClient.patch("/api/auth/me/update-profile/", data),
    changePassword: (data) => apiClient.post("/api/auth/me/change-password/", data),
    uploadPhoto: (formData) => apiClient.post("/api/auth/me/upload-photo/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    }),


    // Organizations
    getOrganizations: (params) => apiClient.get("/api/organizations/", { params }),
    getOrganization: (id) => apiClient.get(`/api/organizations/${id}/`),
    patchOrganization: (id, data) => apiClient.patch(`/api/organizations/${id}/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    getOrganizationStats: (id) => apiClient.get(`/api/organizations/${id}/stats/`),

    // Employees
    getEmployees: (params) => apiClient.get("/api/employees/", { params }),
    getEmployee: (id) => apiClient.get(`/api/employees/${id}/`),
    createEmployee: (data) => apiClient.post("/api/employees/", data),
    updateEmployee: (id, data) => apiClient.put(`/api/employees/${id}/`, data),
    patchEmployee: (id, data) => apiClient.patch(`/api/employees/${id}/`, data),
    deleteEmployee: (id) => apiClient.delete(`/api/employees/${id}/`),

    // Departments
    getDepartments: (params) => apiClient.get("/api/departments/", { params }),
    getDepartment: (id) => apiClient.get(`/api/departments/${id}/`),
    createDepartment: (data) => apiClient.post("/api/departments/", data),
    updateDepartment: (id, data) => apiClient.put(`/api/departments/${id}/`, data),
    deleteDepartment: (id) => apiClient.delete(`/api/departments/${id}/`),

    // Leave Types
    getLeaveTypes: (params) => apiClient.get("/api/leave-types/", { params }),

    // Leave Requests
    getLeaveRequests: (params) => apiClient.get("/api/leaves/", { params }),
    getLeaveRequest: (id) => apiClient.get(`/api/leaves/${id}/`),
    createLeaveRequest: (data) => apiClient.post("/api/leaves/", data),
    updateLeaveRequest: (id, data) => apiClient.put(`/api/leaves/${id}/`, data),
    deleteLeaveRequest: (id) => apiClient.delete(`/api/leaves/${id}/`),
    exportLeaves: (params) => apiClient.get("/api/leaves/export_csv/", { params, responseType: 'blob' }),
    approveLeaveRequest: (id) => apiClient.post(`/api/leaves/${id}/approve/`),
    rejectLeaveRequest: (id, data) => apiClient.post(`/api/leaves/${id}/reject/`, data),

    // Attendance
    getAttendances: (params) => apiClient.get("/api/attendances/", { params }),
    getAttendanceStatus: () => apiClient.get("/api/attendances/current_status/"),
    checkIn: (data) => apiClient.post("/api/attendances/check_in/", data),
    checkOut: (data) => apiClient.post("/api/attendances/check_out/", data),
    exportAttendances: (params) => apiClient.get("/api/attendances/export_csv/", { params, responseType: 'blob' }),

    // Documents
    getDocuments: (params) => apiClient.get("/api/documents/", { params }),
    uploadDocument: (data) => apiClient.post("/api/documents/", data, {
        headers: { "Content-Type": "multipart/form-data" },
    }),

    // Payroll
    getPayrolls: (params) => apiClient.get("/api/payrolls/", { params }),
    getMyPayrolls: () => apiClient.get("/api/payrolls/my_payrolls/"),
    generatePayrolls: (data) => apiClient.post("/api/payrolls/generate/", data),
    createPayroll: (data) => apiClient.post("/api/payrolls/", data),
    updatePayroll: (id, data) => apiClient.put(`/api/payrolls/${id}/`, data),
    deletePayroll: (id) => apiClient.delete(`/api/payrolls/${id}/`),

    // Widgets
    getProjects: () => apiClient.get("/api/projects/"),
    getEvents: (params) => apiClient.get("/api/events/", { params }),
    getEvent: (id) => apiClient.get(`/api/events/${id}/`),
    createEvent: (data) => apiClient.post("/api/events/", data),
    updateEvent: (id, data) => apiClient.put(`/api/events/${id}/`, data),
    deleteEvent: (id) => apiClient.delete(`/api/events/${id}/`),
    getOrganizationActivityChart: (id) => apiClient.get(`/api/organizations/${id}/activity_chart/`),

    // Notifications
    getNotifications: (params) => apiClient.get("/api/notifications/", { params }),
    markNotificationRead: (id) => apiClient.post(`/api/notifications/${id}/mark-read/`),
    markAllNotificationsRead: () => apiClient.post("/api/notifications/mark-all-read/"),

    // Screen Monitoring
    getCaptureSchedule: () => apiClient.get("/api/screen-capture-schedule/current/"),
    updateCaptureSchedule: (id, data) => apiClient.put(`/api/screen-capture-schedule/${id}/`, data),
    getScreenshots: (params) => apiClient.get("/api/screenshots/", { params }),
    getScreenshotStats: () => apiClient.get("/api/screenshots/stats/"),
    deleteScreenshot: (id) => apiClient.delete(`/api/screenshots/${id}/`),
    flagScreenshot: (id, data) => apiClient.patch(`/api/screenshots/${id}/flag/`, data),
    uploadScreenshot: (formData) => apiClient.post("/api/screenshots/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    }),
};

export default apiClient;
