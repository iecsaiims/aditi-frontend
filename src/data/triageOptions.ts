export type TriageOption = {
  code: string;
  label: string;
};

export const TRAUMA_ANATOMY_OPTIONS: TriageOption[] = [
  { code: 'CSPINE_SBC_LT15', label: 'C-spine injury with Single Breath Count < 15' },
  { code: 'NECK_SWELL', label: 'Visible neck swelling' },
  { code: 'MAJOR_VASC', label: 'Major vascular injury' },
  { code: 'CHEST_SE', label: 'Chest trauma: surgical emphysema' },
  { code: 'CHEST_CCT_POS', label: 'Chest trauma: CCT positive' },
  { code: 'CHEST_SEATBELT', label: 'Chest trauma: seat belt sign' },
  { code: 'CHEST_FLAIL', label: 'Chest trauma: flail chest' },
  { code: 'PELVIC_FX', label: 'Pelvic fracture (PCT+)' },
  { code: 'NEW_PARALYSIS', label: 'Any new paralysis' }
];

export const TRAUMA_MECHANISM_OPTIONS: TriageOption[] = [
  { code: 'GUNSHOT', label: 'Gunshot wound' },
  { code: 'STAB_TORSO', label: 'Stab injury in torso' },
  { code: 'CRUSH', label: 'Crush injury' },
  { code: 'AMPUT_PROX', label: 'Amputation proximal to wrist or ankle' },
  { code: 'OPEN_FX', label: 'Open fractures excluding hand/feet' },
  { code: 'FALL_GT_3X', label: 'Fall from > 3x patient height' },
  { code: 'FALL_GT_5_STAIRS', label: 'Fall from > 5 stairs' },
  { code: 'RTC_HEADON', label: 'High-speed head-on collision' },
  { code: 'COPASS_DEATH', label: 'Co-passenger death in RTC' },
  { code: 'EJECTION', label: 'Ejection from 4-wheeler' },
  { code: 'RAIL', label: 'Railway track injuries' },
  { code: 'RUN_OVER', label: 'Run over by vehicle' }
];

export const TRAUMA_SPECIAL_OPTIONS: TriageOption[] = [
  { code: 'EYE_CHEM', label: 'Chemical splash in the eye' },
  { code: 'PREG_GT14W', label: 'Pregnancy > 14 weeks' },
  { code: 'AGE_GT65', label: 'Age > 65 years' },
  { code: 'BLEED_DISORDER', label: 'Bleeding disorder' },
  { code: 'BURNS_GT20_OR_FACE', label: 'Burns > 20% BSA or facial burns' }
];

export const NCCT_HEAD_OPTIONS: TriageOption[] = [
  { code: 'VOMIT_GT2', label: 'Vomiting > 2 times' },
  { code: 'SEV_HEADACHE', label: 'Severe headache' },
  { code: 'AGE_GT65', label: 'Age > 65 years' },
  { code: 'FOCAL_DEF', label: 'Focal neurologic deficits' },
  { code: 'GCS_LT13_INIT', label: 'GCS < 13 on initial assessment' },
  { code: 'GCS_LT15_2H', label: 'GCS < 15 after 2 hours' },
  { code: 'BASAL_SKULL', label: 'Features of base of skull fracture' },
  { code: 'DANGEROUS_MECH', label: 'Dangerous mechanism of injury' },
  { code: 'COAG_OR_ANTICOAG', label: 'Coagulopathy / on anticoagulants' },
  { code: 'AMNESIA_GT30', label: 'Amnesia > 30 min' },
  { code: 'LOC_GT5', label: 'LOC > 5 min' },
  { code: 'SEIZURE', label: 'Seizures' }
];

export const NONTRAUMA_IMMEDIATE_RED_OPTIONS: TriageOption[] = [
  { code: 'ELECTROCUTION', label: 'Electrocution' },
  { code: 'DROWNING', label: 'Drowning' },
  { code: 'HANGING', label: 'Hanging' },
  { code: 'OVERDOSE_TOX', label: 'Drug overdose / toxic exposure' },
  { code: 'SNAKE_NEURO', label: 'Snake bite with ptosis/neck flaccid/local swelling/bleeding' },
  { code: 'VISION_LOSS', label: 'Acute onset vision loss' },
  { code: 'SYNCOPE_24H', label: 'Syncope within 24 hours' },
  { code: 'K_DERANGED', label: 'Serum K+ > 6 or < 2.5 mEq/L' }
];

export const HIGH_RISK_BLEEDING_OPTIONS: TriageOption[] = [
  { code: 'UNCONTROLLED_WOUND', label: 'Uncontrolled bleeding wound' },
  { code: 'HEMATEMESIS_12H', label: 'Hematemesis within 12 hours' },
  { code: 'HEMOPTYSIS_LARGE_12H', label: 'Large hemoptysis within 12 hours' },
  { code: 'BRISK_NRV', label: 'Brisk nasal/rectal/vaginal bleed' },
  { code: 'BLEED_ANTICOAG', label: 'Any bleed in anticoagulated patient' },
  { code: 'PV_PREG', label: 'PV bleed in pregnant patient' },
  { code: 'WET_PURPURA', label: 'Wet purpura' }
];

export const TIME_SENSITIVE_OPTIONS: TriageOption[] = [
  { code: 'STEMI_STROKE', label: 'Diagnosed/suspected STEMI or stroke' },
  { code: 'CHEST_LIKELY_CARDIAC', label: 'Acute chest discomfort likely cardiac' },
  { code: 'OBJ_WEAKNESS', label: 'Objective acute weakness' },
  { code: 'SLURRED_SPEECH', label: 'Difficulty talking / slurred speech' },
  { code: 'ANAPHYLAXIS', label: 'Suspected anaphylaxis' },
  { code: 'SCROTAL_PAIN', label: 'Acute scrotal pain in young male' },
  { code: 'URINE_RETENTION', label: 'Acute retention of urine' }
];

export const FEVER_DANGER_OPTIONS: TriageOption[] = [
  { code: 'BLEED_PETECH', label: 'Bleeding from any site / petechiae' },
  { code: 'JAUNDICE', label: 'Jaundice / icterus' },
  { code: 'VOMITING_REC', label: 'Recurrent vomiting' },
  { code: 'ABD_PAIN_SEV', label: 'Severe abdominal pain' },
  { code: 'AMS_CONF_SEIZ', label: 'Altered sensorium / confusion / seizure' },
  { code: 'IMMUNOCOMP', label: 'Immunocompromised state' },
  { code: 'SURGERY_7D', label: 'Major surgery within 7 days' },
  { code: 'CHEMO_LT14D', label: 'Received chemotherapy in < 14 days' },
  { code: 'APLASTIC_ANEMIA', label: 'Aplastic anemia' }
];

export const MINOR_LOW_RISK_OPTIONS: TriageOption[] = [
  { code: 'MINOR_EXISTING', label: 'Minor symptoms of existing illness' },
  { code: 'FEVER_NO_WARN', label: 'Fever without warning symptoms' },
  { code: 'MLE_ONLY', label: 'Medicolegal examination only' },
  { code: 'MINOR_COUGH_COLD', label: 'Minor/low-risk conditions (cough, cold, etc.)' }
];

export function labelsFor(options: TriageOption[], selected: string[], prefix?: string): string[] {
  const labels = new Map(options.map((option) => [option.code, option.label]));
  return selected.map((code) => (prefix ? `${prefix}: ${labels.get(code) ?? code}` : labels.get(code) ?? code));
}
