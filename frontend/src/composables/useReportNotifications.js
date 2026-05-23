import { ref, onUnmounted } from 'vue';
import { apiFetch } from '@/shared/client';

export function useReportNotifications() {
    const lastCheckTime = ref(new Date());
    const unreadReports = ref([]);
    let pollInterval = null;
    let sharedAudioContext = null;
    let audioListenersAttached = false;
    let customAudioElement = null;
    let playbackSessionId = 0;
    let fallbackOscillators = [];
    const defaultAlertSound = {
        url: '/uploads/adminSound-1779017460161-656986062.mp3',
        loop: false,
        volume: 1
    };

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

    const getCustomSoundConfig = () => {
        return defaultAlertSound;
    };

    const setCustomSound = (url, { loop = true, volume = 1 } = {}) => {
        try {
            if (!url) {
                globalThis.localStorage.removeItem('adminAlertSoundUrl');
                globalThis.localStorage.removeItem('adminAlertSoundLoop');
                globalThis.localStorage.removeItem('adminAlertSoundVolume');
                playbackSessionId += 1;
                stopFallbackPlayback();
                if (customAudioElement) {
                    try { customAudioElement.pause(); } catch {}
                    try { customAudioElement.currentTime = 0; } catch {}
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

    const stopFallbackPlayback = () => {
        if (fallbackOscillators.length > 0) {
            fallbackOscillators.forEach(({ oscillator }) => {
                try {
                    oscillator.stop();
                } catch {}
                try {
                    oscillator.disconnect();
                } catch {}
            });
            fallbackOscillators = [];
        }
    };

    const createFallbackTone = (audioContext, tone) => {
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

        fallbackOscillators.push({ oscillator });
    };

    const stopCustomAudioPlayback = () => {
        if (!customAudioElement) {
            return;
        }

        try { customAudioElement.pause(); } catch {}
        try { customAudioElement.currentTime = 0; } catch {}
    };

    const clearCustomAudioElement = () => {
        stopCustomAudioPlayback();
        customAudioElement = null;
    };

    const ensureCustomAudioElement = (cfg, audioContext) => {
        if (customAudioElement && customAudioElement.src !== cfg.url) {
            clearCustomAudioElement();
        }

        if (customAudioElement) {
            return;
        }

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
                return;
            } catch {
                // Fall back to the element volume if the audio graph is unavailable.
            }
        }

        customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
    };

    const resumeAudioContextIfNeeded = async (audioContext) => {
        if (audioContext?.state === 'suspended') {
            await audioContext.resume().catch(() => {});
        }
    };

    const applyCustomAudioSettings = (cfg) => {
        customAudioElement.loop = Boolean(cfg.loop);
        customAudioElement.volume = Math.max(0, Math.min(1, cfg.volume || 1));
        customAudioElement.currentTime = 0;
    };

    const playPreparedCustomAudio = async (sessionId) => {
        try {
            await customAudioElement.play();
            return finalizeCustomAudioPlayback(sessionId);
        } catch (error) {
            clearCustomAudioElement();
            console.warn('Custom alert sound play blocked or failed:', error?.message || error);
            return false;
        }
    };

    const isCurrentPlaybackSession = (sessionId) => sessionId === playbackSessionId;

    const finalizeCustomAudioPlayback = (sessionId) => {
        if (isCurrentPlaybackSession(sessionId)) {
            return true;
        }

        stopCustomAudioPlayback();
        return false;
    };

    const playFallbackToneSequence = (audioContext, sessionId) => {
        if (!audioContext) {
            return;
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        stopFallbackPlayback();

        const sequence = [
            { at: 0, frequency: 784, duration: 0.25, gain: 0.36 },
            { at: 0.28, frequency: 988, duration: 0.25, gain: 0.44 },
            { at: 0.56, frequency: 1175, duration: 0.3, gain: 0.5 }
        ];

        sequence.forEach((tone) => {
            if (sessionId === playbackSessionId) {
                createFallbackTone(audioContext, tone);
            }
        });
    };

    const playCustomAlertSound = async (cfg, audioContext, sessionId) => {
        if (!cfg?.url) {
            return false;
        }

        await resumeAudioContextIfNeeded(audioContext);
        ensureCustomAudioElement(cfg, audioContext);
        applyCustomAudioSettings(cfg);
        return playPreparedCustomAudio(sessionId);
    };

    // Create a stronger notification sound pattern.
    const playAlertSound = async () => {
        const sessionId = ++playbackSessionId;
        stopFallbackPlayback();
        stopCustomAudioPlayback();

        try {
            const audioContext = getAudioContext();
            const cfg = getCustomSoundConfig();

            // If admin provided a custom sound, prefer it and do NOT play
            // the fallback oscillator tones. Retry once briefly if the
            // initial play attempt is blocked, but avoid falling back to
            // the tone sequence so the uploaded audio is the single source.
            if (cfg?.url) {
                const played = await playCustomAlertSound(cfg, audioContext, sessionId);
                if (played) {
                    return;
                }

                // short retry window for transient resume/autoplay issues
                await new Promise((res) => setTimeout(res, 250));
                if (isCurrentPlaybackSession(sessionId)) {
                    const retried = await playCustomAlertSound(cfg, audioContext, sessionId);
                    if (retried) {
                        return;
                    }
                }

                // If custom audio cannot be played after retries, stop here
                // instead of playing the fallback tone so admin-uploaded
                // audio remains the authoritative alert.
                return;
            }

            if (sessionId === playbackSessionId) {
                playFallbackToneSequence(audioContext, sessionId);
            }
        } catch (error) {
            console.log('Could not play notification sound:', error.message);
        }
    };

    const stopAlertSound = () => {
        playbackSessionId += 1;
        stopFallbackPlayback();
        stopCustomAudioPlayback();
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

        playbackSessionId += 1;
        stopFallbackPlayback();
        detachAudioListeners();
        clearCustomAudioElement();
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
