const DEFAULT_OPERATING_HOURS = {
    start: '08:00',
    end: '17:00'
};

const STEP_MINUTES = 30;

export const toMinutes = (value) => {
    const [hours, minutes] = String(value || '').split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
    }
    return (hours * 60) + minutes;
};

export const minutesToTime = (minutes) => {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
};

export const formatFacilityTime = (value) => {
    const minutes = toMinutes(value);
    if (minutes === null) {
        return 'N/A';
    }

    const date = new Date();
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatFacilityRange = (startTime, endTime) => `${formatFacilityTime(startTime)} - ${formatFacilityTime(endTime)}`;

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const normalizeReservedSlots = (slots = []) => slots
    .map((slot) => ({
        ...slot,
        start: toMinutes(slot.startTime),
        end: toMinutes(slot.endTime)
    }))
    .filter((slot) => slot.start !== null && slot.end !== null && slot.start < slot.end);

const rangeIsOpen = (start, end, reservedSlots) => !reservedSlots.some((slot) => rangesOverlap(start, end, slot.start, slot.end));

export const buildFacilityTimeOptions = (availability, selectedStartTime = '') => {
    const operatingHours = availability?.operatingHours || DEFAULT_OPERATING_HOURS;
    const operatingStart = toMinutes(operatingHours.start) ?? toMinutes(DEFAULT_OPERATING_HOURS.start);
    const operatingEnd = toMinutes(operatingHours.end) ?? toMinutes(DEFAULT_OPERATING_HOURS.end);
    const reservedSlots = normalizeReservedSlots(availability?.reservedSlots || []);
    const selectedStart = toMinutes(selectedStartTime);

    const startOptions = [];
    const endOptions = [];

    for (let current = operatingStart; current < operatingEnd; current += STEP_MINUTES) {
        const hasValidEnd = Array.from(
            { length: Math.floor((operatingEnd - current) / STEP_MINUTES) },
            (_, index) => current + ((index + 1) * STEP_MINUTES)
        ).some((end) => rangeIsOpen(current, end, reservedSlots));

        startOptions.push({
            value: minutesToTime(current),
            label: formatFacilityTime(minutesToTime(current)),
            disabled: !hasValidEnd
        });
    }

    if (selectedStart !== null) {
        for (let current = selectedStart + STEP_MINUTES; current <= operatingEnd; current += STEP_MINUTES) {
            endOptions.push({
                value: minutesToTime(current),
                label: formatFacilityTime(minutesToTime(current)),
                disabled: !rangeIsOpen(selectedStart, current, reservedSlots)
            });
        }
    }

    return {
        operatingHours,
        operatingHoursLabel: formatFacilityRange(operatingHours.start, operatingHours.end),
        reservedSlots,
        startOptions,
        endOptions
    };
};
