import {
  FEVER_DANGER_OPTIONS,
  HIGH_RISK_BLEEDING_OPTIONS,
  MINOR_LOW_RISK_OPTIONS,
  NCCT_HEAD_OPTIONS,
  NONTRAUMA_IMMEDIATE_RED_OPTIONS,
  TIME_SENSITIVE_OPTIONS,
  TRAUMA_ANATOMY_OPTIONS,
  TRAUMA_MECHANISM_OPTIONS,
  TRAUMA_SPECIAL_OPTIONS,
  labelsFor
} from '../data/triageOptions';
import type { TriageEvaluationInput, TriageResult } from '../types/triage';

function selectedReasons(options: Parameters<typeof labelsFor>[0], selected: string[], prefix: string): string[] {
  return labelsFor(options, selected, prefix);
}

function uniqueReasons(reasons: string[]) {
  return Array.from(new Set(reasons.filter(Boolean)));
}

function hasValues(values: string[]) {
  return values.length > 0;
}

export function evaluateTriage(data: TriageEvaluationInput): TriageResult {
  const reasons: string[] = [];
  let hasRed = false;

  if (!data.isResponsive && data.isAcuteOnset) {
    reasons.push('Unresponsive with acute onset');
    hasRed = true;
  }

  if (data.severePain) {
    reasons.push('Severe pain (NRS >= 7)');
    hasRed = true;
  }

  if (data.acuteDistress) {
    reasons.push('Acute distress / agitation');
    hasRed = true;
  }

  if (data.redPhysioCheckboxes.length > 0) {
    reasons.push(`Clinical signs: ${data.redPhysioCheckboxes.join(', ')}`);
    hasRed = true;
  }

  const pulse = parseInt(data.pulse, 10);
  if (!Number.isNaN(pulse)) {
    if (pulse < 50) {
      reasons.push(`Pulse < 50 (${pulse})`);
      hasRed = true;
    }
    if (pulse > 120 && data.temp !== 'Febrile') {
      reasons.push(`Pulse > 120 without fever (${pulse})`);
      hasRed = true;
    }
  }

  const sbp = parseInt(data.sbp, 10);
  if (!Number.isNaN(sbp) && (sbp < 90 || sbp > 180)) {
    reasons.push(`SBP outside 90-180 (${sbp})`);
    hasRed = true;
  }

  const dbp = parseInt(data.dbp, 10);
  if (!Number.isNaN(dbp) && (dbp < 60 || dbp > 110)) {
    reasons.push(`DBP outside 60-110 (${dbp})`);
    hasRed = true;
  }

  const rr = parseInt(data.rr, 10);
  if (!Number.isNaN(rr) && (rr < 10 || rr > 22)) {
    reasons.push(`RR outside 10-22 (${rr})`);
    hasRed = true;
  }

  const spo2 = parseInt(data.spo2, 10);
  if (!Number.isNaN(spo2) && spo2 < 90) {
    reasons.push(`SpO2 < 90 (${spo2}%)`);
    hasRed = true;
  }

  if (data.consciousness !== 'Alert') {
    reasons.push(`Altered sensorium (${data.consciousness})`);
    hasRed = true;
  }

  if (data.pathway === 'Trauma') {
    if (hasValues(data.traumaAnatomy) || hasValues(data.traumaMechanism) || hasValues(data.traumaSpecial)) {
      hasRed = true;
      reasons.push(...selectedReasons(TRAUMA_ANATOMY_OPTIONS, data.traumaAnatomy, 'High-risk anatomy'));
      reasons.push(...selectedReasons(TRAUMA_MECHANISM_OPTIONS, data.traumaMechanism, 'High-risk mechanism'));
      reasons.push(...selectedReasons(TRAUMA_SPECIAL_OPTIONS, data.traumaSpecial, 'Special situation'));
    }

    if (data.tAmbulatory === false) reasons.push('Not ambulatory in ED');
    if (data.tNotAnticoag === false) reasons.push('On anticoagulation');
    if (hasValues(data.ncctHead)) {
      reasons.push(...selectedReasons(NCCT_HEAD_OPTIONS, data.ncctHead, 'NCCT head indication'));
    }

    if (hasRed) {
      return { category: 'RED', reason: uniqueReasons(reasons).join(' | ') };
    }

    if (data.tAmbulatory === true && data.tNotAnticoag === true && data.ncctHead.length === 0) {
      return {
        category: 'GREEN',
        reason: 'Trauma low-risk gate satisfied: ambulatory, not anticoagulated, no NCCT head indication'
      };
    }

    return {
      category: 'YELLOW',
      reason: uniqueReasons(reasons).join(' | ') || 'Trauma patient is high-risk negative but does not meet all GREEN criteria'
    };
  }

  if (hasValues(data.ntImmediateRed)) {
    hasRed = true;
    reasons.push(...selectedReasons(NONTRAUMA_IMMEDIATE_RED_OPTIONS, data.ntImmediateRed, 'Immediate RED'));
  }

  if (hasValues(data.ntBleeding)) {
    hasRed = true;
    reasons.push(...selectedReasons(HIGH_RISK_BLEEDING_OPTIONS, data.ntBleeding, 'High-risk bleeding'));
  }

  if (hasValues(data.ntTimeSensitive)) {
    hasRed = true;
    reasons.push(...selectedReasons(TIME_SENSITIVE_OPTIONS, data.ntTimeSensitive, 'Time-sensitive'));
  }

  if (hasValues(data.ntFeverDanger)) {
    hasRed = true;
    reasons.push(...selectedReasons(FEVER_DANGER_OPTIONS, data.ntFeverDanger, 'High-risk fever'));
  }

  if (hasRed) {
    return { category: 'RED', reason: uniqueReasons(reasons).join(' | ') };
  }

  if (hasValues(data.ntMinorLowRisk)) {
    return {
      category: 'GREEN',
      reason: selectedReasons(MINOR_LOW_RISK_OPTIONS, data.ntMinorLowRisk, 'Minor / low-risk').join(' | ')
    };
  }

  if (data.noneOfTheAbove) {
    return { category: 'YELLOW', reason: 'Does not meet RED or GREEN criteria' };
  }

  return { category: 'YELLOW', reason: 'Non-trauma patient not meeting RED or GREEN criteria' };
}

export function mapCategoryToArea(category: string): string {
  const areaMap: Record<string, string> = {
    RED: 'Red Area',
    YELLOW: 'Yellow Area',
    GREEN: 'Green Area',
    BLACK: 'Other'
  };

  return areaMap[category] ?? 'Other';
}
