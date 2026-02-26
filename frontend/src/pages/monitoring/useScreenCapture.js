import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api-client';

export function useScreenCapture(userProfile) {
    const [isEnabled, setIsEnabled] = useState(false);
    const scheduleRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const timeoutsRef = useRef([]);

    useEffect(() => {
        const initCapture = async () => {
            // Only employees should be captured
            const role = userProfile?.organizations?.[0]?.role || 'employee';
            if (role !== 'employee') return;

            try {
                // Fetch current organization's schedule
                const response = await api.getCaptureSchedule();
                const schedule = response.data;

                if (!schedule.is_enabled) return;

                scheduleRef.current = schedule;
                setIsEnabled(true);

                // Request Screen Share Permission
                if (!mediaStreamRef.current) {
                    try {
                        const stream = await navigator.mediaDevices.getDisplayMedia({
                            video: { cursor: "always" },
                            audio: false
                        });
                        mediaStreamRef.current = stream;

                        // Handle user stopping the share manually
                        stream.getVideoTracks()[0].onended = () => {
                            mediaStreamRef.current = null;
                            // Optionally, notify admin that employee stopped sharing
                            console.warn("Screen sharing stopped by user");
                        };

                        scheduleCaptures(schedule);
                    } catch (err) {
                        console.error("Employee denied screen share permission", err);
                        // Admin would typically be notified here via another API
                    }
                }
            } catch (err) {
                console.error("Failed to fetch capture schedule", err);
            }
        };

        if (userProfile) {
            initCapture();
        }

        return () => {
            // Cleanup
            timeoutsRef.current.forEach(clearTimeout);
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [userProfile]);

    const scheduleCaptures = (schedule) => {
        // Clear existing timeouts
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        const now = new Date();
        const startParts = schedule.work_start.split(':');
        const endParts = schedule.work_end.split(':');

        let startTime = new Date(now);
        startTime.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);

        let endTime = new Date(now);
        endTime.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);

        // If current time is outside work hours, or work hours already passed today, don't schedule
        if (now > endTime) return;

        // If we started late, adjust start time
        if (now > startTime) {
            startTime = now;
        }

        const timeWindowMs = endTime.getTime() - startTime.getTime();
        const capturesPerDay = schedule.captures_per_day;

        for (let i = 0; i < capturesPerDay; i++) {
            // Random delay within the remaining available time today
            const randomDelay = Math.random() * timeWindowMs;

            const timeoutId = setTimeout(() => {
                captureAndUpload();
            }, randomDelay);

            timeoutsRef.current.push(timeoutId);
        }
    };

    const captureAndUpload = async () => {
        if (!mediaStreamRef.current) return;

        try {
            const track = mediaStreamRef.current.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();

            // Draw bitmap to canvas to get standard image blob
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);

            canvas.toBlob(async (blob) => {
                if (blob) {
                    const formData = new FormData();
                    formData.append('image', blob, `capture_${Date.now()}.png`);

                    try {
                        await api.uploadScreenshot(formData);
                    } catch (err) {
                        console.error("Failed to upload screenshot", err);
                    }
                }
            }, 'image/png');

        } catch (err) {
            console.error("Failed to capture screen frame", err);
        }
    };

    return { isEnabled };
}
