import { AppDispatch } from '../store';
import { ComplaintFormData, FieldProvenance } from '../types/complaint';
import { setFormField } from '../store/complaintSlice';
import {
  setActiveExtractingField,
  addRecentlyFilledField,
  clearRecentlyFilledFields,
} from '../store/aiSlice';

export const FIELD_SEQUENCE: Array<{ field: keyof ComplaintFormData; label: string }> = [
  { field: 'customer_name', label: 'Customer Name' },
  { field: 'product_name', label: 'Product Name' },
  { field: 'product_strength', label: 'Product Strength' },
  { field: 'batch_number', label: 'Batch / Lot Number' },
  { field: 'complaint_date', label: 'Complaint Date' },
  { field: 'manufacturing_date', label: 'Manufacturing Date' },
  { field: 'expiry_date', label: 'Expiry Date' },
  { field: 'quantity_affected', label: 'Quantity Affected' },
  { field: 'complaint_type', label: 'Complaint Type' },
  { field: 'description', label: 'Defect Description' },
  { field: 'severity', label: 'Severity' },
  { field: 'priority', label: 'Priority' },
];

/**
 * Progressively populates form fields one by one with animated visual feedback.
 * This ensures the user sees immediate extraction progress in real time rather than waiting for a bulk dump.
 */
export async function progressivelyPopulateFields(
  dispatch: AppDispatch,
  data: Partial<ComplaintFormData>,
  provenanceMap?: FieldProvenance,
  delayPerFieldMs: number = 130
): Promise<void> {
  for (const item of FIELD_SEQUENCE) {
    const val = data[item.field];
    if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).toLowerCase() !== 'null') {
      // 1. Highlight field as actively being extracted / typed
      dispatch(setActiveExtractingField(item.field));
      await new Promise((resolve) => setTimeout(resolve, Math.max(delayPerFieldMs * 0.4, 45)));

      // 2. Dispatch the value into Redux form state
      const prov = provenanceMap?.[item.field] || 'AI Extracted';
      dispatch(
        setFormField({
          field: item.field,
          value: String(val),
          provenance: prov,
        })
      );
      dispatch(addRecentlyFilledField(item.field));

      // 3. Stagger before transitioning to next field
      await new Promise((resolve) => setTimeout(resolve, Math.max(delayPerFieldMs * 0.6, 65)));
    }
  }

  // Clear active extracting field indicator
  dispatch(setActiveExtractingField(null));

  // Fade out recently filled highlights smoothly after 2.5 seconds
  setTimeout(() => {
    dispatch(clearRecentlyFilledFields());
  }, 2500);
}
