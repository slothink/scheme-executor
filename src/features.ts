export interface Features {
  /**
   * iframe invoke 방식으로 스킴 실행이 가능한지 확인한다.
   */
  canExecuteSchemeByIframe: boolean

  /**
   * location change 방식으로 스킴 실행이 가능한지 확인한다.
   */
  canExecuteSchemeByChangeLocation: boolean

  /**
   * 페이지 로드시에 스킴 수행이 가능한지 확인한다.
   * 가능하지 않을 경우에는 스킴 수행 시도를 하면 안된다.
   *
   * - KUP-FACT-5 적용
   *
   * @return 시작 시에 스킴 수행이 가능할 경우 true, 불가능할 경우에 false
   */
  canStartScheme: boolean

  /**
   * 페이지 로드시에 Fallback Timer 수행이 가능하지 확인한다.
   * 가능하지 않을 경우에는 Fallback Timer 를 사용하면 안된다.
   *
   * - KUP-FACT-5 적용
   *
   * @return 시작 시에 Fallback Timer 사용이 가능할 경우 true, 불가능할 경우에 false
   * @see #canSchemeFallbackTimer()
   */
  canSchemeFallbackTimerOnStart: boolean

  /**
   * 페이지 로드시에 스킴 수행할 때 window.assign 방식이 사용 가능한지 확인한다.
   *
   * - KUP-FACT-6 적용
   *
   * @return window.assign 방식이 사용 가능할 경우 true, 가능하지 않을 경우에 false
   */
  canStartSchemeByAssign: boolean

  /**
   * intentURI 를 지원하는지 확인한다.
   * - https://developer.chrome.com/multidevice/android/intents
   * - https://github.com/nhnent/tui.app-loader/wiki/%EC%95%88%EB%93%9C%EB%A1%9C%EC%9D%B4%EB%93%9C-APP-%EC%8B%A4%ED%96%89-%EB%98%90%EB%8A%94-%ED%8A%B9%EC%A0%95-url%EB%A1%9C-%ED%8E%98%EC%9D%B4%EC%A7%80-%EC%9D%B4%EB%8F%99
   * @return
   */
  canIntentUri: boolean

  /**
   * IntentURI 사용시 <code>S.browser_fallback_url</code> 을 지원하는지 확인한다.
   * - https://paul.kinlan.me/launch-app-from-web-with-fallback/
   * @return
   */
  canIntentFallbackUrl: boolean

  /**
   * Apple Universal Link 를 지원하는지 확인한다.
   */
  canUniversalLink: boolean

  /**
   * 스킴 폴백시 타이머를 사용 가능한지에 대한 여부를 확인한다.
   * @return
   */
  canSchemeFallbackTimer: boolean

  /**
   * 스킴 실패에 대한 Fallback 수행시 딜레이 없이 가능하한지를 확인한다.
   * - KUP-FACT-4 적용
   *
   * @return delay 가 필요하지 않은 경우 true, delay 가 필요 할 경우 false
   */
  canNoDelayFallback: boolean
}
