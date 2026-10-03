"use client";

import { useState } from "react";
import type { CourseRoute, Place } from "@/lib/storyroute/types";
import { buildDaySchedule, formatClock, parseClock } from "@/lib/storyroute/schedule";
import styles from "./StoryRoute.module.css";

const stayOptions = [30, 60, 90, 120, 180, 240];

export function DaySchedule({ places, route }: { places: Place[]; route: CourseRoute | null }) {
  const [firstArrival, setFirstArrival] = useState("10:00");
  const [stayMinutes, setStayMinutes] = useState<Record<string, number>>({});
  const firstArrivalMinutes = parseClock(firstArrival);
  const schedule = firstArrivalMinutes === null ? null : buildDaySchedule(places, firstArrivalMinutes, stayMinutes, route);

  return <section className={styles.daySchedule} aria-labelledby="day-schedule-heading">
    <div className={styles.dayScheduleHead}>
      <div><p className={styles.eyebrow}>오늘의 시간 계획</p><h3 id="day-schedule-heading">몇 시쯤 마칠까요?</h3></div>
      <label className={styles.dayScheduleStart}>첫 장소 도착 시각
        <input type="time" value={firstArrival} onChange={event => setFirstArrival(event.target.value)} required aria-describedby="day-schedule-note" />
      </label>
    </div>
    <p className={styles.dayScheduleNote} id="day-schedule-note">집에서 첫 장소까지의 이동·주차·대기 시간은 포함하지 않아요. 체류 시간은 처음에 각 60분으로 잡고 직접 바꿀 수 있어요.</p>
    {firstArrivalMinutes === null ? <p className={styles.dayScheduleWarning}>첫 장소에 도착할 시각을 입력해주세요.</p> : <>
      <ol className={styles.dayScheduleStops}>{places.map((place, index) => {
        const stop = schedule!.stops[index];
        const stay = stayMinutes[place.id] ?? 60;
        return <li key={place.id}>
          <span className={styles.dayScheduleNumber}>{index + 1}</span>
          <div className={styles.dayScheduleStop}>
            {index > 0 && <p className={styles.dayScheduleDrive}>{stop.driveFromPreviousMinutes === null ? "이전 장소에서 이동 · 경로 확인 후 계산" : `이전 장소에서 자동차 약 ${stop.driveFromPreviousMinutes}분`}</p>}
            <div className={styles.dayScheduleStopLine}><strong>{place.name}</strong><span>{stop.arrivalMinutes === null ? "도착 미정" : `${formatClock(stop.arrivalMinutes)} 도착`}</span></div>
            <div className={styles.dayScheduleStay}><label htmlFor={`stay-${index}`}>머무는 시간</label>
              <select id={`stay-${index}`} value={stay} onChange={event => setStayMinutes(current => ({ ...current, [place.id]: Number(event.target.value) }))}>
                {stayOptions.map(minutes => <option key={minutes} value={minutes}>{minutes}분</option>)}
              </select><span>{stop.departureMinutes === null ? "출발 미정" : `${formatClock(stop.departureMinutes)} 출발`}</span>
            </div>
          </div>
        </li>;
      })}</ol>
      <div className={styles.dayScheduleResult} role="status">
        <span>장소 체류 {schedule!.totalStayMinutes}분{places.length === 1 ? " · 장소 간 이동 없음" : schedule!.totalDriveMinutes === null ? " · 이동시간 미확인" : ` · 장소 간 자동차 이동 약 ${schedule!.totalDriveMinutes}분`}</span>
        <strong>{schedule!.finishMinutes === null ? "전체 종료 시각은 경로 확인 후 표시" : `마지막 장소 예상 출발 ${formatClock(schedule!.finishMinutes)}`}</strong>
      </div>
      {schedule!.finishMinutes !== null && schedule!.finishMinutes >= 1440 && <p className={styles.dayScheduleWarning}>설정한 시간대로라면 마지막 장소에서 다음 날 출발해요. 시작 시각이나 체류 시간을 조정해보세요.</p>}
      <p className={styles.dayScheduleNote}>체류 시간은 직접 정한 계획값이고, 자동차 이동은 조회 시점의 예상값이에요. 실제 운영시간과 교통 상황은 출발 전에 다시 확인해주세요.</p>
    </>}
  </section>;
}
