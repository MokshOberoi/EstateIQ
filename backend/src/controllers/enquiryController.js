// backend/src/controllers/enquiryController.js
// Controller for Property Enquiries workflow.

const { sendSuccess, sendError } = require('../utils/apiResponse');
const enquiryService = require('../services/enquiryService');

/**
 * POST /api/v1/enquiries
 * Buyer submits an enquiry for a property.
 */
async function createEnquiry(req, res, next) {
  try {
    const propertyId = req.body.propertyId || req.body.property_id;
    const message = req.body.message;
    const phone = req.body.phone;

    const result = await enquiryService.createEnquiry(
      { propertyId, message, phone },
      req.user
    );

    if (result.notFound) {
      return sendError(res, result.message, 404);
    }
    if (result.badRequest) {
      return sendError(res, result.message, 400);
    }

    return sendSuccess(res, 'Enquiry submitted successfully', result.enquiry, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/enquiries/me
 * Buyer views their own submitted enquiries.
 */
async function getMyEnquiries(req, res, next) {
  try {
    const enquiries = await enquiryService.getBuyerEnquiries(req.user.id);
    return sendSuccess(res, 'Buyer enquiries retrieved successfully', enquiries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/enquiries/agent
 * Agent (or Admin) views received property enquiries.
 */
async function getAgentEnquiries(req, res, next) {
  try {
    const enquiries = await enquiryService.getAgentEnquiries(req.user);
    return sendSuccess(res, 'Agent enquiries retrieved successfully', enquiries);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/enquiries/:id
 * Agent (or Admin) updates enquiry status and agent notes.
 */
async function updateEnquiry(req, res, next) {
  try {
    const enquiryId = req.params.id;
    const { status } = req.body;
    const agentNotes = req.body.agent_notes !== undefined ? req.body.agent_notes : req.body.agentNotes;

    const result = await enquiryService.updateEnquiry(
      enquiryId,
      { status, agent_notes: agentNotes },
      req.user
    );

    if (result.notFound) {
      return sendError(res, result.message, 404);
    }
    if (result.forbidden) {
      return sendError(res, result.message, 403);
    }
    if (result.badRequest) {
      return sendError(res, result.message, 400);
    }

    return sendSuccess(res, 'Enquiry updated successfully', result.enquiry);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEnquiry,
  getMyEnquiries,
  getAgentEnquiries,
  updateEnquiry,
};

