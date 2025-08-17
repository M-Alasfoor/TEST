export interface ReviewRow {
  id: string;
  fileName: string;
  crbr?: string;
  companyName?: string;
  totalAsset?: number;
  currentAssest?: number;
  nonCurrenAssets?: number;
  totalLiability?: number;
  currentLiability?: number;
  nonCurrenLiability?: number;
  totalEquitys?: number;
  currentEquitys?: number;
  nonCurrenEquitys?: number;
  turnover?: number;
  income?: number;
  expenses?: number;
  interestPaid?: number;
  interestReceived?: number;
  dividendsPaid?: number;
  dividendsReceived?: number;
  status?: 'extracted'|'needs-review'|'approved'|'failed';
}
