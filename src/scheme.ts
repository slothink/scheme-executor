export interface Scheme {
  schemeType: string; // 'SCHEME' or 'INTENT'
  value: string;
  withFallback: boolean;
}
