import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE_URL } from "./api-client"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function formatDate(date) {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

export function formatDateTime(date) {
    if (!date) return '---';
    return new Date(date).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function getMediaUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
}
