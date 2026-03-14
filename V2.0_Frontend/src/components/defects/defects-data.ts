// Defects Library — Types, Constants & Data
// Source: refrigiwear-qc-data/defects/master-defects.json

export type SeverityLevel = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'COSMETIC'
export type DefectType = 'Material' | 'Construction' | 'Print/Label' | 'Fabric' | 'Stitching' | 'Measurement' | 'Labeling' | 'Printing' | 'Assembly' | 'Trims' | 'Safety'
export type ProductCategoryId = 'mens_outerwear' | 'womens_outerwear' | 'footwear' | 'gloves' | 'headwear' | 'accessories'
export type StageKey = 'development_samples' | 'size_set' | 'pp_samples' | 'material' | 'cutting' | 'sewing_stitching' | 'assembly' | 'inline_inspection' | 'final_inspection' | 'packing'

export interface StageCheck {
  active: boolean
  action: string
  check: string
  responsibility: string
  tools_required: string[]
  pass_criteria: string
}

export interface Defect {
  id: string
  code: string
  name: string
  type: DefectType
  applies_to: ProductCategoryId[]
  products_affected: string[]
  description: string
  root_cause: string
  severity: SeverityLevel
  aql_class: string
  trend_risk: string
  test_standards: string[]
  stage_checks: Record<StageKey, StageCheck>
  custom?: boolean
}

