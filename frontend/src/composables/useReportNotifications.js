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

    // Custom sound config stored in localStorage so admin can provide their own file/url.
    const getCustomSoundConfig = () => {
        try {
            const url = window.localStorage.getItem('adminAlertSoundUrl');
            const loopRaw = window.localStorage.getItem('adminAlertSoundLoop');
            const volumeRaw = window.localStorage.getItem('adminAlertSoundVolume');
            const loop = loopRaw === 'true';
            const volume = volumeRaw ? Math.max(0, Math.min(2, Number(volumeRaw))) : 1.0;
            if (url) {
                return { url, loop, volume };
            }
        } catch (e) {
            // ignore
        }
        return null;
    };

    const setCustomSound = (url, { loop = true, volume = 1.0 } = {}) => {
        try {
            if (!url) {
                window.localStorage.removeItem('adminAlertSoundUrl');
                window.localStorage.removeItem('adminAlertSoundLoop');
                window.localStorage.removeItem('adminAlertSoundVolume');
                if (customAudioElement) {
                    try { customAudioElement.pause(); } catch {}
                    customAudioElement = null;
                }
                return true;
            }
            window.localStorage.setItem('adminAlertSoundUrl', url);
            window.localStorage.setItem('adminAlertSoundLoop', String(Boolean(loop)));
            window.localStorage.setItem('adminAlertSoundVolume', String(Number(volume) || 1));
            return true;
        } catch (e) {
            return false;
        }
    };

    // Create a stronger notification sound pattern.
    const playAlertSound = () => {
        try {
            const audioContext = getAudioContext();

            // If admin provided a custom sound URL, try to play that (with loop/volume).
            const cfg = getCustomSoundConfig();
            if (cfg && cfg.url) {
                try {
                    awaitPrime: {
                        if (audioContext && audioContext.state === 'suspended') {
                            audioContext.resume().catch(() => {});
                        }
                    }

                    // Reuse element when looping to avoid multiple sources.
                    if (customAudioElement && customAudioElement.src !== cfg.url) {
                        try { customAudioElement.pause(); } catch {}
                        customAudioElement = null;
                    }

                    if (!customAudioElement) {
                        customAudioElement = new Audio(cfg.url);
                        customAudioElement.loop = Boolean(cfg.loop);
                        customAudioElement.preload = 'auto';
                        customAudioElement.crossOrigin = 'anonymous';

                        // If WebAudio is available, route through AudioContext to allow gain control.
                        if (audioContext) {
                            try {
                                const source = audioContext.createMediaElementSource(customAudioElement);
                                const gainNode = audioContext.createGain();
                                // Clamp volume to [0,2] but HTML element volume is [0,1]. Use gain for extra loudness.
                                const gainVal = Math.max(0, Math.min(2, cfg.volume || 1));
                                gainNode.gain.value = gainVal;
                                source.connect(gainNode);
                                gainNode.connect(audioContext.destination);
                            } catch (e) {
                                // fall back to element volume if source creation fails
                                customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
                            }
                        } else {
                            customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
                        }
                    }

                    // Play (may be blocked until user interacts; primeAudioContext handles that)
                    customAudioElement.play().catch(() => {});
                    return;
                } catch (err) {
                    // if custom sound fails, fallback to tone sequence below
                    console.warn('Custom alert sound failed, falling back to tones', err && err.message);
                }
            }

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

    return {
        unreadReports,
        playAlertSound,
        primeAudioContext,
        checkForNewReports,
        startNotificationPolling,
        stopNotificationPolling,
        clearUnreadReports,
        setCustomSound,
        getCustomSoundConfig
    };
}
