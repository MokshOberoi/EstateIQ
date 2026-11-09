// Lead Scoring Service - provides formatted intelligence for a lead
// This service builds on the existing leadService which stores raw scores.
// It returns a friendly object used by the frontend.

const leadService = require('./leadService');

/** Determine category based on score */
function getCategory(score) {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

/** Generate human‑readable insights from the raw profile */
function generateInsights(profile) {
  const insights = [];
  if (profile.total_views && profile.total_views > 0) insights.push('Viewed properties');
  if (profile.total_favourites && profile.total_favourites > 0) insights.push('Saved favourite properties');
  if (profile.total_enquiries && profile.total_enquiries > 0) insights.push('Made enquiries');
  if (profile.preferred_property_type) insights.push(`Preferred property type: ${profile.preferred_property_type}`);
  if (profile.preferred_city) insights.push(`Preferred city: ${profile.preferred_city}`);
  if (profile.current_score >= 70) insights.push('Strong buying intent');
  return insights;
}

/** Recommended next action based on category */
function recommendedAction(category) {
  switch (category) {
    case 'HOT':
      return 'Contact this lead within 24 hours';
    case 'WARM':
      return 'Schedule a follow‑up call within 3 days';
    case 'COLD':
      return 'Nurture with email newsletters';
    default:
      return '';
  }
}

/**
 * Get formatted lead intelligence for a user.
 * The function first ensures the latest scores are calculated, then builds a friendly object.
 */
async function getLeadIntelligence(userId) {
  // Re‑calculate to keep data fresh (admin can also call dedicated calculate endpoint).
  await leadService.calculateAndSaveLead(userId);
  const profile = await leadService.getLeadProfile(userId);
  if (!profile) return null;

  const score = profile.current_score || 0;
  const category = getCategory(score);
  const insights = generateInsights(profile);
  const action = recommendedAction(category);

  // Preferences to expose on the UI – keep the same naming as backend columns.
  const preferences = {
    budgetMin: profile.preferred_min_price,
    budgetMax: profile.preferred_max_price,
    propertyType: profile.preferred_property_type,
    city: profile.preferred_city,
    bedrooms: null, // placeholder – can be derived from other tables if needed later
    bathrooms: null,
  };

  return {
    score,
    category,
    insights,
    recommendedAction: action,
    preferences,
    rawProfile: profile,
  };
}

module.exports = {
  getLeadIntelligence,
};

