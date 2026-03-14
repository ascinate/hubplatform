/**
 * ============================================================
 * REFRIGIWEAR QC INTELLIGENCE MODULE
 * Entry point for SankalpHub.in webapp integration
 * ============================================================
 *
 * USAGE (Claude Code / Node.js / React):
 *
 *   const qc = require('./index');
 *
 *   // Get all products in a category
 *   const gloves = qc.getProductsByCategory('gloves');
 *
 *   // Get full inspection checklist for a stage + category
 *   const checklist = qc.getChecklist('final_inspection', 'mens_outerwear');
 *
 *   // Get all defects for a product
 *   const defects = qc.getDefectsForProduct('Iron-Tuff® Siberian™');
 *
 *   // Get all checks active at a specific stage
 *   const stageChecks = qc.getDefectChecksByStage('inline_inspection');
 *
 * ============================================================
 */

// ─── DATA IMPORTS ────────────────────────────────────────────
const schema      = require('./schema.json');
const processes   = require('./processes/all-stages.json');
const defects     = require('./defects/master-defects.json');

const productFiles = {
  mens_outerwear:   require('./products/mens-outerwear.json'),
  womens_outerwear: require('./products/womens-outerwear.json'),
  footwear:         require('./products/footwear.json'),
  gloves:           require('./products/gloves.json'),
  headwear:         require('./products/headwear.json'),
  accessories:      require('./products/accessories.json'),
};

// ─── CORE API ─────────────────────────────────────────────────

/**
 * List all available product categories
 * @returns {Array} Array of category objects {id, label, subcategories}
 */
function getCategories() {
  return schema.product_categories;
}

/**
 * Get all products for a given category
 * @param {string} categoryId  e.g. 'gloves', 'footwear', 'mens_outerwear'
 * @returns {Array} Products array or empty array if not found
 */
function getProductsByCategory(categoryId) {
  const file = productFiles[categoryId];
  return file ? file.products : [];
}

/**
 * Get a single product by its style number
 * @param {string} style  e.g. '0489', '0347'
 * @returns {Object|null} Product object or null
 */
function getProductByStyle(style) {
  for (const categoryId of Object.keys(productFiles)) {
    const product = productFiles[categoryId].products.find(
      p => p.style === style || p.style.includes(style)
    );
    if (product) return { ...product, category_id: categoryId };
  }
  return null;
}

/**
 * Get all products across all categories
 * @returns {Array} All products with category_id appended
 */
function getAllProducts() {
  const all = [];
  for (const [categoryId, file] of Object.entries(productFiles)) {
    file.products.forEach(p => all.push({ ...p, category_id: categoryId }));
  }
  return all;
}

/**
 * List all 10 process stages
 * @returns {Array} Stage definition objects
 */
function getStages() {
  return schema.process_stages;
}

/**
 * Get a single stage definition by key
 * @param {string} stageKey  e.g. 'final_inspection', 'material', 'packing'
 * @returns {Object|null}
 */
function getStage(stageKey) {
  return processes.stages[stageKey] || null;
}

/**
 * Get inspection checklist for a specific stage + category combination
 * @param {string} stageKey     e.g. 'inline_inspection'
 * @param {string} categoryId   e.g. 'footwear'
 * @returns {Array} Array of checklist items with check_id, item, type
 */
function getChecklist(stageKey, categoryId) {
  const stage = processes.stages[stageKey];
  if (!stage) return [];
  return stage.checklist_by_category[categoryId] || [];
}

/**
 * Get all checklists for a stage (all categories)
 * @param {string} stageKey
 * @returns {Object} { category_id: [checks...], ... }
 */
function getAllChecklistsForStage(stageKey) {
  const stage = processes.stages[stageKey];
  if (!stage) return {};
  return stage.checklist_by_category || {};
}

/**
 * Get all defects in the defects library
 * @returns {Array}
 */
function getAllDefects() {
  return defects.defects;
}

/**
 * Get all defects applicable to a category
 * @param {string} categoryId  e.g. 'gloves'
 * @returns {Array}
 */
function getDefectsByCategory(categoryId) {
  return defects.defects.filter(d =>
    d.applies_to && d.applies_to.includes(categoryId)
  );
}

