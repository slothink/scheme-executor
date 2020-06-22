import {SchemeAndFallback} from "./scheme-and-fallback";

export interface Fallback {

  type: "URL" | "SCHEME";

  /**
   * fallbackType 이 'URL' 일 경우
   */
  fallbackUrl?: string;

  /**
   * fallbackType 이 'SCHEME' 일 경우
   */
  fallbackScheme?: SchemeAndFallback;
}
