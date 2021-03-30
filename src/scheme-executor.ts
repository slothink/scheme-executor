import { Scheme } from './scheme'

declare var document: any
declare var window: any
declare var $: any

import { Features } from './features'
import { Fallback } from './fallback'
import { ALIVED_TIMER_INTERVAL, AlivedTimer, REQUIRED_HIT_PERCENT } from './alived-timer'

/**
 * Fallback 방식에 대한 개요
 * 1. intent with fallback : 안드로이드 Intent 스킴 자체에서 지원하며 해당 스킴이 사용 가능할 경우 100% 보장함
 * 2. 시간차 timer : intent / scheme 호출 ( Location 변경 또는 iframe 호출 방법 등으로) 시 fallback 시 시작시간과 시간차 타이머의 콜백 시간차이로 구분함. 특정 환경을 제외하고 높은 확률로 보장함.
 * 3. 스크립트 가동율 타이머: 스킴 수행시 모 앱의 브라우저의 스크립트 가동율을 떨어짐을 체크하여 특정 임계치 아래로 떨어질 경우로 구분함.
 */
export default class SchemeExecutor {
  features: Features
  starting: boolean
  timerTrigger: number

  constructor(features: Features, starting: boolean = false) {
    this.features = features
    this.starting = starting
    const appleStandaloneMode =
      window && 'standalone' in window.navigator && window.navigator.standalone
    this.timerTrigger = appleStandaloneMode ? 1500 : 500 // SXN-7 지원
  }

  debug(message: any): void {
    console.log('SchemeExecutor Debugging: ' + message)
    $('#debug-panel').append(message + '<br>')
  }

  invokeAssign(src: string): void {
    let w = window.parent ? window.parent : window
    w.location.assign(src)
  }

  invokeIframe(src: string): void {
    let iframe = document.createElement('iframe')
    iframe.setAttribute('src', src)
    document.documentElement.appendChild(iframe)
    iframe.parentNode.removeChild(iframe)
    iframe = null
  }

  changeLocation(src: string): void {
    document.location.href = src
  }

  execute(src: string, fallbackUrl?: string): void {
    if (this.features.canExecuteSchemeByIframe) {
      console.log('[SchExec] ifrmae:', src)
      this.invokeIframe(src)
    } else if (this.features.canExecuteSchemeByChangeLocation) {
      console.log('[SchExec] changeLocation:', src)
      this.changeLocation(src)
    } else {
      if (fallbackUrl) {
        console.log('[SchExec] with fallback:', src)
        this.changeLocation(fallbackUrl)
      }
    }
  }

  executeSchemeWithFallbackUrl(
    scheme: Scheme,
    fallbackUrl?: string,
    replaceLocation: boolean = false
  ) {
    let fallback: Fallback | undefined
    if (fallbackUrl) {
      fallback = {
        type: 'URL',
        fallbackUrl: fallbackUrl
      }
    }
    this.executeScheme(scheme, fallback, replaceLocation)
  }

