-- Product edits used to rebuild energy_label from scalar fields and drop the
-- official EPREL artwork/PDF routes. Restore only registrations whose exact
-- files are versioned in public/energy-labels.
UPDATE public.products
SET energy_label = COALESCE(energy_label, '{}'::jsonb) || jsonb_build_object(
  'labelImage', '/energy-labels/Label_' || eprel_id || '.png',
  'ficheDe', '/energy-labels/Fiche_' || eprel_id || '_DE.pdf',
  'ficheEn', '/energy-labels/Fiche_' || eprel_id || '_EN.pdf'
)
WHERE eprel_id IN (
  '2247679', '2251146', '2251148', '2251149',
  '2261239', '2298014', '2301641',
  '2339787', '2339789', '2339790',
  '2402612', '2402615', '2402618', '2402623', '2409885',
  '2526633'
);