export const SEVERITY_CONFIG: Record<SeverityLevel, {
  label: string; aql: string; action: string
  bg: string; text: string; border: string; dot: string
}> = {
  CRITICAL: { label: 'Critical', aql: '1.0', action: 'HALT production / 100% inspect', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  MAJOR:    { label: 'Major',    aql: '2.5', action: 'Reject AQL sample lot / rework',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  MINOR:    { label: 'Minor',    aql: '4.0', action: 'Note and monitor / conditional accept', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  COSMETIC: { label: 'Cosmetic', aql: '6.5', action: 'Accept with notation / 2nd quality eval', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
}

export const DEFECT_TYPES: DefectType[] = ['Material', 'Construction', 'Print/Label', 'Fabric', 'Stitching', 'Measurement', 'Labeling', 'Printing', 'Assembly', 'Trims', 'Safety']

export const DEFECT_TYPE_STYLES: Record<DefectType, { bg: string; text: string; border: string }> = {
  'Material':    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  'Construction':{ bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  'Print/Label': { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200' },
  'Fabric':      { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'Stitching':   { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  'Measurement': { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  'Labeling':    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  'Printing':    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  'Assembly':    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  'Trims':       { bg: 'bg-lime-50',    text: 'text-lime-700',    border: 'border-lime-200' },
  'Safety':      { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
}

export const PRODUCT_CATEGORIES: { id: ProductCategoryId; label: string }[] = [
  { id: 'mens_outerwear',  label: "Men's Outerwear" },
  { id: 'womens_outerwear', label: "Women's Outerwear" },
  { id: 'footwear',        label: 'Footwear' },
  { id: 'gloves',          label: 'Gloves' },
  { id: 'headwear',        label: 'Headwear' },
  { id: 'accessories',     label: 'Accessories' },
]

export const PROCESS_STAGES: { key: StageKey; label: string; code: string; phase: string }[] = [
  { key: 'development_samples', label: 'Development Samples', code: 'DEV', phase: 'Pre-Production' },
  { key: 'size_set',            label: 'Size Set',            code: 'SZS', phase: 'Pre-Production' },
  { key: 'pp_samples',          label: 'PP Samples',          code: 'PPS', phase: 'Pre-Production' },
  { key: 'material',            label: 'Material Inspection', code: 'MAT', phase: 'Pre-Production' },
  { key: 'cutting',             label: 'Cutting',             code: 'CUT', phase: 'Production' },
  { key: 'sewing_stitching',    label: 'Sewing / Stitching',  code: 'SEW', phase: 'Production' },
  { key: 'assembly',            label: 'Assembly',             code: 'ASM', phase: 'Production' },
  { key: 'inline_inspection',   label: 'Inline Inspection',   code: 'INL', phase: 'QC' },
  { key: 'final_inspection',    label: 'Final Inspection',    code: 'FIN', phase: 'QC' },
  { key: 'packing',             label: 'Packing',             code: 'PCK', phase: 'QC' },
]

const NA_CHECK: StageCheck = { active: false, action: 'N/A', check: 'Not applicable.', responsibility: '-', tools_required: [], pass_criteria: '-' }

export const DEFECTS: Defect[] = [
  {
    id: 'DEF-MAT-001', code: 'MAT-001', name: 'Shell Fabric Delamination', type: 'Material',
    applies_to: ['mens_outerwear', 'womens_outerwear'],
    products_affected: ['Iron-Tuff\u00ae Jackets', 'PolarForce\u00ae Jackets', 'Softshell Jackets', 'Coveralls', 'Bibs'],
    description: 'Outer nylon shell separating from inner lining or insulation layer due to adhesive or bonding failure.',
    root_cause: 'Incorrect bonding adhesive type; excess heat during pressing; substandard shell fabric denier; contaminated substrate before bonding.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'HIGH',
    test_standards: ['ASTM D903 Peel', 'EN ISO 11339'],
    stage_checks: {
      development_samples: { active: true, action: 'TEST', check: 'Perform adhesion peel test on proto shell panels. Validate bonding adhesive type and temperature spec. Define shell-to-lining bond strength minimum in tech pack (min 3.0 N/cm).', responsibility: 'Product Developer / Tech Pack team', tools_required: ['Peel tester', 'Tech pack review'], pass_criteria: 'Bond strength \u2265 3.0 N/cm across all panel locations' },
      size_set: { active: true, action: 'VERIFY', check: 'Confirm production fabric lot matches approved proto sample shell. Re-run adhesion test on size set bulk fabric. Flag any lot variation.', responsibility: 'QC Team', tools_required: ['Peel tester', 'Fabric lot comparison'], pass_criteria: 'Adhesion matches proto within \u00b110%' },
      pp_samples: { active: true, action: 'VALIDATE', check: 'Full construction audit of PP sample. Pull test all shell panels. Confirm bonding process parameters (temperature, pressure, dwell time) are locked in production SOP.', responsibility: 'QC / Production Manager', tools_required: ['Pull tester', 'Process SOP review'], pass_criteria: 'No delamination under 5 N/cm pull. SOP signed off.' },
      material: { active: true, action: 'INSPECT INCOMING', check: 'Incoming roll inspection for pre-laminated shell: check for bubbling, edge delamination, pinholes. Random peel test 1 sample per roll per lot.', responsibility: 'Incoming QC', tools_required: ['Visual inspection', 'Light table', 'Peel test'], pass_criteria: 'Zero delamination on incoming roll inspection' },
      cutting: { active: true, action: 'MONITOR', check: 'After cutting, check cut panel edges for any delamination triggered by blade heat or tension. Inspect perimeter of cut panels.', responsibility: 'Cutting QC', tools_required: ['Visual inspection'], pass_criteria: 'No edge peeling on any cut panel' },
      sewing_stitching: NA_CHECK,
      assembly: { active: true, action: 'SPOT CHECK', check: 'After pressing/bonding operations, tactile and visual check of assembled panels for bubbling or edge lift. Every 25 pieces.', responsibility: 'Assembly QC', tools_required: ['Visual', 'Tactile check'], pass_criteria: 'Zero bubble or edge lift on all inspected panels' },
      inline_inspection: { active: true, action: 'MONITOR', check: 'Every 50 pcs: pull test on shell seam area, visual check for panel delamination at stress points (underarm, pocket corners).', responsibility: 'Inline QC Inspector', tools_required: ['Pull tester', 'Visual'], pass_criteria: 'Zero failures per 50-piece sample' },
      final_inspection: { active: true, action: 'SAMPLE AUDIT', check: 'Per AQL 1.0 sampling plan: pull test on finished garment shell panels. Bubble check under light table. Record defect location on defect map.', responsibility: 'Final QC Inspector', tools_required: ['Pull tester', 'Light table', 'Defect map'], pass_criteria: 'Zero critical (delamination) findings within AQL 1.0 sample' },
      packing: { active: true, action: 'FINAL VISUAL', check: 'Visual check of each garment before folding for any obvious shell bubbling or peeling that may have developed during handling.', responsibility: 'Packing Supervisor', tools_required: ['Visual'], pass_criteria: 'Zero delamination observed during packing' },
    },
  },
  {
    id: 'DEF-MAT-002', code: 'MAT-002', name: 'Insulation Clumping / Cold Spots', type: 'Material',
    applies_to: ['mens_outerwear', 'womens_outerwear'],
    products_affected: ['All insulated jackets', 'Bibs', 'Coveralls', 'Snap-On Hood'],
    description: 'RefrigiFill\u2122 polyester insulation bunching unevenly inside baffles, creating thin areas with reduced thermal performance.',
    root_cause: 'Insufficient quilting tack points; poor insulation cutting uniformity; insulation weight below spec; wash-cycle migration.',
    severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH',
    test_standards: ['IDFL Insulation Test', 'Internal 11.25oz spec'],
    stage_checks: {
      development_samples: { active: true, action: 'TEST', check: 'Validate quilting pattern and tack point density on proto. Weigh insulation per panel against spec (must be 11.25 oz/yd\u00b2 \u00b15%). Light-table inspect for even distribution.', responsibility: 'Product Developer', tools_required: ['Scale', 'Light table', 'Tape measure for quilt spacing'], pass_criteria: 'Insulation weight within \u00b15% of spec. Zero visible thin spots on light table.' },
      size_set: { active: true, action: 'VERIFY', check: 'Check insulation distribution across all sizes in size set. Larger sizes require more insulation \u2014 verify cut templates scaled correctly.', responsibility: 'QC / Pattern room', tools_required: ['Scale', 'Light table'], pass_criteria: 'Each size panel meets weight spec. Even distribution on light table.' },
      pp_samples: { active: true, action: 'STRESS TEST', check: 'Shake test 10 PP sample garments vigorously. Light-table inspect all panels. Wash test 3 pcs (5 cycles) and re-inspect for insulation migration.', responsibility: 'QC Manager', tools_required: ['Light table', 'Scale', 'Washing machine'], pass_criteria: 'No clumping after shake or wash test. Weight variation <10%.' },
      material: { active: true, action: 'INCOMING CHECK', check: 'Weigh insulation rolls per delivery. Check roll consistency (weight per linear meter). Reject rolls deviating >\u00b15% from spec 11.25 oz/yd\u00b2.', responsibility: 'Incoming QC', tools_required: ['Scale', 'Fabric weight scale'], pass_criteria: 'All incoming insulation rolls within \u00b15% weight spec' },
      cutting: { active: true, action: 'VERIFY CUT ACCURACY', check: 'Measure cut insulation panels against master pattern for size accuracy. Check insulation not compressing under cutter weight causing under-cut panels.', responsibility: 'Cutting QC', tools_required: ['Tape measure', 'Pattern check'], pass_criteria: 'All cut insulation panels within \u00b13mm of pattern template' },
      sewing_stitching: { active: true, action: 'MONITOR QUILTING', check: 'Inspect quilting stitch pattern for correct spacing (per approved sample). Ensure all quilt channels are complete \u2014 no skipped tack points. Check SPI on quilt rows.', responsibility: 'Sewing QC', tools_required: ['Approved sample comparison', 'SPI gauge'], pass_criteria: 'Quilt spacing matches approved sample \u00b15mm. SPI 8-10 per spec.' },
      assembly: { active: true, action: 'LIGHT TABLE CHECK', check: 'During panel joining, light-table inspect each assembled panel section before closing seam. Flag any insulation-thin areas to rework station.', responsibility: 'Assembly QC', tools_required: ['Light table'], pass_criteria: 'Zero visible cold spots on light table inspection' },
      inline_inspection: { active: true, action: 'HOURLY CHECK', check: 'Every hour / every 50 pcs: light-table inspect finished garment for cold spots. Shake test 5 pcs per hour. Tactile press all panels.', responsibility: 'Inline QC Inspector', tools_required: ['Light table', 'Tactile check'], pass_criteria: 'Zero cold spots on inline sample' },
      final_inspection: { active: true, action: 'SAMPLE AUDIT', check: 'Per AQL 2.5: light table + shake test all sampled garments. Tactile check entire back panel, chest panels, sleeves. Defect map any findings.', responsibility: 'Final QC Inspector', tools_required: ['Light table', 'Defect map'], pass_criteria: 'Zero Major (cold spot) findings within AQL 2.5 sample' },
      packing: { active: false, action: 'MONITOR STORAGE', check: 'Avoid compressing insulated garments under heavy stacking in cartons. Use box inserts or hang storage where possible.', responsibility: 'Packing Supervisor', tools_required: ['Packing SOP'], pass_criteria: 'Garments packed per approved packing spec (no heavy compression)' },
    },
  },
  {
    id: 'DEF-MAT-003', code: 'MAT-004', name: 'Color Fading / Shade Variation', type: 'Material',
    applies_to: ['mens_outerwear', 'womens_outerwear', 'headwear', 'gloves'],
    products_affected: ['All garments', 'HiVis products especially critical'],
    description: 'Shade variation between fabric panels or production lots. Premature fading of shell color or HiVis fluorescent color.',
    root_cause: 'Dye lot variation between fabric rolls; incorrect dye concentration; insufficient light fastness; mixed lots in same order cut.',
    severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH',
    test_standards: ['ISO 105-A02 (Grey Scale)', 'AATCC 16 (Light Fastness)', 'AATCC TM8 (Crocking)'],
    stage_checks: {
      development_samples: { active: true, action: 'ESTABLISH COLOR STANDARD', check: 'Create approved lab-dip / color standard. Specify dye lot tolerances. Conduct light fastness test (AATCC 16 min Grade 4). Set acceptable shade range.', responsibility: 'Product Developer / Lab', tools_required: ['Spectrophotometer', 'Light box D65', 'AATCC Blue Wool standard'], pass_criteria: 'Light fastness min Grade 4 (AATCC 16). Shade approved to lab-dip standard.' },
      size_set: { active: true, action: 'LOT MATCHING', check: 'Verify all size set fabric rolls are from same dye lot. Compare each roll to approved standard under D65 light. Record dye lot numbers.', responsibility: 'Fabric QC', tools_required: ['D65 light box', 'Grey scale'], pass_criteria: 'All rolls from same dye lot OR shade difference \u2264 Grade 4 vs standard' },
      pp_samples: { active: true, action: 'SHADE SIGN-OFF', check: 'All PP sample fabric must be from approved bulk lot. Submit shade sign-off comparison card. Reject if shade varies across panels in same garment.', responsibility: 'QC / Merchandising', tools_required: ['Shade comparison card', 'D65 light box'], pass_criteria: 'PP sample shade matches approved standard. No panel-to-panel variation visible.' },
      material: { active: true, action: 'INCOMING LOT CHECK', check: 'On receipt: measure each roll end-to-end shade using spectrophotometer. Flag rolls with CIE \u0394E > 1.0 vs approved standard. Do NOT mix dye lots in one order.', responsibility: 'Incoming QC', tools_required: ['Spectrophotometer', 'Dye lot records'], pass_criteria: 'All rolls \u0394E \u2264 1.0. Single dye lot per order.' },
      cutting: { active: true, action: 'LOT SEGREGATION', check: 'Sort and mark cut panels by dye lot. Ensure all panels for one garment come from same dye lot. Visual shade check under light box before bundling.', responsibility: 'Cutting QC', tools_required: ['Lot marking tags', 'Light box'], pass_criteria: '100% single lot per garment bundle. Zero cross-lot mixing.' },
      sewing_stitching: { active: true, action: 'PANEL SHADE CHECK', check: 'Operators to flag any panel shade variation before sewing. Supervisor shade check on first piece of each bundle under D65 lighting.', responsibility: 'Line Supervisor', tools_required: ['D65 light', 'Visual'], pass_criteria: 'No shade variation between assembled panels on first piece' },
      assembly: { active: true, action: 'ASSEMBLED SHADE AUDIT', check: 'After full garment assembly, check all major panels (front, back, sleeves) for shade consistency under D65 light. Flag any mixed-lot garments.', responsibility: 'Assembly QC', tools_required: ['D65 light box'], pass_criteria: 'No visible shade variation on any assembled garment' },
      inline_inspection: { active: true, action: 'RANDOM SHADE CHECK', check: 'Every 2 hours: pull 5 garments and check shade under D65 light. Record dye lot of fabric being run. Compare to approved shade bar.', responsibility: 'Inline QC Inspector', tools_required: ['Approved shade bar', 'D65 light'], pass_criteria: 'All sampled garments match approved shade bar within Grade 4' },
      final_inspection: { active: true, action: 'AQL SHADE AUDIT', check: 'Per AQL 2.5: shade check all sampled garments under D65 light against approved shade bar. Special attention to side-by-side panel matching.', responsibility: 'Final QC Inspector', tools_required: ['Shade bar', 'D65 light box', 'Grey scale rating card'], pass_criteria: 'All garments within Grade 4 vs standard. No panel variation visible.' },
      packing: { active: true, action: 'SORT CHECK', check: 'When packing assorted colors per carton, verify correct colors per packing list. Check no shade-failed garments mixed into approved cartons.', responsibility: 'Packing QC', tools_required: ['Packing list', 'Visual check'], pass_criteria: 'Correct colors per packing list. No shade-rejected garments in packed cartons.' },
    },
  },
  {
    id: 'DEF-MAT-004', code: 'MAT-005', name: 'DWR Water-Repellency Failure', type: 'Material',
    applies_to: ['mens_outerwear', 'womens_outerwear'],
    products_affected: ['All outerwear with DWR treatment', 'Softshell Jackets', 'HiVis Jackets'],
    description: 'DWR (Durable Water Repellent) treatment failing to bead water. Garment absorbs moisture instead of repelling it.',
    root_cause: 'Low DWR concentration in finishing bath; improper curing temperature or time; fabric pre-treatment contamination; worn-off DWR from factory handling.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'HIGH',
    test_standards: ['AATCC 22 (Spray Test)', 'AATCC 193 (Aqueous Liquid Repellency)'],
    stage_checks: {
      development_samples: { active: true, action: 'ESTABLISH DWR SPEC', check: 'Test DWR on proto fabric via AATCC 22 spray test. Must rate 80+ (preferably 90+) before approval. Define DWR wash durability spec (must maintain 70+ after 5 washes).', responsibility: 'Product Developer / Lab', tools_required: ['AATCC spray tester', 'Wash machine for durability test'], pass_criteria: 'AATCC 22 rating \u2265 80. Post 5-wash rating \u2265 70.' },
      size_set: { active: true, action: 'VERIFY', check: 'Spray test 3 panels from size set fabric lot. Confirm DWR is active and meets spec.', responsibility: 'QC', tools_required: ['AATCC spray tester'], pass_criteria: 'Rating \u2265 80 on size set panels' },
      pp_samples: { active: true, action: 'FULL DWR VALIDATION', check: 'Spray test on finished PP sample garment (front, back, sleeves, hood). Wash 5 cycles and re-test. Confirm curing SOP is locked.', responsibility: 'QC Manager', tools_required: ['AATCC spray tester', 'Washing machine'], pass_criteria: 'Pre-wash \u2265 80; post-5-wash \u2265 70. Curing SOP approved.' },
      material: { active: true, action: 'INCOMING TEST', check: 'Spray test 3 samples per incoming fabric roll (if pre-DWR-treated). Reject rolls rating below 80.', responsibility: 'Incoming QC', tools_required: ['AATCC spray tester'], pass_criteria: 'Rating \u2265 80 on all incoming roll samples' },
      cutting: NA_CHECK,
      sewing_stitching: NA_CHECK,
      assembly: NA_CHECK,
      inline_inspection: { active: true, action: 'MONITOR POST-FINISHING', check: 'After DWR finishing/curing process: spray test 5 pcs per hour. Check all garment surfaces. Record spray test rating per batch.', responsibility: 'Inline QC', tools_required: ['AATCC spray tester'], pass_criteria: 'Rating \u2265 80 on all tested pieces' },
      final_inspection: { active: true, action: 'AQL SPRAY TEST', check: 'Per AQL 1.0: spray test on all sampled garments. Test front, back, and sleeves. Record rating per garment.', responsibility: 'Final QC Inspector', tools_required: ['AATCC spray tester'], pass_criteria: 'All AQL sample garments rate \u2265 80' },
      packing: { active: true, action: 'PROTECT DWR', check: 'Ensure garments are not packed while damp or with oily contamination which can degrade DWR. Use clean poly bags.', responsibility: 'Packing QC', tools_required: ['Clean poly bags', 'Visual'], pass_criteria: 'All garments packed dry and clean in poly bags' },
    },
  },
  {
    id: 'DEF-CON-001', code: 'CON-001', name: 'Seam Breakage / Open Seam', type: 'Construction',
    applies_to: ['mens_outerwear', 'womens_outerwear'],
    products_affected: ['All sewn garments'],
    description: 'Stitched or bound seam opening under stress loads. Critical failure point at stress areas (underarm, crotch, shoulder).',
    root_cause: 'Insufficient stitch density (SPI too low); wrong thread type for shell fabric; poor seam finish; tension issues.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL',
    test_standards: ['ASTM D5034 Grab Test (min 200N)', 'ASTM D5587 (Seam Strength)'],
    stage_checks: {
      development_samples: { active: true, action: 'SEAM SPECIFICATION', check: 'Define seam type, SPI, thread spec, and minimum seam strength in tech pack. Conduct grab test on proto seam samples \u2014 all stress seams must achieve \u2265200N.', responsibility: 'Product Developer / QC Lab', tools_required: ['Tensile tester', 'Tech pack'], pass_criteria: 'All stress seams \u2265 200N grab strength. Seam type specified in tech pack.' },
      size_set: { active: true, action: 'SEAM SAMPLE TEST', check: 'Destructive grab test on 3 size set samples across underarm, shoulder, and crotch seams. Confirm production thread matches spec.', responsibility: 'QC', tools_required: ['Tensile tester', 'Thread identification'], pass_criteria: 'Grab strength \u2265 200N on all 3 seam locations' },
      pp_samples: { active: true, action: 'FULL SEAM AUDIT', check: 'Seam strength test on PP sample at all critical locations. Verify SPI is correct. Approve seam SOP \u2014 thread, needle, SPI, seam type all locked.', responsibility: 'QC Manager', tools_required: ['Tensile tester', 'SPI gauge'], pass_criteria: 'All seams \u2265 200N. SPI 10\u201312 confirmed on shell. SOP signed off.' },
      material: { active: true, action: 'THREAD INCOMING CHECK', check: 'Verify incoming thread is correct type, color, ticket number as specified. Check thread tensile strength per lot COA.', responsibility: 'Incoming QC', tools_required: ['Thread spec comparison', 'COA check'], pass_criteria: 'Thread matches spec. COA confirms tensile strength meets requirement.' },
      cutting: NA_CHECK,
      sewing_stitching: { active: true, action: 'FIRST-PIECE & ONGOING MONITORING', check: 'First piece: count SPI on all seams. Grab test underarm seam. Check thread tension per machine. Every 50 pcs: recount SPI, visual open seam check.', responsibility: 'Sewing QC', tools_required: ['SPI gauge', 'Tensile tester (first piece)', 'Visual'], pass_criteria: 'SPI 10\u201312 on all seams. No open seams. First piece grab test \u2265 200N.' },
      assembly: { active: true, action: 'STRESS POINT AUDIT', check: 'At panel joining, tug-test all seam intersections. Bar tack placement check at underarm gusset and pocket corners. No puckering or gaping.', responsibility: 'Assembly QC', tools_required: ['Manual tug test', 'Visual'], pass_criteria: 'Zero open seams. Bar tack at all stress intersections.' },
      inline_inspection: { active: true, action: 'HOURLY SEAM CHECK', check: 'Every 50 pcs: tug test on underarm, shoulder, crotch seams. Visual inspect all seam lines for skip stitches or opening. Count SPI spot check.', responsibility: 'Inline QC Inspector', tools_required: ['SPI gauge', 'Visual tug test'], pass_criteria: 'Zero open seams or skip stitches in sample' },
      final_inspection: { active: true, action: 'AQL SEAM AUDIT', check: 'Per AQL 1.0: manual tug test on all major seams of sampled garments. Seam strength test on 5% of AQL sample (destructive). Record all seam defects on defect map.', responsibility: 'Final QC Inspector', tools_required: ['Tensile tester (destructive)', 'Visual tug test', 'Defect map'], pass_criteria: 'Zero seam failures within AQL 1.0 sample' },
      packing: { active: true, action: 'VISUAL SEAM CHECK', check: 'Final visual of all major seams as garments are folded. Flag any visible seam issues for rework before carton close.', responsibility: 'Packing Supervisor', tools_required: ['Visual'], pass_criteria: 'Zero open seams in packed garments' },
    },
  },
  {
    id: 'DEF-CON-002', code: 'CON-002', name: 'Zipper Malfunction', type: 'Construction',
    applies_to: ['mens_outerwear', 'womens_outerwear'],
    products_affected: ['All zip-front jackets', 'Coveralls', 'Bibs (boot zippers)'],
    description: 'Main front zipper not running smoothly, stopping mid-travel, separating from tape, or failing to close fully.',
    root_cause: 'Wrong zipper gauge; chain contamination with lint/insulation; slider not fully seated; zipper tape puckering from sewing; wrong zip spec.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL',
    test_standards: ['ASTM D2061 (Zipper Strength)', 'YKK Internal Spec'],
    stage_checks: {
      development_samples: { active: true, action: 'SPECIFY ZIPPER', check: 'Define zipper brand (YKK preferred), gauge (#10 brass for Iron-Tuff\u00ae), tape width, and pull tab style in tech pack. Run 20-cycle test on proto. Slider pull test (min 15 lbs closed).', responsibility: 'Product Developer', tools_required: ['Tech pack', 'Pull tester'], pass_criteria: 'Specified: YKK #10 brass. 20-cycle smooth operation. Pull test \u2265 15 lbs.' },
      size_set: { active: true, action: 'VERIFY', check: 'Confirm zipper from approved supplier and lot. 10-cycle test on size set samples. Check slider movement and lock at top stop.', responsibility: 'QC', tools_required: ['Manual operation test'], pass_criteria: 'Smooth 10-cycle operation. Slider locks at top stop.' },
      pp_samples: { active: true, action: 'FULL FUNCTION TEST', check: '50-cycle zip test on each PP sample. Tug test at full close (15 lbs). Check boot zippers on bibs/coveralls (5 full cycles). Lock in zipper installation SOP.', responsibility: 'QC Manager', tools_required: ['Pull tester', 'Cycle counter'], pass_criteria: '50 smooth cycles. Pull test \u2265 15 lbs. Boot zip 5-cycle pass.' },
      material: { active: true, action: 'INCOMING ZIPPER INSPECTION', check: 'Random 5% sample from incoming zipper reels/cards: operate each zipper 5 times, check teeth alignment, slider seating, pull tab attachment.', responsibility: 'Incoming QC', tools_required: ['Manual operation'], pass_criteria: 'Zero jamming, separation, or misalignment in 5% sample' },
      cutting: NA_CHECK,
      sewing_stitching: { active: true, action: 'ZIPPER INSTALLATION CHECK', check: 'First piece: operate zip 10 times after installation. Check tape is not puckered or twisted. Check teeth clearance from shell fabric. Verify chain free of lint/insulation debris.', responsibility: 'Sewing QC', tools_required: ['Visual + manual operation'], pass_criteria: '10-cycle smooth operation. Tape flat. No debris in chain.' },
      assembly: { active: true, action: 'STORM FLAP & STOP CHECK', check: 'After storm flap attachment: verify flap does not interfere with zip travel. Check top and bottom stops are properly set.', responsibility: 'Assembly QC', tools_required: ['Manual operation'], pass_criteria: 'Storm flap clears zip travel. Top/bottom stops engaged.' },
      inline_inspection: { active: true, action: '100% ZIP TEST', check: 'Every garment: operate zip 10 full cycles. Check for smooth movement, no catching, no separation. Check boot zips on bibs (5 cycles each).', responsibility: 'Inline QC Inspector', tools_required: ['Manual operation \u2014 100% check'], pass_criteria: '100% pass rate. Zero jamming or separation.' },
      final_inspection: { active: true, action: 'FUNCTION + STRENGTH TEST', check: 'Per AQL 1.0: 10-cycle zip test on all sampled garments. Pull test on 10% of sample (15 lbs). Check all secondary zips (pockets, boot zips, sleeve zips).', responsibility: 'Final QC Inspector', tools_required: ['Pull tester', 'Manual operation'], pass_criteria: 'Zero functional failures. Pull test \u2265 15 lbs on all tested.' },
      packing: { active: true, action: 'ZIP POSITION CHECK', check: 'All garments must be packed with main zip closed (prevents slider damage in transit). Check zip is fully closed before folding.', responsibility: 'Packing Supervisor', tools_required: ['Visual check'], pass_criteria: '100% of garments have main zip fully closed in packing' },
    },
  },
  {
    id: 'DEF-CON-003', code: 'CON-003', name: 'HiVis Reflective Tape Failure', type: 'Construction',
    applies_to: ['mens_outerwear', 'womens_outerwear', 'headwear'],
    products_affected: ['Iron-Tuff\u00ae Siberian HiVis', 'HiVis Bib Overalls', 'HiVis Softshell', 'HiVis Knit Cap'],
    description: '3M\u2122 Scotchlite\u2122 retroreflective tape peeling at edges, cracking, losing retroreflectivity, or applied misaligned.',
    root_cause: 'Improper heat-press settings; oily/contaminated substrate; wrong tape lot; substrate not pre-cleaned; tape applied on curved seam without relief cuts.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL',
    test_standards: ['ANSI/ISEA 107 (min 330 cd/lux/m\u00b2)', 'EN ISO 20471', '3M Scotchlite spec'],
    stage_checks: {
      development_samples: { active: true, action: 'VALIDATE TAPE & PROCESS', check: 'Specify approved 3M Scotchlite tape type. Establish heat-press settings (temp, pressure, dwell time). Retroreflectometer test on proto (must meet \u2265330 cd/lux/m\u00b2). Wash durability test (5 cycles).', responsibility: 'Product Developer / Lab', tools_required: ['Retroreflectometer', 'Heat press', 'Wash machine'], pass_criteria: 'Retroreflectivity \u2265 330 cd/lux/m\u00b2. No peeling after 5 wash cycles.' },
      size_set: { active: true, action: 'PROCESS VERIFICATION', check: 'Apply tape to size set sample using locked SOP. Peel test at corners. Retroreflectometer reading.', responsibility: 'QC', tools_required: ['Retroreflectometer', 'Peel test'], pass_criteria: 'Retroreflectivity \u2265 330. Corner peel test passes.' },
      pp_samples: { active: true, action: 'ANSI COMPLIANCE AUDIT', check: 'Full ANSI/ISEA 107 compliance check on PP sample. Tape placement matches spec. Retroreflectometer. Width of tape (min 2"). Length and pattern per ANSI diagram.', responsibility: 'QC Manager', tools_required: ['Retroreflectometer', 'ANSI spec drawing', 'Tape measure'], pass_criteria: 'Full ANSI 107 compliance. Retroreflectivity \u2265 330. Placement \u00b110mm.' },
      material: { active: true, action: 'INCOMING TAPE CHECK', check: 'Verify incoming tape roll is approved 3M Scotchlite lot. Check retroreflective surface has no coating defects. Test adhesive activity by lab strip test.', responsibility: 'Incoming QC', tools_required: ['Visual inspection', 'Strip adhesion test'], pass_criteria: 'Approved tape lot confirmed. No surface defects. Adhesive active.' },
      cutting: NA_CHECK,
      sewing_stitching: { active: false, action: 'PRE-TAPE PREP', check: 'Verify substrate at tape application area is clean, free of lint, oil, or release agent before sending to tape station.', responsibility: 'Line Supervisor', tools_required: ['Visual check'], pass_criteria: 'Clean, oil-free substrate at all tape positions' },
      assembly: { active: true, action: 'TAPE APPLICATION QC', check: 'First piece: verify tape position vs. spec (\u00b110mm). Check heat-press settings (temperature \u00b1 5\u00b0C, dwell time \u00b12 sec). Peel-test corner of tape. Check tape is fully flat with no air bubbles or edge lift.', responsibility: 'Assembly QC', tools_required: ['Heat press thermometer', 'Tape measure', 'Corner peel test'], pass_criteria: 'Tape position \u00b110mm. No edge lift. Heat press within spec.' },
      inline_inspection: { active: true, action: 'PER-PIECE TAPE CHECK', check: 'Every garment: visual check all tape runs for edge adhesion. Tactile press along full tape length. Flag any bubbles, lifting edges, or misalignment. Every 25 pcs: corner peel test.', responsibility: 'Inline QC Inspector', tools_required: ['Tactile check', 'Corner peel test'], pass_criteria: 'Zero edge lift or bubbling on any inspected garment' },
      final_inspection: { active: true, action: 'RETROREFLECTIVE AUDIT + AQL', check: 'Per AQL 1.0: retroreflectometer reading on 10% of sample. Corner peel on all sampled garments. Tape width and placement measurement. ANSI compliance label check.', responsibility: 'Final QC Inspector', tools_required: ['Retroreflectometer', 'Tape measure', 'Peel test', 'ANSI checklist'], pass_criteria: 'Retroreflectivity \u2265 330. All tape placements \u00b110mm. ANSI label present.' },
      packing: { active: true, action: 'TAPE PROTECTION', check: 'Fold garments so reflective tape is not in direct contact with other garments or carton surfaces. Use tissue paper between garments. Check tape not creased by folding.', responsibility: 'Packing Supervisor', tools_required: ['Tissue paper', 'Packing SOP'], pass_criteria: 'Tape surfaces protected in packing. No creases on reflective surface.' },
    },
  },
  {
    id: 'DEF-CON-004', code: 'CON-004', name: 'BOA\u00ae Dial Failure', type: 'Construction',
    applies_to: ['footwear'],
    products_affected: ['Extreme Pac Boot (0348)', 'Extreme Hiker (0347)'],
    description: 'BOA\u00ae dial not ratcheting, releasing under tension, or cable snapping. Critical footwear functional failure.',
    root_cause: 'Improper BOA dial installation; cable over-tensioned at factory; wrong BOA lace anchor; cable routed incorrectly.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL',
    test_standards: ['BOA Technology Certification Standard', 'ASTM F2892'],
    stage_checks: {
      development_samples: { active: true, action: 'BOA INSTALL VALIDATION', check: 'Follow BOA Technology factory installation guide for dial model. Tension test (25 lbs pull on cable). 200-cycle dial operation test. Cable routing verification against approved diagram.', responsibility: 'Product Developer / BOA Certified Technician', tools_required: ['BOA installation guide', 'Pull tester', 'Cycle counter'], pass_criteria: '200-cycle smooth operation. Cable holds 25 lbs. Installation matches BOA guide.' },
      size_set: { active: true, action: 'SIZING CABLE CHECK', check: 'Verify BOA cable length is appropriate for each boot size (different cable lengths per size). Test fit and dial operation across all sizes.', responsibility: 'QC / Developer', tools_required: ['BOA dial tester', 'Size-specific cable spec'], pass_criteria: 'Correct cable length per size. Full dial operation confirmed.' },
      pp_samples: { active: true, action: 'FULL BOA CERTIFICATION CHECK', check: 'Submit PP sample to BOA Technology for compliance verification if required. Internal: 200-cycle test. Cable tension 25 lbs. Cold-temperature flex test (-40\u00b0F, 50 cycles).', responsibility: 'QC Manager', tools_required: ['BOA test protocol', 'Cold chamber if available'], pass_criteria: 'BOA compliance confirmed. 200-cycle pass at ambient and cold temp.' },
      material: { active: true, action: 'INCOMING BOA COMPONENT CHECK', check: 'Verify incoming BOA dials and cables are correct model and from approved BOA supplier. 5% random function test on incoming components.', responsibility: 'Incoming QC', tools_required: ['BOA component spec', 'Manual function test'], pass_criteria: 'Correct components confirmed. 5% sample zero function failures.' },
      cutting: NA_CHECK,
      sewing_stitching: NA_CHECK,
      assembly: { active: true, action: 'INSTALLATION QC', check: 'First pair of each style/size: BOA dial installation verification \u2014 dial orientation, cable routing path, anchor set. 20-cycle operation test. Supervisor sign-off before bulk continues.', responsibility: 'Assembly QC / Supervisor', tools_required: ['BOA installation diagram', 'Manual cycle test'], pass_criteria: 'Installation matches diagram. 20-cycle smooth operation.' },
      inline_inspection: { active: true, action: 'PER-PAIR BOA TEST', check: 'Every pair: 10-cycle tighten/release test on BOA dial. Check cable is not kinked or binding. Check anchor points are secure.', responsibility: 'Inline QC Inspector', tools_required: ['Manual operation \u2014 100% check'], pass_criteria: '100% pass on 10-cycle test. Zero binding or kinking.' },
      final_inspection: { active: true, action: 'AQL + CABLE TENSION', check: 'Per AQL 1.0: 20-cycle dial test on all sampled pairs. Cable tension test (10 lbs pull) on 10% of sample. Check dial clicks distinctly at each increment.', responsibility: 'Final QC Inspector', tools_required: ['Pull tester', 'Cycle counter'], pass_criteria: 'Zero dial failures. Cable holds 10 lbs on tested pairs.' },
      packing: { active: true, action: 'DIAL PROTECTION', check: 'Pack boots in pairs with BOA dial facing inward to avoid dial being pressed against carton. Check carton compression will not damage dial during transit.', responsibility: 'Packing Supervisor', tools_required: ['Packing spec check'], pass_criteria: 'BOA dial protected by packing orientation' },
    },
  },
  {
    id: 'DEF-PRN-001', code: 'PRN-001', name: 'Care Label Missing or Unreadable', type: 'Print/Label',
    applies_to: ['mens_outerwear', 'womens_outerwear', 'footwear', 'gloves', 'headwear', 'accessories'],
    products_affected: ['ALL products'],
    description: 'Required care and content label absent, incomplete, or unreadable. Legal and compliance requirement for all garments.',
    root_cause: 'Label skipped in assembly; wrong label lot issued; label ink/print not bonding; sewing operator missed label insertion.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'HIGH',
    test_standards: ['ASTM D5489 (Care Labeling)', 'FTC Care Labeling Rule', 'ANSI/ISEA 107 (HiVis)'],
    stage_checks: {
      development_samples: { active: true, action: 'LABEL SPEC CREATION', check: 'Create approved label artwork with: fiber content (%), care symbols, country of origin, brand name, style number, size. Submit to compliance team for approval. Specify label placement in tech pack.', responsibility: 'Product Developer / Compliance', tools_required: ['Label artwork software', 'Compliance review'], pass_criteria: 'Label artwork compliance-approved. Placement specified in tech pack.' },
      size_set: { active: true, action: 'LABEL VERIFY', check: 'Confirm correct labels ordered per size set sizes. Verify label content matches approved artwork. Check label placement on size set samples.', responsibility: 'QC', tools_required: ['Approved label artwork', 'Visual check'], pass_criteria: 'All labels correct content, correct placement per tech pack.' },
      pp_samples: { active: true, action: 'FULL LABEL AUDIT', check: 'Check all labels on PP samples: care label, size label, brand label, country of origin, HiVis certification label (where applicable). Confirm all labels are legible after wash test.', responsibility: 'QC Manager', tools_required: ['Label checklist', 'Wash test for legibility'], pass_criteria: 'All required labels present, correct, legible. Wash legibility confirmed.' },
      material: { active: true, action: 'INCOMING LABEL CHECK', check: 'Inspect incoming label lots: compare to approved artwork (size, font, content). Check print quality \u2014 no fading, smearing, or incomplete print. Verify correct label per style.', responsibility: 'Incoming QC', tools_required: ['Approved artwork', 'Label inspection under magnifier'], pass_criteria: '100% content match to approved artwork. Print quality acceptable.' },
      cutting: NA_CHECK,
      sewing_stitching: { active: true, action: 'LABEL INSERTION CONTROL', check: 'Ensure correct labels loaded at label-sewing stations. First piece: verify all labels inserted correctly (brand, care, size) at correct position. Supervisor check every bundle handover.', responsibility: 'Line Supervisor / Sewing QC', tools_required: ['Label checklist at each station', 'First-piece check form'], pass_criteria: 'First piece: all labels correct type, position, and orientation.' },
      assembly: NA_CHECK,
      inline_inspection: { active: true, action: 'EVERY 25 PCS LABEL CHECK', check: 'Every 25 garments: check care label, size label, and brand label. Verify content, legibility, and position. Record any missing or wrong labels \u2014 trace back to operator.', responsibility: 'Inline QC Inspector', tools_required: ['Label checklist'], pass_criteria: 'Zero missing, wrong, or unreadable labels in sample' },
      final_inspection: { active: true, action: '100% LABEL AUDIT IN AQL', check: 'Per AQL 1.0: 100% label check on all sampled garments. Verify: brand label, care label (all symbols correct), size label, country of origin, HiVis cert label (where applicable).', responsibility: 'Final QC Inspector', tools_required: ['Label checklist', 'Approved artwork', 'Camera'], pass_criteria: 'Zero label defects within AQL 1.0 sample' },
      packing: { active: true, action: 'HANG TAG + LABEL VERIFY', check: 'Before packing: verify hang tag is attached (correct style, size, price if applicable). Confirm polybag size label sticker matches garment label. Check barcode scans correctly.', responsibility: 'Packing QC', tools_required: ['Barcode scanner', 'Packing list'], pass_criteria: 'Hang tag present. Polybag label matches garment. Barcode scans.' },
    },
  },
  {
    id: 'DEF-FTWR-001', code: 'FTWR-001', name: 'Outsole Separation', type: 'Construction',
    applies_to: ['footwear'],
    products_affected: ['All boots'],
    description: 'Rubber outsole detaching from midsole or upper at the perimeter, toe, or heel.',
    root_cause: 'Inadequate cement coverage; contaminated cementing surface; insufficient press time or pressure; cure time not respected.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL',
    test_standards: ['ISO 17702 (Outsole Bond)', 'ASTM F489', 'EN ISO 20344'],
    stage_checks: {
      development_samples: { active: true, action: 'CEMENT SYSTEM VALIDATION', check: 'Validate two-component PU adhesive system on proto. Define roughing depth (0.5mm), primer type, cement activation temperature, and press parameters (60 PSI, 60 sec). Peel test (\u22654 N/mm across full perimeter).', responsibility: 'Footwear Developer / Lab', tools_required: ['Peel tester', 'Press machine', 'Process spec'], pass_criteria: 'Peel strength \u2265 4 N/mm full perimeter. Cement SOP approved.' },
      size_set: { active: true, action: 'PROCESS CHECK', check: 'Apply approved cement SOP to size set pairs. Peel test 3 pairs (toe, heel, sides). Flex test 1,000 cycles.', responsibility: 'QC', tools_required: ['Peel tester', 'Flex tester'], pass_criteria: 'Peel \u2265 4 N/mm. No delamination after 1,000 flex cycles.' },
      pp_samples: { active: true, action: 'FULL CONSTRUCTION AUDIT', check: '10,000-cycle flex test on PP samples. Peel test after. Soak test 4 hrs then peel. Cement SOP locked for production.', responsibility: 'QC Manager', tools_required: ['Flex tester', 'Soak test', 'Peel tester'], pass_criteria: 'No separation after 10,000 flex cycles or 4-hr soak.' },
      material: { active: true, action: 'ADHESIVE INCOMING CHECK', check: 'Verify incoming cement batch against approved brand/formulation. Check pot life date. Test adhesive viscosity. Inspect outsole material for contamination.', responsibility: 'Incoming QC', tools_required: ['Viscosity check', 'Date stamp verification'], pass_criteria: 'Correct cement brand/batch. Within pot life. No outsole contamination.' },
      cutting: NA_CHECK,
      sewing_stitching: { active: false, action: 'UPPER PREPARATION', check: 'After upper stitching: verify lasting margin is clean and free of adhesive contamination from previous operations.', responsibility: 'Stitching QC', tools_required: ['Visual inspection of lasting margin'], pass_criteria: 'Clean, properly-roughed lasting margin on all uppers' },
      assembly: { active: true, action: 'CEMENTING PROCESS CONTROL', check: '100% cement coverage audit before pressing: cement must cover full outsole surface with no dry areas. Verify press machine pressure (60 PSI) and dwell time (60 sec). Monitor activation temperature.', responsibility: 'Assembly QC', tools_required: ['Press machine gauge', 'Temperature probe', 'Visual cement audit'], pass_criteria: '100% cement coverage. 60 PSI press. 60 sec dwell. Correct activation temp.' },
      inline_inspection: { active: true, action: 'PER-PAIR PERIMETER CHECK', check: 'Every pair after pressing: visual and tactile check of full outsole perimeter for edge lift or voids. Every 30 pairs: peel test at toe and heel corners.', responsibility: 'Inline QC Inspector', tools_required: ['Tactile press on perimeter', 'Peel test'], pass_criteria: 'Zero edge lift. Peel test passes on corner check.' },
      final_inspection: { active: true, action: 'AQL FLEX + PEEL TEST', check: 'Per AQL 1.0: flex test 500 cycles on sampled pairs. Peel test at corners. Visual perimeter check on all sampled pairs.', responsibility: 'Final QC Inspector', tools_required: ['Flex tester (portable)', 'Peel test', 'Camera'], pass_criteria: 'Zero separation after flex test. Peel test \u2265 4 N/mm.' },
      packing: { active: true, action: 'CURE TIME RESPECT', check: 'Do not pack boots before minimum cure time (24 hrs after pressing). Verify production date on batch record. Do not stack heavy weights on freshly cemented boots.', responsibility: 'Packing Supervisor', tools_required: ['Production batch record', 'Cure time SOP'], pass_criteria: 'All packed boots have met minimum 24-hr cure time.' },
    },
  },
  {
    id: 'DEF-GLVS-001', code: 'GLVS-001', name: 'Cut Resistance Failure', type: 'Material',
    applies_to: ['gloves'],
    products_affected: ['Extreme Ultra Grip Glove (0287)', 'HiVis Insulated Impact Pro (0293HV)'],
    description: 'Glove fails to meet specified ANSI/ISEA 105 cut resistance rating. Yarn substitution or degraded material used.',
    root_cause: 'Wrong yarn grade sourced; supplier material substitution without notification; incorrect yarn blend ratio.',
    severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL',
    test_standards: ['ANSI/ISEA 105 (TDM-100 Cut Test)', 'EN 388'],
    stage_checks: {
      development_samples: { active: true, action: 'YARN & SPEC VALIDATION', check: 'Submit proto glove for ANSI/ISEA 105 TDM-100 cut test. Must achieve ANSI A4 or above per spec. Document approved yarn source and blend. Request supplier COA.', responsibility: 'Product Developer / Lab', tools_required: ['ANSI 105 TDM-100 test machine', 'COA'], pass_criteria: 'ANSI A4 confirmed by accredited lab. Yarn source documented.' },
      size_set: { active: true, action: 'LOT TEST', check: 'Test size set gloves from production yarn lot. Compare COA to approved proto test results. Burn test to verify yarn composition.', responsibility: 'QC / Lab', tools_required: ['Burn test', 'COA comparison'], pass_criteria: 'Size set COA matches proto. Burn test confirms yarn composition.' },
      pp_samples: { active: true, action: 'PRODUCTION LOT CUT TEST', check: 'Submit PP sample lot (3 pairs) to accredited lab for ANSI/ISEA 105 TDM-100 test. Results must meet A4. Lab report must be on file before bulk approval.', responsibility: 'QC Manager', tools_required: ['Accredited lab submission'], pass_criteria: 'Accredited lab report confirms ANSI A4 on PP sample lot.' },
      material: { active: true, action: 'EVERY INCOMING YARN LOT', check: '100% COA verification on every incoming cut-resistant yarn lot. Spot destructive TDM-100 test: 1 glove per 500-pair lot minimum. HALT if yarn substitution suspected.', responsibility: 'Incoming QC', tools_required: ['COA check', 'TDM-100 test or accredited lab'], pass_criteria: 'COA verified. Spot test achieves ANSI A4 minimum.' },
      cutting: { active: true, action: 'YARN SEGREGATION', check: 'Cut-resistant yarn rolls must be stored separately and clearly marked. Verify cut panels match approved yarn spec before issuing to sewing.', responsibility: 'Cutting Supervisor', tools_required: ['Yarn identification tags'], pass_criteria: 'Cut-resistant panels identified and segregated correctly' },
      sewing_stitching: { active: true, action: 'CONSTRUCTION VERIFICATION', check: 'Verify cut-resistant shell is used on correct glove panels (palm, fingers, back). Check knit density matches approved sample \u2014 no substitution with standard yarn.', responsibility: 'Sewing QC', tools_required: ['Approved sample comparison', 'Visual'], pass_criteria: 'Correct cut-resistant shell panels used per approved construction.' },
      assembly: NA_CHECK,
      inline_inspection: { active: true, action: 'YARN IDENTITY CHECK', check: 'Every 100 pairs: verify cut-resistant shell matches approved sample. Quick burn test on trim piece to confirm yarn type. Record yarn lot in production log.', responsibility: 'Inline QC Inspector', tools_required: ['Burn test', 'Approved sample'], pass_criteria: 'Yarn confirmed as HPPE/cut-resistant type per burn test' },
      final_inspection: { active: true, action: 'AQL + RANDOM DESTRUCTIVE TEST', check: 'Per AQL 1.0: visual and construction check on sample. Destructive cut test on 1% of lot (sent to lab). ANSI certification label on each glove verified.', responsibility: 'Final QC Inspector', tools_required: ['TDM-100 test or lab submission', 'Label checklist'], pass_criteria: 'ANSI A4 confirmed. Zero label defects. AQL 1.0 pass.' },
      packing: { active: true, action: 'CERTIFICATION LABEL CHECK', check: 'Verify ANSI/ISEA 105 certification information is on the glove hang tag or label. Barcode scan confirms correct SKU.', responsibility: 'Packing QC', tools_required: ['Label checklist', 'Barcode scanner'], pass_criteria: 'ANSI certification present on all packed gloves.' },
    },
  },
]

// Stage check builder for simplified defects (from README-QC-Module-2)
const STAGE_MAP: Record<string, StageKey> = {
  'Development': 'development_samples', 'Material': 'material', 'PP Sample': 'pp_samples',
  'Cutting': 'cutting', 'Sewing': 'sewing_stitching', 'Assembly': 'assembly',
  'Inline': 'inline_inspection', 'Final': 'final_inspection', 'Packing': 'packing',
  'Metal Detect': 'final_inspection',
}

function buildStageChecks(detectionStages: string, action: string): Record<StageKey, StageCheck> {
  const activeKeys = new Set<StageKey>()
  for (const [text, key] of Object.entries(STAGE_MAP)) {
    if (detectionStages.includes(text)) activeKeys.add(key)
  }
  const checks = {} as Record<StageKey, StageCheck>
  for (const s of PROCESS_STAGES) {
    if (activeKeys.has(s.key)) {
      checks[s.key] = { active: true, action: action.split(' — ')[0] || action.split(';')[0] || 'INSPECT', check: action, responsibility: 'QC Inspector', tools_required: [], pass_criteria: 'Per approved spec' }
    } else {
      checks[s.key] = NA_CHECK
    }
  }
  return checks
}

// ═══════════════════════════════════════════════════════════════
// GARMENT DEFECTS (G-) — Men's & Women's Outerwear
// ═══════════════════════════════════════════════════════════════
const GARMENT_CATS: ProductCategoryId[] = ['mens_outerwear', 'womens_outerwear']
const GARMENT_PRODUCTS = ['Iron-Tuff\u00ae Jackets', 'PolarForce\u00ae Jackets', 'Coveralls', 'Bibs', 'Vests', 'Layers']

const GARMENT_DEFECTS: Defect[] = [
  // Critical
  { id: 'DEF-G-CR-01', code: 'G-CR-01', name: 'Broken needle inside garment', type: 'Safety', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Broken needle fragment left inside garment posing consumer safety risk.', root_cause: 'Needle breakage during sewing not tracked; missing needle management SOP.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'HALT \u2014 metal detector pass mandatory; reject entire lot pending scan') },
  { id: 'DEF-G-CR-02', code: 'G-CR-02', name: 'Sharp object inside garment', type: 'Safety', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Sharp foreign object (wire, pin, blade fragment) found inside garment.', root_cause: 'Loose tools on production floor; inadequate housekeeping; no metal detection protocol.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'HALT \u2014 100% metal detector sweep; root cause investigation') },
  { id: 'DEF-G-CR-03', code: 'G-CR-03', name: 'Chemical contamination', type: 'Safety', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Chemical contamination on fabric or finished garment exceeding safety limits.', root_cause: 'Contaminated raw materials; chemical spill during production; improper storage.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Material / Final', 'HALT \u2014 segregate lot; lab test; do not ship') },
  { id: 'DEF-G-CR-04', code: 'G-CR-04', name: 'Incorrect safety labeling', type: 'Labeling', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Safety or compliance label missing, incorrect, or non-compliant with regulations.', root_cause: 'Wrong label lot issued; label artwork not updated; operator skipped insertion.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('PP Sample / Final', 'HALT \u2014 replace all labels; re-inspect 100% before release') },
  { id: 'DEF-G-CR-05', code: 'G-CR-05', name: 'Flammable material non-compliance', type: 'Safety', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Material fails flammability testing per ASTM D6413 or equivalent standard.', root_cause: 'Incorrect fabric specification; supplier substituted non-FR material; no incoming test.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: ['ASTM D6413'], stage_checks: buildStageChecks('Development / Material', 'HALT \u2014 flame test (ASTM D6413); do not proceed to bulk') },
  // Major
  { id: 'DEF-G-MJ-01', code: 'G-MJ-01', name: 'Open seam', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Seam opening at any location on garment, exposing raw edges or insulation.', root_cause: 'Insufficient SPI; wrong thread type; operator error; machine tension issue.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Rework at sewing station; re-inspect after repair') },
  { id: 'DEF-G-MJ-02', code: 'G-MJ-02', name: 'Broken stitch', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Thread breakage in stitch line causing visible gap in seam.', root_cause: 'Worn needle; incorrect thread tension; thread quality issue.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Identify machine/operator; rework affected garments') },
  { id: 'DEF-G-MJ-03', code: 'G-MJ-03', name: 'Skip stitch', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Machine skipping stitches leaving gaps in seam line.', root_cause: 'Blunt or damaged needle; incorrect needle/thread combination; timing issue.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Replace needle; adjust tension; rework affected pcs') },
  { id: 'DEF-G-MJ-04', code: 'G-MJ-04', name: 'Uneven stitching', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Stitch line wavering from intended path, uneven seam allowance.', root_cause: 'Operator inexperience; incorrect presser foot pressure; feed dog issue.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Retrain operator; check presser foot and feed dog') },
  { id: 'DEF-G-MJ-05', code: 'G-MJ-05', name: 'Seam puckering', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Fabric gathering or puckering along seam line after stitching.', root_cause: 'Incorrect thread tension; differential feed not calibrated; fabric handling.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Adjust thread tension and differential feed') },
  { id: 'DEF-G-MJ-06', code: 'G-MJ-06', name: 'Misaligned panels', type: 'Assembly', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Garment panels not aligned correctly at seams, causing asymmetry.', root_cause: 'Incorrect pattern notch alignment; operator error; cutting inaccuracy.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Cutting / Sewing', 'Check pattern notches; retrain alignment technique') },
  { id: 'DEF-G-MJ-07', code: 'G-MJ-07', name: 'Fabric hole', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Hole in fabric panel from manufacturing defect or handling damage.', root_cause: 'Fabric weaving defect; needle damage; improper handling at cutting.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Material / Inline', 'Reject panel at cutting; trace back to fabric lot') },
  { id: 'DEF-G-MJ-08', code: 'G-MJ-08', name: 'Fabric tear', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Tear in fabric panel from stress or handling damage.', root_cause: 'Low tear strength fabric; rough handling; sharp equipment edges.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Material / Inline', 'Reject panel; inspect adjacent panels in same roll') },
  { id: 'DEF-G-MJ-09', code: 'G-MJ-09', name: 'Oil stain', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Oil or grease stain on fabric from machine or handling contamination.', root_cause: 'Machine oil leak; operator handling with contaminated gloves; storage issue.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Rework \u2014 attempt solvent removal; reject if permanent') },
  { id: 'DEF-G-MJ-10', code: 'G-MJ-10', name: 'Dye stain', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Dye transfer or bleeding stain on fabric.', root_cause: 'Poor dye fixation; mixed-color storage; wet fabric contact during handling.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Material / Inline', 'Reject fabric lot; issue supplier NCR') },
  { id: 'DEF-G-MJ-11', code: 'G-MJ-11', name: 'Color shading variation', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Visible shade difference between panels or across production lot.', root_cause: 'Dye lot variation; mixed fabric rolls in same order; no lot segregation.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Material / Cutting', 'Enforce dye lot control; segregate mixed-lot cuts') },
  { id: 'DEF-G-MJ-12', code: 'G-MJ-12', name: 'Incorrect measurement', type: 'Measurement', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Garment dimensions outside tolerance (\u00b11.5cm) from spec sheet.', root_cause: 'Pattern error; incorrect marker placement; fabric shrinkage not accounted for.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Final', '100% re-measure; rework or reject out-of-spec pieces') },
  { id: 'DEF-G-MJ-13', code: 'G-MJ-13', name: 'Missing label', type: 'Labeling', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Required care, brand, or size label missing from garment.', root_cause: 'Operator skipped label insertion; wrong bundle issued; label stock ran out.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Halt bundle; apply correct label; trace operator') },
  { id: 'DEF-G-MJ-14', code: 'G-MJ-14', name: 'Wrong size label', type: 'Labeling', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Size label does not match actual garment size.', root_cause: 'Label mix-up at sewing station; wrong label bundle issued.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', '100% label audit on affected bundle; re-label') },
  { id: 'DEF-G-MJ-15', code: 'G-MJ-15', name: 'Twisted seam', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Seam line twisted or spiraled after stitching, distorting garment shape.', root_cause: 'Grain line not followed at cutting; operator stretching fabric during sewing.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Rework; check grain line alignment at cutting') },
  { id: 'DEF-G-MJ-16', code: 'G-MJ-16', name: 'Loose stitching', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Stitch tension too loose, seam can be pulled open easily.', root_cause: 'Machine tension not calibrated; wrong thread type; bobbin issue.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Check SPI; verify thread tension; rework affected seams') },
  { id: 'DEF-G-MJ-17', code: 'G-MJ-17', name: 'Raw edge exposed', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Unfinished fabric edge visible where binding or overlocking should be.', root_cause: 'Missed operation; overlock machine skipped; operator error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Assembly', 'Rework with overlock or binding; update SOP') },
  // Minor
  { id: 'DEF-G-MN-01', code: 'G-MN-01', name: 'Loose thread', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Untrimmed thread tail visible on garment surface.', root_cause: 'Thread not trimmed at sewing; finishing station missed.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final / Packing', 'Trim at finishing station before packing') },
  { id: 'DEF-G-MN-02', code: 'G-MN-02', name: 'Minor crease', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Light crease or wrinkle in fabric from handling or storage.', root_cause: 'Improper storage; folding method; no steam press at finishing.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Steam press at finishing; update folding method') },
  { id: 'DEF-G-MN-03', code: 'G-MN-03', name: 'Slight shade variation', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Minor shade difference visible only under close inspection.', root_cause: 'Slight dye lot variation within acceptable tolerance range.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Note on inspection report; conditionally accept') },
  { id: 'DEF-G-MN-04', code: 'G-MN-04', name: 'Minor dirt mark', type: 'Fabric', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Small dirt or dust mark on fabric surface.', root_cause: 'Dirty work surface; handling without gloves; storage contamination.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Spot clean; reject if not removable') },
  { id: 'DEF-G-MN-05', code: 'G-MN-05', name: 'Slight seam waviness', type: 'Stitching', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Minor waviness in seam line within acceptable tolerance.', root_cause: 'Slight operator inconsistency; fabric stretch during sewing.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Note; accept if within 3mm of spec line') },
  { id: 'DEF-G-MN-06', code: 'G-MN-06', name: 'Minor print misalignment', type: 'Printing', applies_to: GARMENT_CATS, products_affected: GARMENT_PRODUCTS, description: 'Print or logo placement slightly off from approved position.', root_cause: 'Screen/heat press alignment drift; operator positioning error.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Accept if within \u00b15mm tolerance; note on report') },
]

// ═══════════════════════════════════════════════════════════════
// GLOVES DEFECTS (GL-)
// ═══════════════════════════════════════════════════════════════
const GLOVE_CATS: ProductCategoryId[] = ['gloves']
const GLOVE_PRODUCTS = ['Performance Gloves', 'Leather Gloves', 'Cut-Resistant', 'Touchscreen', 'Mitts', 'Liners']

const GLOVE_DEFECTS: Defect[] = [
  // Critical
  { id: 'DEF-GL-CR-01', code: 'GL-CR-01', name: 'Cut resistant material failure', type: 'Safety', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Cut-resistant glove fails ANSI/ISEA 105 or EN 388 cut test.', root_cause: 'Wrong yarn grade; supplier material substitution; incorrect yarn blend.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: ['ANSI/ISEA 105', 'EN 388'], stage_checks: buildStageChecks('Material / PP Sample', 'HALT \u2014 TDM-100 retest; reject lot; issue supplier NCR') },
  { id: 'DEF-GL-CR-02', code: 'GL-CR-02', name: 'Sharp metal fragment inside glove', type: 'Safety', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Sharp metal fragment found inside glove posing safety risk.', root_cause: 'Broken needle; loose machine parts; inadequate metal detection.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'HALT \u2014 100% metal detector scan; root cause investigation') },
  { id: 'DEF-GL-CR-03', code: 'GL-CR-03', name: 'Chemical contamination', type: 'Safety', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Chemical contamination on glove material exceeding safety limits.', root_cause: 'Contaminated raw materials; chemical exposure during production.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Material / Final', 'HALT \u2014 segregate; lab analysis; do not ship') },
  { id: 'DEF-GL-CR-04', code: 'GL-CR-04', name: 'Missing safety marking (ANSI/EN 388)', type: 'Labeling', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Required ANSI/ISEA 105 or EN 388 safety marking absent from glove.', root_cause: 'Label not applied; wrong label lot; certification info missing from artwork.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: ['ANSI/ISEA 105', 'EN 388'], stage_checks: buildStageChecks('PP Sample / Final', 'HALT \u2014 replace all labels; 100% re-inspect before release') },
  // Major
  { id: 'DEF-GL-MJ-01', code: 'GL-MJ-01', name: 'Open seam', type: 'Stitching', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Seam opening on glove exposing liner or raw edge.', root_cause: 'Low SPI; thread breakage; operator error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Rework at sewing; re-inspect seam strength') },
  { id: 'DEF-GL-MJ-02', code: 'GL-MJ-02', name: 'Broken stitching', type: 'Stitching', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Thread breakage in glove stitch line.', root_cause: 'Machine malfunction; incorrect thread; worn needle.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Identify machine; rework; check SPI') },
  { id: 'DEF-GL-MJ-03', code: 'GL-MJ-03', name: 'Uneven finger length', type: 'Measurement', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Glove fingers not uniform in length, affecting fit.', root_cause: 'Pattern template error; cutting inaccuracy; operator stretching.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Cutting / Sewing', 'Re-check pattern template; measure vs spec') },
  { id: 'DEF-GL-MJ-04', code: 'GL-MJ-04', name: 'Incorrect glove size', type: 'Measurement', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Glove dimensions do not match labeled size (\u00b13mm tolerance).', root_cause: 'Wrong pattern used; cutting error; labeling mismatch.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Cutting / Final', 'Re-measure hand circumference; re-label if needed') },
  { id: 'DEF-GL-MJ-05', code: 'GL-MJ-05', name: 'Palm reinforcement missing', type: 'Assembly', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Palm reinforcement patch not applied to glove.', root_cause: 'Operator skipped operation; assembly sequence error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Inline', 'Halt bundle; identify missing operation; rework') },
  { id: 'DEF-GL-MJ-06', code: 'GL-MJ-06', name: 'Padding / insulation missing', type: 'Assembly', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Insulation or padding layer not inserted in glove.', root_cause: 'Assembly line skip; insulation stock ran out; operator error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Inline', 'Halt and rework; trace back to insulation station') },
  { id: 'DEF-GL-MJ-07', code: 'GL-MJ-07', name: 'Stitch skipped', type: 'Stitching', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Skipped stitches in glove seam line.', root_cause: 'Blunt needle; timing issue; thick material at intersections.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Replace needle; rework affected gloves') },
  { id: 'DEF-GL-MJ-08', code: 'GL-MJ-08', name: 'Fabric tear', type: 'Fabric', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Tear in glove fabric panel.', root_cause: 'Low tear strength; rough handling; sharp tooling.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Material / Cutting', 'Reject panel; inspect adjacent pieces same lot') },
  // Minor
  { id: 'DEF-GL-MN-01', code: 'GL-MN-01', name: 'Loose threads', type: 'Stitching', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Untrimmed thread tails on glove.', root_cause: 'Thread not trimmed at finishing.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Trim at finishing before packing') },
  { id: 'DEF-GL-MN-02', code: 'GL-MN-02', name: 'Minor color variation', type: 'Fabric', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Slight color difference within Grade 4 tolerance.', root_cause: 'Minor dye lot variation.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Note on report; conditionally accept if within Grade 4') },
  { id: 'DEF-GL-MN-03', code: 'GL-MN-03', name: 'Slight printing defect', type: 'Printing', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Minor print or logo imperfection on glove.', root_cause: 'Screen wear; ink consistency issue.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Accept if within \u00b13mm; note on inspection report') },
  { id: 'DEF-GL-MN-04', code: 'GL-MN-04', name: 'Minor dirt mark', type: 'Fabric', applies_to: GLOVE_CATS, products_affected: GLOVE_PRODUCTS, description: 'Small dirt mark on glove surface.', root_cause: 'Handling contamination.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final', 'Spot clean; reject if not removable') },
]

// ═══════════════════════════════════════════════════════════════
// FOOTWEAR DEFECTS (FW-)
// ═══════════════════════════════════════════════════════════════
const FOOTWEAR_CATS: ProductCategoryId[] = ['footwear']
const FOOTWEAR_PRODUCTS = ['Pac Boots', 'Leather Boots', 'Crossover Boots', "Women's Boots", 'Socks']

const FOOTWEAR_DEFECTS: Defect[] = [
  // Critical
  { id: 'DEF-FW-CR-01', code: 'FW-CR-01', name: 'Sharp object inside shoe', type: 'Safety', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Sharp foreign object inside shoe posing injury risk.', root_cause: 'Broken lasting nail; loose tooling; no metal detection.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'HALT \u2014 100% metal detector scan; investigate tooling') },
  { id: 'DEF-FW-CR-02', code: 'FW-CR-02', name: 'Sole detachment risk (bond failure)', type: 'Safety', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Outsole bond failure creating detachment risk during wear.', root_cause: 'Adhesive failure; incorrect cement process; contaminated substrate.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'HALT \u2014 peel test all pairs; reject lot if >AQL 1.0') },
  { id: 'DEF-FW-CR-03', code: 'FW-CR-03', name: 'Chemical contamination', type: 'Safety', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Chemical contamination on footwear materials.', root_cause: 'Contaminated raw materials; chemical spill; improper storage.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Material / Final', 'HALT \u2014 segregate lot; lab test before any release') },
  { id: 'DEF-FW-CR-04', code: 'FW-CR-04', name: 'Safety compliance label missing', type: 'Labeling', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Required safety or compliance label missing from footwear.', root_cause: 'Label not applied; wrong label stock; certification not completed.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('PP Sample / Final', 'HALT \u2014 replace all labels; 100% audit before ship') },
  // Major
  { id: 'DEF-FW-MJ-01', code: 'FW-MJ-01', name: 'Sole separation', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Outsole separating from upper at perimeter.', root_cause: 'Insufficient cement coverage; low press pressure; contaminated surface.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Inline', 'Peel test all pairs; re-cement with correct process') },
  { id: 'DEF-FW-MJ-02', code: 'FW-MJ-02', name: 'Glue overflow', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Excess adhesive visible on shoe exterior.', root_cause: 'Over-application of cement; improper technique; wrong nozzle.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Inline', 'Clean with solvent at finishing; re-inspect aesthetics') },
  { id: 'DEF-FW-MJ-03', code: 'FW-MJ-03', name: 'Uneven sole alignment', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Outsole not centered or aligned to upper.', root_cause: 'Incorrect lasting; press misalignment; operator error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Re-last; re-press; check lasting template') },
  { id: 'DEF-FW-MJ-04', code: 'FW-MJ-04', name: 'Incorrect shoe size', type: 'Measurement', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Shoe dimensions do not match labeled size.', root_cause: 'Wrong last used; cutting error; labeling mismatch.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Cutting / Final', 'Re-measure against last spec; re-label if needed') },
  { id: 'DEF-FW-MJ-05', code: 'FW-MJ-05', name: 'Heel instability', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Heel counter unstable, shoe collapses at heel.', root_cause: 'Heel counter not properly bonded; wrong stiffener spec.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Re-bond heel counter; check heel cup spec') },
  { id: 'DEF-FW-MJ-06', code: 'FW-MJ-06', name: 'Toe cap deformation', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Toe cap deformed or not holding shape.', root_cause: 'Incorrect toe puff material; lasting temperature too high.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Replace toe cap; check lasting process') },
  { id: 'DEF-FW-MJ-07', code: 'FW-MJ-07', name: 'Stitch break (upper/welt)', type: 'Stitching', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Thread breakage in upper or welt stitching.', root_cause: 'Wrong thread type; machine tension; worn needle.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Rework; check SPI and thread spec') },
  { id: 'DEF-FW-MJ-08', code: 'FW-MJ-08', name: 'Upper leather wrinkle', type: 'Fabric', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Wrinkled or creased leather on upper that cannot be smoothed.', root_cause: 'Leather moisture content incorrect; poor lasting technique.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Re-last; check upper moisture content') },
  { id: 'DEF-FW-MJ-09', code: 'FW-MJ-09', name: 'Eyelet misalignment', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Eyelets not aligned symmetrically on both sides.', root_cause: 'Jig positioning error; operator misalignment.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Inline', 'Re-set eyelet; check jig positioning') },
  // Minor
  { id: 'DEF-FW-MN-01', code: 'FW-MN-01', name: 'Minor scuff marks', type: 'Fabric', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Light scuff marks on shoe surface from handling.', root_cause: 'Rough handling; contact during storage or transit.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Buff at finishing; apply protective cream (leather)') },
  { id: 'DEF-FW-MN-02', code: 'FW-MN-02', name: 'Minor glue stain', type: 'Assembly', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Small adhesive residue visible on shoe exterior.', root_cause: 'Cement over-application; incomplete cleanup at finishing.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Clean at finishing; reject if cannot be removed') },
  { id: 'DEF-FW-MN-03', code: 'FW-MN-03', name: 'Slight color mismatch (pair)', type: 'Fabric', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Slight color difference between left and right shoe.', root_cause: 'Different leather hide areas; dye lot variation within roll.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final', 'Compare pair under D65 light; flag if \u0394E > 2.0') },
  { id: 'DEF-FW-MN-04', code: 'FW-MN-04', name: 'Minor surface scratch', type: 'Fabric', applies_to: FOOTWEAR_CATS, products_affected: FOOTWEAR_PRODUCTS, description: 'Light surface scratch on shoe upper.', root_cause: 'Handling damage; contact with sharp surface.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Buff; note on report; conditionally accept') },
]

// ═══════════════════════════════════════════════════════════════
// HEADWEAR DEFECTS (HW-)
// ═══════════════════════════════════════════════════════════════
const HEADWEAR_CATS: ProductCategoryId[] = ['headwear']
const HEADWEAR_PRODUCTS = ['Knit Caps', 'Balaclavas', 'Gaiters', 'Snap-On Hoods', 'HiVis Headwear', 'Hard Hat Liners']

const HEADWEAR_DEFECTS: Defect[] = [
  // Critical
  { id: 'DEF-HW-CR-01', code: 'HW-CR-01', name: 'Sharp component inside cap', type: 'Safety', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Sharp object (needle fragment, wire) found inside headwear.', root_cause: 'Broken needle not tracked; loose components; no metal detection.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'HALT \u2014 metal detector scan; 100% inspect; investigate') },
  { id: 'DEF-HW-CR-02', code: 'HW-CR-02', name: 'Chemical contamination', type: 'Safety', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Chemical contamination on headwear material.', root_cause: 'Contaminated raw materials; chemical exposure during production.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Material / Final', 'HALT \u2014 segregate lot; lab analysis; do not ship') },
  // Major
  { id: 'DEF-HW-MJ-01', code: 'HW-MJ-01', name: 'Panel misalignment', type: 'Assembly', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Cap panels not aligned correctly at seams.', root_cause: 'Stitch guide error; panel registration off; operator error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Rework; check stitch guide and panel registration') },
  { id: 'DEF-HW-MJ-02', code: 'HW-MJ-02', name: 'Broken stitching', type: 'Stitching', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Thread breakage in headwear seam.', root_cause: 'Machine malfunction; incorrect thread; worn needle.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Identify machine/operator; rework') },
  { id: 'DEF-HW-MJ-03', code: 'HW-MJ-03', name: 'Logo misprint', type: 'Printing', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Logo or branding incorrectly printed or embroidered on headwear.', root_cause: 'Wrong artwork file; embroidery machine calibration; operator setup error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Reject piece; re-embroider or re-print; check artwork') },
  { id: 'DEF-HW-MJ-04', code: 'HW-MJ-04', name: 'Size incorrect', type: 'Measurement', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Headwear dimensions do not match labeled size.', root_cause: 'Pattern error; knit gauge inconsistency; operator stretching.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Final', 'Re-measure head circumference; re-label') },
  { id: 'DEF-HW-MJ-05', code: 'HW-MJ-05', name: 'Visor deformation (ball caps)', type: 'Assembly', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Visor not holding shape or deformed.', root_cause: 'Wrong visor stiffener; heat-setting temperature incorrect.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Reject; check visor stiffener spec and heat-setting') },
  { id: 'DEF-HW-MJ-06', code: 'HW-MJ-06', name: 'Missing label', type: 'Labeling', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Required label missing from headwear.', root_cause: 'Operator skipped insertion; wrong bundle; label stock out.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Inline', 'Halt bundle; apply correct label; trace operator') },
  // Minor
  { id: 'DEF-HW-MN-01', code: 'HW-MN-01', name: 'Loose thread', type: 'Stitching', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Untrimmed thread tail on headwear.', root_cause: 'Thread not trimmed at finishing.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Trim at finishing before packing') },
  { id: 'DEF-HW-MN-02', code: 'HW-MN-02', name: 'Minor color variation', type: 'Fabric', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Slight color difference within acceptable tolerance.', root_cause: 'Minor dye lot variation.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Note on report; check within Grade 4 tolerance') },
  { id: 'DEF-HW-MN-03', code: 'HW-MN-03', name: 'Slight embroidery misalignment', type: 'Printing', applies_to: HEADWEAR_CATS, products_affected: HEADWEAR_PRODUCTS, description: 'Embroidery or print slightly off from approved position.', root_cause: 'Hoop positioning drift; operator error.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Accept if within \u00b13mm of approved position') },
]

// ═══════════════════════════════════════════════════════════════
// ACCESSORIES DEFECTS (AC-)
// ═══════════════════════════════════════════════════════════════
const ACCESSORIES_CATS: ProductCategoryId[] = ['accessories']
const ACCESSORIES_PRODUCTS = ['Pallet Covers', 'Tote Bags', 'Thermometers', 'Hand & Foot Warmers', 'Safety Gear']

const ACCESSORIES_DEFECTS: Defect[] = [
  // Critical
  { id: 'DEF-AC-CR-01', code: 'AC-CR-01', name: 'Sharp edges (exposed metal/plastic)', type: 'Safety', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Sharp exposed metal or plastic edge posing injury risk.', root_cause: 'Improper deburring; mold flash not removed; broken component.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'HALT \u2014 100% edge inspection; rework or reject') },
  { id: 'DEF-AC-CR-02', code: 'AC-CR-02', name: 'Chemical contamination', type: 'Safety', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Chemical contamination on accessory material.', root_cause: 'Contaminated raw materials; chemical exposure during production.', severity: 'CRITICAL', aql_class: '1.0', trend_risk: 'CRITICAL', test_standards: [], stage_checks: buildStageChecks('Material / Final', 'HALT \u2014 segregate; lab analysis; do not ship') },
  // Major
  { id: 'DEF-AC-MJ-01', code: 'AC-MJ-01', name: 'Broken zipper', type: 'Trims', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Zipper not functioning — jamming, separating, or teeth damaged.', root_cause: 'Defective zipper component; improper installation; wrong gauge.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Replace zipper; re-inspect operation') },
  { id: 'DEF-AC-MJ-02', code: 'AC-MJ-02', name: 'Zipper misalignment', type: 'Assembly', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Zipper tape not aligned correctly, causing puckering or offset.', root_cause: 'Incorrect sewing; tape twisted; operator error.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Inline', 'Re-attach; check tape alignment at sewing') },
  { id: 'DEF-AC-MJ-03', code: 'AC-MJ-03', name: 'Velcro failure (delamination/weak bond)', type: 'Trims', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Velcro delaminating or bond strength insufficient.', root_cause: 'Wrong Velcro grade; insufficient sewing/bonding; contaminated substrate.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Re-bond or re-sew; peel test after repair') },
  { id: 'DEF-AC-MJ-04', code: 'AC-MJ-04', name: 'Buckle defect (cracked/non-closing)', type: 'Trims', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Buckle cracked, broken, or not closing properly.', root_cause: 'Defective incoming component; wrong buckle spec; impact damage.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Material / Assembly', 'Replace buckle; check incoming component quality') },
  { id: 'DEF-AC-MJ-05', code: 'AC-MJ-05', name: 'Snap button failure', type: 'Trims', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Snap button not closing, opening under minimal force, or detaching.', root_cause: 'Wrong die setting; incorrect snap size; weak substrate fabric.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Assembly / Final', 'Replace snap; re-test 10-cycle operation') },
  { id: 'DEF-AC-MJ-06', code: 'AC-MJ-06', name: 'Label missing', type: 'Labeling', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Required label missing from accessory item.', root_cause: 'Operator skipped insertion; label stock ran out.', severity: 'MAJOR', aql_class: '2.5', trend_risk: 'HIGH', test_standards: [], stage_checks: buildStageChecks('Sewing / Final', 'Apply correct label; 100% audit affected bundle') },
  // Minor
  { id: 'DEF-AC-MN-01', code: 'AC-MN-01', name: 'Minor scratch', type: 'Fabric', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Light surface scratch on accessory.', root_cause: 'Handling damage; contact with abrasive surface.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Final / Packing', 'Note on report; conditionally accept') },
  { id: 'DEF-AC-MN-02', code: 'AC-MN-02', name: 'Slight color variation', type: 'Fabric', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Minor color difference within acceptable tolerance.', root_cause: 'Dye lot variation.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Note on report; check within Grade 4 tolerance') },
  { id: 'DEF-AC-MN-03', code: 'AC-MN-03', name: 'Minor stitching irregularity', type: 'Stitching', applies_to: ACCESSORIES_CATS, products_affected: ACCESSORIES_PRODUCTS, description: 'Slight stitch irregularity that does not affect structural integrity.', root_cause: 'Minor operator inconsistency; fabric thickness variation.', severity: 'MINOR', aql_class: '4.0', trend_risk: 'MEDIUM', test_standards: [], stage_checks: buildStageChecks('Inline / Final', 'Accept if structurally sound; note on report') },
]

// Merge all defect arrays
DEFECTS.push(...GARMENT_DEFECTS, ...GLOVE_DEFECTS, ...FOOTWEAR_DEFECTS, ...HEADWEAR_DEFECTS, ...ACCESSORIES_DEFECTS)

// Helper functions — reusable for future Inspection Forms
export function getDefectsForCategory(categoryId: ProductCategoryId): Defect[] {
  return DEFECTS.filter(d => d.applies_to.includes(categoryId))
}

export function getActiveDefectsAtStage(stageKey: StageKey): Defect[] {
  return DEFECTS.filter(d => d.stage_checks[stageKey].active)
}

export function getDefectByCode(code: string): Defect | undefined {
  return DEFECTS.find(d => d.code === code)
}

export function getDefectsBySeverity(severity: SeverityLevel): Defect[] {
  return DEFECTS.filter(d => d.severity === severity)
}