  executeScheme(scheme: Scheme, fallback?: Fallback, replaceLocation: boolean = false): void {
    if (this.starting === true && !this.features.canStartScheme) {
      // return;
      // SXN5 : 크롬 40+ 환경에서 시작시에 intent with fallback 이 수행될 경우 무조건 fallback 되는 이슈가 있었음
      // 그러나 링크 또는 홈 화면에서 진입시에는 스킴이 실행이 되므로 위 사항을 known 이슈로 진행하는 것이 좋음
      // 따라서 `return;` 코드를 막음.
    }

    this.debug(
      'ExecuteScheme. scheme:' +
        JSON.stringify(scheme) +
        ', fallback:' +
        JSON.stringify(fallback || null)
    )

    const startAt = new Date()
    const start = +new Date()
    let alivedTimer = new AlivedTimer(0, new Date(+new Date() + 2000))
    alivedTimer.fire()
    let that = this
    let requiredHit = (this.timerTrigger / ALIVED_TIMER_INTERVAL) * REQUIRED_HIT_PERCENT // 임계치 90% -> 75% . LEMMINGS-105 이슈 참조
    let fallbackTimer = () => {
      let now = new Date()
      let diff = now.valueOf() - start.valueOf()
      this.debug(`fallback timer callbacked. at: ${now}, started:${startAt}. diff:${diff}`)

      if (diff < 2000) {
        let realHit = alivedTimer.getCount()
        this.debug(`alived Timer status. realHit: ${realHit}, requiredHit: ${requiredHit}`)
        if (fallback && realHit * 1.0 > requiredHit) {
          // 유효 타임인 1500 ms 또한 스크립트가 90% 실행되었을 경우의 횟수 = 13
          const fallbackUrl = fallback.fallbackUrl
          if (
            fallback.type === 'URL' &&
            fallbackUrl &&
            fallbackUrl.indexOf('http') === 0 &&
            replaceLocation
          ) {
            // fallback type 이 URL 이고, 실제로 url 이 URL 유형인 경우. (fallback type 을 url 로 하면서, 값은 url 이 아닌 경우도 존재한다.)
            this.debug('fallback case: 1')
            if (that.features.canNoDelayFallback) {
              this.debug('fallback case: 1-1')
              window.location.replace(fallbackUrl)
            } else {
              this.debug('fallback case: 1-2')
              setTimeout(() => {
                window.location.replace(fallbackUrl)
              }, 1000)
            }
          } else {
            this.debug('fallback case: 2')
            // fallbackType 이 'SCHEME' 이거나 fallbackType 이 URL 인데 http/https 프로토토콜이 아닌 경우
            if (fallback.type === 'URL') {
              this.debug(`fallback case: 2-1. fallbackUrl: ${fallbackUrl}`)
              if (that.features.canNoDelayFallback) {
                this.debug('fallback case: 2-1-1')
                window.location.href = fallbackUrl
              } else {
                this.debug('fallback case: 2-1-2')
                setTimeout(() => {
                  window.location.href = fallbackUrl
                }, 1000)
              }
            } else if (fallback.type === 'SCHEME') {
              this.debug('fallback case: 2-2')
              if (that.features.canNoDelayFallback) {
                if (!fallback.fallbackScheme) {
                  throw Error(
                    '[FB-CASE-2-2-1] fallback.type is SCHEME. but fallback.fallbackScheme was undefined'
                  )
                }
                let fallbackSchemeExecutor = new SchemeExecutor(that.features, that.starting)
                fallbackSchemeExecutor.executeScheme(
                  fallback.fallbackScheme.scheme,
                  fallback.fallbackScheme.fallback,
                  replaceLocation
                )
              } else {
                setTimeout(() => {
                  if (!fallback.fallbackScheme) {
                    throw Error(
                      '[FB-CASE-2-2-2] fallback.type is SCHEME. but fallback.fallbackScheme was undefined'
                    )
                  }
                  let fallbackSchemeExecutor = new SchemeExecutor(that.features, that.starting)
                  fallbackSchemeExecutor.executeScheme(
                    fallback.fallbackScheme.scheme,
                    fallback.fallbackScheme.fallback,
                    replaceLocation
                  )
                }, 1000)
              }
            } else {
              // 입력 값 오류
            }
          }
        } else {
          this.debug('fallbackTimer recognized app executed successfully by alived timer')
        }
      } else {
        // 시작 시간과 타이머 콜백시간이 최소 2초가 지났으므로 99% 스킴 정상 수행 케이스이다.
        this.debug('fallbackTimer recognized app executed successfully by long delay')
      }
    }

    if (this.features.canIntentFallbackUrl) {
      this.debug(`Exec: Case1. IntentFallbackUrl`)
      if (scheme.withFallback) {
        this.debug(`Exec: Case1-1`)
        this.doStandardAction(scheme)
      } else {
        this.debug(`Exec: Case1-2. v2. schemeType:${scheme.schemeType}, value:${scheme.value}`)
        if (this.starting) {
          // SXN-5
          if (this.features.canSchemeFallbackTimerOnStart) {
            this.fireTimerTrigger(fallbackTimer)
          }
        } else {
          this.fireTimerTrigger(fallbackTimer)
        }
        this.doStandardAction(scheme)
      }
    } else if (this.features.canSchemeFallbackTimer) {
      this.debug(`Exec: Case2. SchemeFallbackTimer`)
      this.fireTimerTrigger(fallbackTimer)
      if (this.starting) {
        this.debug(`Exec: Case2-1`)
        if (this.features.canStartSchemeByAssign) {
          this.debug(`Exec: Case2-2`)
          this.invokeAssign(scheme.value)
          return
        }
      }
      this.debug(`Exec: Case2-2`)
      this.doStandardAction(scheme)
    } else {
      this.debug(`Exec: Case3. No Action.`)
      // 사용 가능한 폴백이 없다. 따라서 아무것도 하지 않는다.
    }
  }

  fireTimerTrigger(fallbackTimer: Function) {
    this.debug(
      `Fallback Timer Trigger fired. at: ${new Date().valueOf()}, will trigger after ${
        this.timerTrigger
      }`
    )
    setTimeout(fallbackTimer.bind(this), this.timerTrigger)
  }

  doStandardAction(scheme: Scheme) {
    let execValue = scheme.value
    if (this.starting && !this.features.canSchemeFallbackTimerOnStart) {
      if (scheme.schemeType === 'INTENT') {
        execValue = execValue.replace(/S\.browser_fallback_url=(.*);/, '')
        this.debug(`Std Action: replaced scheme value. ${scheme.value} => ${execValue}`)
      }
    }
    if (this.features.canExecuteSchemeByIframe) {
      this.debug(`Std Action: Iframe called`)
      this.invokeIframe(execValue)
    } else if (this.features.canExecuteSchemeByChangeLocation) {
      this.debug(`Std Action: Location changed`)
      this.changeLocation(execValue)
    } else {
      // do not any action.
      this.debug(`Std Action: No act`)
    }
  }
}
