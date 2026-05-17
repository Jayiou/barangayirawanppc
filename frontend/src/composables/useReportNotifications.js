import { ref, onMounted, onUnmounted } from 'vue';
import { apiFetch } from '@/shared/client';

export function useReportNotifications() {
    const lastCheckTime = ref(new Date());
    const unreadReports = ref([]);
    let pollInterval = null;

    // Create a sound alert (using Web Audio API)
    const playAlertSound = () => {
        try {
            // Create an audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Set up a two-tone alert sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play notification sound:', error.message);
        }
    };

    // Check for new reports since last check
    const checkForNewReports = async () => {
        try {
            const now = new Date();
            const response = await apiFetch('/reports');
            
            if (!Array.isArray(response)) {
                return;
            }

            // Find reports created after last check time
            const newReports = response.filter(report => {
                const createdAt = new Date(report.createdAt);
                return createdAt > lastCheckTime.value && report.status === 'pending';
            });

            if (newReports.length > 0) {
                // Play sound
                playAlertSound();
                
                // Store unread reports
                unreadReports.value = newReports;
                
                // Return the new reports for the caller to handle (show toast, highlight, etc)
                return newReports;
            }

            lastCheckTime.value = now;
            return [];
        } catch (error) {
            console.error('Error checking for new reports:', error);
            return [];
        }
    };

    // Start polling for new reports (every 5 seconds while admin is on site)
    const startNotificationPolling = () => {
        // Do first check immediately
        checkForNewReports();

        // Then poll every 5 seconds
        pollInterval = setInterval(() => {
            checkForNewReports();
        }, 5000);
    };

    // Stop polling when admin leaves
    const stopNotificationPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };

    // Clear unread reports after admin views them
    const clearUnreadReports = () => {
        unreadReports.value = [];
    };

    onUnmounted(() => {
        stopNotificationPolling();
    });

    return {
        unreadReports,
        playAlertSound,
        checkForNewReports,
        startNotificationPolling,
        stopNotificationPolling,
        clearUnreadReports
    };
}
