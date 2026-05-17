import { ref, onUnmounted } from 'vue';
import { apiFetch } from '@/shared/client';

export function useReportNotifications() {
    const lastCheckTime = ref(new Date());
    const unreadReports = ref([]);
    let pollInterval = null;
    let sharedAudioContext = null;
    let audioListenersAttached = false;
    let customAudioElement = null;

    const getAudioContext = () => {
        if (!sharedAudioContext) {
            const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
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
            globalThis.addEventListener(eventName, primeAudioContext, { passive: true, once: false });
        });
    };

    const detachAudioListeners = () => {
        if (!audioListenersAttached) {
            return;
        }

        audioListenersAttached = false;
        ['pointerdown', 'touchstart', 'keydown', 'mousedown'].forEach((eventName) => {
            globalThis.removeEventListener(eventName, primeAudioContext);
        });
    };

    // Custom sound config stored in localStorage so admin can provide their own file/url.
    const getCustomSoundConfig = () => {
        try {
            const url = globalThis.localStorage.getItem('adminAlertSoundUrl');
            const loopRaw = globalThis.localStorage.getItem('adminAlertSoundLoop');
            const volumeRaw = globalThis.localStorage.getItem('adminAlertSoundVolume');
            const loop = loopRaw === 'true';
            const volume = volumeRaw ? Math.max(0, Math.min(2, Number(volumeRaw))) : 1;
            if (url) {
                return { url, loop, volume };
            }
        } catch (e) {
            // ignore
        }
        return null;
    };

    const setCustomSound = (url, { loop = true, volume = 1 } = {}) => {
        try {
            if (!url) {
                globalThis.localStorage.removeItem('adminAlertSoundUrl');
                globalThis.localStorage.removeItem('adminAlertSoundLoop');
                globalThis.localStorage.removeItem('adminAlertSoundVolume');
                if (customAudioElement) {
                    try { customAudioElement.pause(); } catch {}
                    customAudioElement = null;
                }
                return true;
            }
            globalThis.localStorage.setItem('adminAlertSoundUrl', url);
            globalThis.localStorage.setItem('adminAlertSoundLoop', String(Boolean(loop)));
            globalThis.localStorage.setItem('adminAlertSoundVolume', String(Number(volume) || 1));
            return true;
        } catch (e) {
            return false;
        }
    };

    const playFallbackToneSequence = (audioContext) => {
        if (!audioContext) {
            return;
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const sequence = [
            { at: 0, frequency: 784, duration: 0.25, gain: 0.36 },
            { at: 0.28, frequency: 988, duration: 0.25, gain: 0.44 },
            { at: 0.56, frequency: 1175, duration: 0.3, gain: 0.5 }
        ];

        sequence.forEach((tone) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(tone.frequency, audioContext.currentTime + tone.at);
            gainNode.gain.setValueAtTime(0.001, audioContext.currentTime + tone.at);
            gainNode.gain.linearRampToValueAtTime(tone.gain, audioContext.currentTime + tone.at + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + tone.at + tone.duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start(audioContext.currentTime + tone.at);
            oscillator.stop(audioContext.currentTime + tone.at + tone.duration + 0.02);
        });
    };

    const playCustomAlertSound = async (cfg, audioContext) => {
        if (!cfg?.url) {
            return false;
        }

        if (audioContext?.state === 'suspended') {
            await audioContext.resume().catch(() => {});
        }

        if (customAudioElement && customAudioElement.src !== cfg.url) {
            try { customAudioElement.pause(); } catch {}
            customAudioElement = null;
        }

        if (!customAudioElement) {
            customAudioElement = new Audio(cfg.url);
            customAudioElement.loop = Boolean(cfg.loop);
            customAudioElement.preload = 'auto';
            customAudioElement.playsInline = true;
            customAudioElement.crossOrigin = 'anonymous';

            if (audioContext) {
                try {
                    const source = audioContext.createMediaElementSource(customAudioElement);
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = Math.max(0, Math.min(2, cfg.volume || 1));
                    source.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                } catch {
                    customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
                }
            } else {
                customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
            }
        }

        customAudioElement.loop = Boolean(cfg.loop);
        customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
        customAudioElement.currentTime = 0;
        try {
            await customAudioElement.play();
            return true;
        } catch (error) {
            try { customAudioElement.pause(); } catch {}
            customAudioElement = null;
            console.warn('Custom alert sound play blocked or failed:', error?.message || error);
            return false;
        }
    };

    // Create a stronger notification sound pattern.
    const playAlertSound = async () => {
        try {
            const audioContext = getAudioContext();
            const cfg = getCustomSoundConfig();

            if (cfg?.url) {
                const played = await playCustomAlertSound(cfg, audioContext);
                if (played) {
                    return;
                }
            }

            playFallbackToneSequence(audioContext);
        } catch (error) {
            console.log('Could not play notification sound:', error.message);
        }
    };

    const stopAlertSound = () => {
        if (customAudioElement) {
            try {
                customAudioElement.pause();
                customAudioElement.currentTime = 0;
            } catch {}
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
        if (customAudioElement) {
            try { customAudioElement.pause(); } catch {}
            customAudioElement = null;
        }
    };

    const clearUnreadReports = () => {
        unreadReports.value = [];
    };

    onUnmounted(() => {
        stopNotificationPolling();
    });

    // Register unlock listeners immediately so the first admin interaction can
    // prime audio before the first report notification arrives.
    attachAudioListeners();

    return {
        unreadReports,
        playAlertSound,
        stopAlertSound,
        primeAudioContext,
        checkForNewReports,
        startNotificationPolling,
        stopNotificationPolling,
        clearUnreadReports,
        setCustomSound,
        getCustomSoundConfig
    };
}
