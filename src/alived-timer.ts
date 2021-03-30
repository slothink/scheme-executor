/**
 * Alived Timer 로 스크립트 가동율 측정시에 성공/실패를 구분할 스크립트 가동율 임계치
 * - 100% 가동일 경우 1.0 사용
 * - 50% 가동일 경우 0.5 사용
 * - 0% 가동일 경우 0 사용
 */
export const REQUIRED_HIT_PERCENT = 0.75

/**
 * 스크립트 가동율 측정 주기(단위: ms)
 */
export const ALIVED_TIMER_INTERVAL = 50

/**
 * 스크립트 가동율로 스킴 수행 성공 여부를 판단하는 타이머 구현체
 *
 * 폴백 확정 시간 전까지 지속적으로 스스로를 콜백하여 성공 횟수를 기록하여 스크립트 가동율을 체크한다.
 * 스스로 콜백하는 것은 window.setTimer 를 이용하며 setTimer 는 느려서 콜백 주기가 짧을 경우 cpu 의 영향을 매우 받아서 정확한 측정이 어렵다.
 * > iPhone8 의 경우 interval 을 10ms 일 경우 45% 의 가동율을 보인다.
 *
 * 스크립트 가동율 방식은 적절한 스킴 Fallback 에 대안이 없을 때의 최후의 방법으로 사용되어야한다.
 * 현재는 시간차ㅣ
 */
export class AlivedTimer {
  constructor(public count: 0, public maxTimer: Date) {}

  onCallback() {
    this.count += 1
    if (new Date() < this.maxTimer) {
      this.fire()
    }
  }

  fire() {
    setTimeout(this.onCallback.bind(this), ALIVED_TIMER_INTERVAL)
  }

  getCount() {
    return this.count
  }
}
