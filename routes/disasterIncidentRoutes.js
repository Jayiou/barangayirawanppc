const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getDisasterIncidents,
    createDisasterIncident,
    createDisasterIncidentFromReport,
    getDisasterIncidentById,
    updateDisasterIncident,
    addAffectedRecord,
    updateAffectedRecord
} = require('../controllers/disasterIncidentController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/', getDisasterIncidents);
router.post('/', createDisasterIncident);
router.post('/from-report/:reportId', createDisasterIncidentFromReport);
router.get('/:id', getDisasterIncidentById);
router.patch('/:id', updateDisasterIncident);
router.post('/:id/affected-records', addAffectedRecord);
router.patch('/affected-records/:affectedId', updateAffectedRecord);

module.exports = router;
