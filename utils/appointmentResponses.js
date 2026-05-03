const sendAppointmentError = (res, statusCode, message) => res.status(statusCode).json({
    success: false,
    message
});

module.exports = {
    sendAppointmentError
};
