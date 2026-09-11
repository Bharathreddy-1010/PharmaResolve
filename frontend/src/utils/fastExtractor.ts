import { ComplaintFormData } from '../types/complaint';

/**
 * Fast client-side regex/heuristic parser for instant 0ms pre-extraction.
 * Parses customer, product, dosage, batch, dates, quantities, complaint types,
 * and incident descriptions from memos, emails, portal tickets, or freeform text.
 */
export function fastExtractComplaint(rawText: string, defaultSource: string = 'Email'): Partial<ComplaintFormData> {
  if (!rawText || !rawText.trim()) return {};

  const result: Partial<ComplaintFormData> = {
    complaint_source: defaultSource,
  };

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Customer / Facility Name
  const custMatch =
    text.match(/(?:Customer|Client|Facility|Reported By|Account|Hospital|Distributor|Pharmacy):\s*([^\n\r,]+)/i) ||
    text.match(/From:\s*(?:Dr\.\s*|Mr\.\s*|Ms\.\s*)?([A-Za-z0-9\s\.\-_]+?)(?:<|\n|\r|$)/i);
  if (custMatch && custMatch[1].trim()) {
    let cust = custMatch[1].trim();
    // remove email brackets
    cust = cust.replace(/<[^>]+>/g, '').trim();
    if (cust.length > 2 && !['A', 'THE', 'QA', 'QC', 'COMPLAINTS'].includes(cust.toUpperCase())) {
      result.customer_name = cust;
    }
  }

  // 2. Product Name & Strength
  const prodMatch =
    text.match(/(?:Product(?:\s*Name)?|Drug|Medication|Item):\s*([^\n\r]+)/i) ||
    text.match(/(?:Regarding|Notification\s*-\s*|for\s+)([A-Za-z0-9\s\-]+?)\s+(\d+\s*(?:mg|g|ml|mcg|iu|%))/i) ||
    text.match(/\b(Ibuprofen(?:\s+Film-Coated\s+Tablets)?|Paracetamol(?:\s+Tablets)?|Amoxicillin(?:\s+Trihydrate\s+Capsules)?|Metformin|Atorvastatin|Ciprofloxacin|Omeprazole|Aspirin)\b[^\n\r,\.]*/i);

  if (prodMatch && prodMatch[1].trim()) {
    let rawProd = prodMatch[1].trim();
    // Extract strength if attached to product line (e.g. "Ibuprofen Film-Coated Tablets 200 mg")
    const strengthInProd = rawProd.match(/(\d+\s*(?:mg|g|ml|mcg|iu|%))/i);
    if (strengthInProd) {
      result.product_strength = strengthInProd[1].trim();
      rawProd = rawProd.replace(strengthInProd[0], '').trim();
    }
    result.product_name = rawProd;
  }

  // If strength not yet found, search entire text
  if (!result.product_strength) {
    const strengthMatch =
      text.match(/(?:Strength|Dosage|Dose):\s*(\d+\s*(?:mg|g|ml|mcg|iu|%))/i) ||
      text.match(/\b(\d+\s*(?:mg|g|ml|mcg|iu|%))\b/i);
    if (strengthMatch) {
      result.product_strength = strengthMatch[1].trim();
    }
  }

  // 3. Batch / Lot Number
  const batchMatch =
    text.match(/(?:Batch(?:\/Lot)?|Lot)(?:\s*(?:Number|No|#))?:\s*([A-Za-z0-9\-]+)/i) ||
    text.match(/\(Batch\s+([A-Za-z0-9\-]+)\)/i) ||
    text.match(/Batch\s+([A-Za-z0-9\-]+)/i) ||
    text.match(/\b([A-Z]\d{4,8}|[A-Z]{2,4}-\d{4,8})\b/);
  if (batchMatch && batchMatch[1].trim()) {
    const val = batchMatch[1].trim().toUpperCase();
    if (!['NOT', 'THE', 'AND', 'FOR', 'REGARDING'].includes(val)) {
      result.batch_number = val;
    }
  }

  // 4. Complaint Date
  const compDateMatch =
    text.match(/(?:Complaint Date|Reported Date|Intake Date|Date):\s*([^\n\r]+)/i);
  if (compDateMatch && compDateMatch[1].trim()) {
    result.complaint_date = compDateMatch[1].trim();
  }

  // 5. Manufacturing Date
  const mfgMatch =
    text.match(/(?:Manufacturing Date|Mfg Date|DOM|Mfg\. Date):\s*([^\n\r]+)/i);
  if (mfgMatch && mfgMatch[1].trim()) {
    result.manufacturing_date = mfgMatch[1].trim();
  }

  // 6. Expiry Date
  const expMatch =
    text.match(/(?:Expiry Date|Exp Date|Expiration Date|DOE|Exp\. Date):\s*([^\n\r]+)/i);
  if (expMatch && expMatch[1].trim()) {
    result.expiry_date = expMatch[1].trim();
  }

  // 7. Quantity Affected
  const qtyMatch =
    text.match(/(?:Quantity(?:\s*Affected)?|Qty|Count):\s*([^\n\r]+)/i) ||
    text.match(/(\d+[\d,]*\s*(?:boxes|cartons|tablets|capsules|units|bottles|packs|vials|strips|blisters))/i);
  if (qtyMatch && qtyMatch[1].trim()) {
    result.quantity_affected = qtyMatch[1].trim();
  }

  // 8. Complaint Type Classification
  if (
    lower.includes('blister') ||
    lower.includes('carton') ||
    lower.includes('foil') ||
    lower.includes('seal') ||
    lower.includes('crushed') ||
    lower.includes('puncture') ||
    lower.includes('packaging')
  ) {
    result.complaint_type = 'Packaging Defect';
  } else if (
    lower.includes('broken') ||
    lower.includes('discoloration') ||
    lower.includes('chipped') ||
    lower.includes('mottling') ||
    lower.includes('particle') ||
    lower.includes('dissolution')
  ) {
    result.complaint_type = 'Product Quality Complaint';
  } else if (
    lower.includes('shortage') ||
    lower.includes('missing') ||
    lower.includes('fewer') ||
    lower.includes('quantity discrepancy')
  ) {
    result.complaint_type = 'Quantity / Shipment Issue';
  } else if (
    lower.includes('label') ||
    lower.includes('leaflet') ||
    lower.includes('smudged') ||
    lower.includes('misprint')
  ) {
    result.complaint_type = 'Labeling / Artwork Defect';
  }

  // 9. Defect Description Narrative
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const narrativeLines = lines.filter((l) => {
    const lLower = l.toLowerCase();
    return (
      !lLower.startsWith('customer:') &&
      !lLower.startsWith('client:') &&
      !lLower.startsWith('product:') &&
      !lLower.startsWith('product name:') &&
      !lLower.startsWith('batch') &&
      !lLower.startsWith('date:') &&
      !lLower.startsWith('complaint date:') &&
      !lLower.startsWith('manufacturing date:') &&
      !lLower.startsWith('expiry date:') &&
      !lLower.startsWith('quantity:') &&
      !lLower.startsWith('from:') &&
      !lLower.startsWith('to:') &&
      !lLower.startsWith('subject:') &&
      !lLower.startsWith('portal intake') &&
      !lLower.startsWith('customer portal') &&
      !lLower.startsWith('recorded by:') &&
      !lLower.startsWith('caller:') &&
      !lLower.startsWith('best regards') &&
      !lLower.startsWith('dear ') &&
      l.length > 15
    );
  });

  if (narrativeLines.length > 0) {
    result.description = narrativeLines.join(' ');
  } else if (text.length > 25) {
    result.description = text;
  }

  // 10. Severity & Priority
  if (
    lower.includes('urgent') ||
    lower.includes('severe') ||
    lower.includes('crushed') ||
    lower.includes('severed') ||
    lower.includes('pierced') ||
    lower.includes('contamination') ||
    lower.includes('compromised')
  ) {
    result.severity = 'Critical';
    result.priority = 'High';
  } else if (
    lower.includes('minor') ||
    lower.includes('scratch') ||
    lower.includes('slight')
  ) {
    result.severity = 'Minor';
    result.priority = 'Low';
  } else {
    result.severity = 'Moderate';
    result.priority = 'Medium';
  }

  return result;
}
