import {Scheme} from "./scheme";
import {Fallback} from "./fallback";

export interface SchemeAndFallback {
  scheme: Scheme;
  fallback?: Fallback;
}
