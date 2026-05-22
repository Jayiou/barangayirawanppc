const workflows = {
    facilityReservation: {
        pending: ['approved', 'rejected', 'cancelled'],
        approved: ['completed', 'rescheduled', 'rejected'],
        rescheduled: ['completed', 'rejected'],
        rejected: [],
        completed: [],
        cancelled: []
    },
    report: {
        pending: ['reviewing', 'rejected'],
        reviewing: ['in_progress', 'rejected'],
        in_progress: ['resolved', 'rejected'],
        resolved: ['closed'],
        rejected: [],
        closed: []
    },
    documentRequest: {
        pending: ['approved', 'rejected'],
        approved: ['processing'],
        processing: ['ready_for_pickup'],
        ready_for_pickup: ['completed'],
        rejected: [],
        completed: []
    },
    user: {
        pending_approval: ['approved', 'rejected'],
        approved: [],
        rejected: []
    },
    blotter: {
        draft: ['recorded', 'rejected'],
        recorded: ['investigating', 'resolved'],
        investigating: ['resolved', 'closed'],
        resolved: ['closed'],
        closed: []
    },
    manpowerRequest: {
        pending: ['approved', 'rejected'],
        approved: ['assigned', 'cancelled'],
        assigned: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        rejected: [],
        cancelled: []
    }
};

const isValidTransition = (entityType, currentStatus, newStatus) => {
    if (!workflows[entityType]) {
        return false;
    }

    if (!workflows[entityType][currentStatus]) {
        return false;
    }

    // Allow staying in the same status
    if (currentStatus === newStatus) {
        return true;
    }

    return workflows[entityType][currentStatus].includes(newStatus);
};

const getValidTransitions = (entityType, currentStatus) => {
    if (!workflows[entityType]?.[currentStatus]) {
        return [];
    }
    return workflows[entityType][currentStatus];
};

module.exports = {
    workflows,
    isValidTransition,
    getValidTransitions
};
