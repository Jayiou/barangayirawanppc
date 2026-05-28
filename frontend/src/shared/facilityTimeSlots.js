const DEFAULT_OPERATING_HOURS = {
    start: '08:00',
    end: '24:00'
};

export const FACILITY_INVENTORY = {
    chair: 300,
    tent: 30,
    table: 20
};

export const FACILITY_ITEM_OPTIONS = [
    { value: 'barangay_hall', label: 'Barangay Hall', availableLabel: 'barangay halls', max: 1, isInventory: false },
    { value: 'multi_purpose_hall', label: 'Multi Purpose Hall', availableLabel: 'multi purpose halls', max: 1, isInventory: false },
    { value: 'covered_court', label: 'Covered Court', availableLabel: 'covered courts', max: 1, isInventory: false },
    { value: 'chair', label: 'Chair', availableLabel: 'chairs', max: FACILITY_INVENTORY.chair, isInventory: true },
    { value: 'tent', label: 'Tent', availableLabel: 'tents', max: FACILITY_INVENTORY.tent, isInventory: true },
    { value: 'table', label: 'Table', availableLabel: 'tables', max: FACILITY_INVENTORY.table, isInventory: true }
];

export const getFacilityItemOption = (value) => FACILITY_ITEM_OPTIONS.find((item) => item.value === value);

export const isInventoryFacilityOption = (value) => getFacilityItemOption(value)?.isInventory === true;

export const getFacilityItemLabel = (value) => {
    const option = FACILITY_ITEM_OPTIONS.find((item) => item.value === value);
    return option?.label || String(value || '').replaceAll('_', ' ');
};

export const getFacilityReservationQuantity = (reservation) => {
    const quantity = reservation?.quantity ?? reservation?.chairQuantity ?? reservation?.tentQuantity ?? reservation?.tableQuantity ?? 0;
    const parsedQuantity = Number(quantity);
    return Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
};

const STEP_MINUTES = 30;

export const toMinutes = (value) => {
    const normalized = String(value || '').trim();
    if (normalized === '24:00') {
        return 24 * 60;
    }

    const [hours, minutes] = normalized.split(':').map(Number);
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

export const getMinimumFacilityReservationDate = (daysAhead = 1) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysAhead);
    return date.toLocaleDateString('en-CA');
};

export const formatFacilityInventorySummary = (availability) => {
    if (!availability) {
        return '';
    }

    const selectedOption = getFacilityItemOption(availability.facilityName || availability.selectedAvailability?.facilityName);
    if (!selectedOption?.isInventory) {
        return '';
    }

    const inventory = availability.inventory || FACILITY_INVENTORY;
    const selected = availability.selectedAvailability || {};
    const selectedLabel = getFacilityItemLabel(availability.facilityName || selected.facilityName);
    const selectedAvailableQuantity = Number(selected.availableQuantity);
    const fallbackAvailableQuantity = Number(availability.availableQuantity);
    let available = null;
    if (Number.isFinite(selectedAvailableQuantity)) {
        available = selectedAvailableQuantity;
    } else if (Number.isFinite(fallbackAvailableQuantity)) {
        available = fallbackAvailableQuantity;
    }
    const selectedReservedQuantity = Number(selected.reservedQuantity);
    const fallbackReservedQuantity = Number(availability.reservedQuantity);
    let reserved = null;
    if (Number.isFinite(selectedReservedQuantity)) {
        reserved = selectedReservedQuantity;
    } else if (Number.isFinite(fallbackReservedQuantity)) {
        reserved = fallbackReservedQuantity;
    }
    const selectedTotalQuantity = Number(selected.inventoryQuantity);
    const fallbackTotalQuantity = Number(availability.inventoryQuantity);
    let total = null;
    if (Number.isFinite(selectedTotalQuantity)) {
        total = selectedTotalQuantity;
    } else if (Number.isFinite(fallbackTotalQuantity)) {
        total = fallbackTotalQuantity;
    } else {
        total = inventory[availability.facilityName] || null;
    }

    if (available === null || total === null) {
        return '';
    }

    const reservedText = reserved === null ? '' : ', ' + reserved + ' reserved';

    return selectedLabel + ': ' + available + ' available / ' + total + ' total' + reservedText + '.';
};

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const normalizeReservedSlots = (slots = []) => slots
    .map((slot) => ({
        ...slot,
        start: toMinutes(slot.startTime),
        end: toMinutes(slot.endTime),
        quantity: getFacilityReservationQuantity(slot)
    }))
    .filter((slot) => slot.start !== null && slot.end !== null && slot.start < slot.end);

const rangeIsOpen = (start, end, reservedSlots) => !reservedSlots.some((slot) => rangesOverlap(start, end, slot.start, slot.end));

const getInventoryAvailabilityForRange = (start, end, reservedSlots, inventoryQuantity) => {
    if (!Number.isFinite(inventoryQuantity)) {
        return null;
    }

    let lowestAvailable = inventoryQuantity;

    for (let current = start; current < end; current += STEP_MINUTES) {
        const slotEnd = Math.min(current + STEP_MINUTES, end);
        const reservedQuantity = reservedSlots
            .filter((slot) => rangesOverlap(current, slotEnd, slot.start, slot.end))
            .reduce((total, slot) => total + slot.quantity, 0);

        lowestAvailable = Math.min(lowestAvailable, Math.max(inventoryQuantity - reservedQuantity, 0));
    }

    return lowestAvailable;
};

export const buildFacilityTimeOptions = (availability, selectedStartTime = '') => {
    const operatingHours = availability?.operatingHours || DEFAULT_OPERATING_HOURS;
    const operatingStart = toMinutes(operatingHours.start) ?? toMinutes(DEFAULT_OPERATING_HOURS.start);
    const operatingEnd = toMinutes(operatingHours.end) ?? toMinutes(DEFAULT_OPERATING_HOURS.end);
    const reservedSlots = normalizeReservedSlots(availability?.reservedSlots || []);
    const selectedOption = getFacilityItemOption(availability?.facilityName);
    const inventoryQuantity = Number(availability?.inventoryQuantity);
    const isInventoryView = selectedOption?.isInventory === true && Number.isFinite(inventoryQuantity);
    const selectedStart = toMinutes(selectedStartTime);

    const startOptions = [];
    const endOptions = [];

    for (let current = operatingStart; current < operatingEnd; current += STEP_MINUTES) {
        const hasValidEnd = current + STEP_MINUTES <= operatingEnd;
        const availableQuantity = isInventoryView
            ? getInventoryAvailabilityForRange(current, current + STEP_MINUTES, reservedSlots, inventoryQuantity)
            : null;

        startOptions.push({
            value: minutesToTime(current),
            label: formatFacilityTime(minutesToTime(current)),
            disabled: !hasValidEnd || (availableQuantity !== null && availableQuantity <= 0)
        });
    }

    if (selectedStart !== null) {
        for (let current = selectedStart + STEP_MINUTES; current <= operatingEnd; current += STEP_MINUTES) {
            const availableQuantity = isInventoryView
                ? getInventoryAvailabilityForRange(selectedStart, current, reservedSlots, inventoryQuantity)
                : null;

            endOptions.push({
                value: minutesToTime(current),
                label: formatFacilityTime(minutesToTime(current)),
                disabled: availableQuantity !== null && availableQuantity <= 0
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
