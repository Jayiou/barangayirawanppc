import { ref, onUnmounted } from 'vue';
import { apiFetch } from '@/shared/client';

export function useReportNotifications() {
    const lastCheckTime = ref(new Date());
    const unreadReports = ref([]);
    let pollInterval = null;
    let sharedAudioContext = null;
    let audioListenersAttached = false;

    const getAudioContext = () => {
        if (!sharedAudioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return null;
            }
            sharedAudioContext = new AudioContextClass();
        }
        return sharedAudioContext;
    };

    const primeAudioContext = async () => {
        try {
            const audioContext = getAudioContext();
            if (!audioContext || audioContext.state === 'running') {
                return;
            }

            await audioContext.resume();
        } catch {
            // Ignore autoplay policy failures; the next interaction may unlock audio.
        }
    };

    const attachAudioListeners = () => {
        if (audioListenersAttached) {
            return;
        }

        audioListenersAttached = true;
        ['pointerdown', 'touchstart', 'keydown', 'mousedown'].forEach((eventName) => {
            window.addEventListener(eventName, primeAudioContext, { passive: true, once: false });
        });
    };

    const detachAudioListeners = () => {
        if (!audioListenersAttached) {
            return;
        }

        audioListenersAttached = false;
        ['pointerdown', 'touchstart', 'keydown', 'mousedown'].forEach((eventName) => {
            window.removeEventListener(eventName, primeAudioContext);
        });
    };

    // Create a stronger notification sound pattern.
    const playAlertSound = () => {
        try {
            const audioContext = getAudioContext();
            if (!audioContext) {
                return;
            }

            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }

            const sequence = [
                { at: 0.0, frequency: 880, duration: 0.2, gain: 0.22 },
                { at: 0.28, frequency: 1047, duration: 0.2, gain: 0.24 },
                { at: 0.56, frequency: 1318, duration: 0.24, gain: 0.26 }
            ];

            sequence.forEach((tone) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(tone.frequency, audioContext.currentTime + tone.at);
                gainNode.gain.setValueAtTime(0.001, audioContext.currentTime + tone.at);
                gainNode.gain.linearRampToValueAtTime(tone.gain, audioContext.currentTime + tone.at + 0.03);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + tone.at + tone.duration);

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.start(audioContext.currentTime + tone.at);
                oscillator.stop(audioContext.currentTime + tone.at + tone.duration + 0.02);
            });
        } catch (error) {
            console.log('Could not play notification sound:', error.message);
        }
    };

    const getLatestCreatedAt = (reports = []) => {
        let latest = null;
        reports.forEach((report) => {
            const createdAt = report?.createdAt ? new Date(report.createdAt) : null;
            if (!createdAt || Number.isNaN(createdAt.getTime())) {
                return;
            }
            if (!latest || createdAt > latest) {
                latest = createdAt;
            }
        });
        return latest;
    };

    // Check for new reports since last check.
    const checkForNewReports = async () => {
        try {
            const now = new Date();
            const response = await apiFetch('/reports');
            
            if (!Array.isArray(response)) {
                return [];
            }

            const newReports = response.filter(report => {
                const createdAt = new Date(report.createdAt);
                return createdAt > lastCheckTime.value && report.status === 'pending';
            });

            const latestCreatedAt = getLatestCreatedAt(response);
            lastCheckTime.value = latestCreatedAt || now;

            if (newReports.length > 0) {
                playAlertSound();
                unreadReports.value = newReports;
                return newReports;
            }

            return [];
        } catch (error) {
            console.error('Error checking for new reports:', error);
            return [];
        }
    };

    // Start polling for new reports while admin is authenticated.
    const startNotificationPolling = async () => {
        attachAudioListeners();
        const currentReports = await apiFetch('/reports').catch(() => []);
        if (Array.isArray(currentReports)) {
            const latestCreatedAt = getLatestCreatedAt(currentReports);
            if (latestCreatedAt) {
                lastCheckTime.value = latestCreatedAt;
            }
        }

        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }

        pollInterval = setInterval(() => {
            checkForNewReports();
        }, 5000);
    };

    const stopNotificationPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }

        detachAudioListeners();
    };

    const clearUnreadReports = () => {
        unreadReports.value = [];
    };

    onUnmounted(() => {
        stopNotificationPolling();
    });

    return {
        unreadReports,
        playAlertSound,
        primeAudioContext,
        checkForNewReports,
        startNotificationPolling,
        stopNotificationPolling,
        clearUnreadReports
    };
}