/**
 * Get all defects that affect a specific product name
 * @param {string} productName  e.g. 'Iron-Tuff® Siberian™'
 * @returns {Array}
 */
function getDefectsForProduct(productName) {
  return defects.defects.filter(d =>
    d.products_affected &&
    d.products_affected.some(p =>
      p.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(p.toLowerCase())
    )
  );
}

/**
 * Get all defects with their checks ACTIVE at a specific stage
 * @param {string} stageKey  e.g. 'inline_inspection'
 * @returns {Array} Defects with stage_check populated for that stage
 */
function getDefectChecksByStage(stageKey) {
  return defects.defects
    .filter(d => d.stage_checks[stageKey] && d.stage_checks[stageKey].active)
    .map(d => ({
      defect_id:   d.id,
      code:        d.code,
      name:        d.name,
      type:        d.type,
      severity:    d.severity,
      category:    d.applies_to,
      stage_check: d.stage_checks[stageKey],
    }));
}

/**
 * Get ALL stage checks for a specific defect
 * @param {string} defectCode  e.g. 'CON-001'
 * @returns {Object|null} Full defect object with all stage_checks
 */
function getDefectById(defectCode) {
  return defects.defects.find(d => d.code === defectCode) || null;
}

/**
 * Get all CRITICAL defects across all categories
 * @returns {Array}
 */
function getCriticalDefects() {
  return defects.defects.filter(d => d.severity === 'CRITICAL');
}

/**
 * Get defects by severity level
 * @param {string} severity  'CRITICAL' | 'MAJOR' | 'MINOR' | 'COSMETIC'
 * @returns {Array}
 */
function getDefectsBySeverity(severity) {
  return defects.defects.filter(d => d.severity === severity.toUpperCase());
}

/**
 * Get a complete inspection package for one product + all 10 stages
 * Useful for rendering a product's full QC plan in SankalpHub
 * @param {string} style  Product style number
 * @returns {Object} { product, stages: [ { stage, checklist, active_defect_checks } ] }
 */
function getProductInspectionPlan(style) {
  const product = getProductByStyle(style);
  if (!product) return null;

  const stageKeys = schema.process_stages.map(s => s.key);
  const stages = stageKeys.map(stageKey => {
    const stageDef   = getStage(stageKey);
    const checklist  = getChecklist(stageKey, product.category_id);
    const defectChecks = defects.defects
      .filter(d =>
        d.applies_to.includes(product.category_id) &&
        d.stage_checks[stageKey] &&
        d.stage_checks[stageKey].active
      )
      .map(d => ({
        defect_code: d.code,
        defect_name: d.name,
        severity:    d.severity,
        type:        d.type,
        check:       d.stage_checks[stageKey].check,
        action:      d.stage_checks[stageKey].action,
        tools:       d.stage_checks[stageKey].tools_required,
        pass_criteria: d.stage_checks[stageKey].pass_criteria,
      }));

    return {
      stage_id:      stageKey,
      stage_label:   stageDef ? stageDef.label : stageKey,
      stage_code:    stageDef ? stageDef.code : '',
      phase:         stageDef ? stageDef.phase : '',
      checklist,
      defect_checks: defectChecks,
    };
  });

  return { product, stages };
}

/**
 * Get severity level config (color, AQL, action)
 * @param {string} severity
 * @returns {Object|null}
 */
function getSeverityConfig(severity) {
  return schema.severity_levels.find(
    s => s.level === severity.toUpperCase()
  ) || null;
}

/**
 * Get all size charts
 * @returns {Object}
 */
function getSizeCharts() {
  return require('./utils/size-charts.json');
}

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  // Schema
  schema,
  getCategories,
  getStages,
  getSeverityConfig,

  // Products
  getAllProducts,
  getProductsByCategory,
  getProductByStyle,

  // Process Stages + Checklists
  getStage,
  getChecklist,
  getAllChecklistsForStage,

  // Defects
  getAllDefects,
  getDefectsByCategory,
  getDefectsForProduct,
  getDefectChecksByStage,
  getDefectById,
  getCriticalDefects,
  getDefectsBySeverity,

  // Combined plans
  getProductInspectionPlan,

  // Utilities
  getSizeCharts,

  // Raw data access
  _data: {
    schema,
    processes,
    defects,
    products: productFiles,
  }
};
