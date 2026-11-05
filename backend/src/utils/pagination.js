/**
 * Helper to build pagination metadata
 * @param {number} page - current page (1‑based)
 * @param {number} limit - items per page
 * @param {number} total - total items matching the query
 * @returns {{currentPage:number,totalPages:number,totalItems:number,limit:number,hasNextPage:boolean,hasPreviousPage:boolean}}
 */
function paginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

module.exports = { paginationMeta };

