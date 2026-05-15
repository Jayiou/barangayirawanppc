import { apiFetch } from '@/shared/client';

export function useAppointments() {
    
    // Resident actions
    const getAvailableSlots = async (officialId, date) => {
        const response = await apiFetch(`/appointments/available-slots?officialId=${officialId}&appointmentDate=${date}`);
        return response.data || response;
    };

    const requestAppointment = async (payload) => {
        return await apiFetch('/appointments/request', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    };

    const residentCancelAppointment = async (id) => {
        return await apiFetch(`/appointments/${id}/cancel`, { method: 'PUT' });
    };

    // Admin/Official actions
    const approveAppointment = async (id) => {
        return await apiFetch(`/appointments/${id}/approve`, { method: 'PUT' });
    };

    const rejectAppointment = async (id, reason) => {
        return await apiFetch(`/appointments/${id}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ rejectionReason: reason })
        });
    };

    const completeAppointment = async (id, notes) => {
        return await apiFetch(`/appointments/${id}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ remarks: notes })
        });
    };

    const adminCancelAppointment = async (id, reason) => {
        return await apiFetch(`/appointments/${id}/admin-cancel`, {
            method: 'PUT',
            body: JSON.stringify({ cancellationReason: reason })
        });
    };

    return {
        getAvailableSlots,
        requestAppointment,
        residentCancelAppointment,
        approveAppointment,
        rejectAppointment,
        completeAppointment,
        adminCancelAppointment
    };
}