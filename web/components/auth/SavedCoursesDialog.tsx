"use client";

import { CalendarDays, MapPin, Trash2, X } from "lucide-react";
import type { SavedAccountCourse } from "@/lib/accountCourses";
import styles from "./SavedCoursesDialog.module.css";

export function SavedCoursesDialog({ courses, busy, onClose, onOpen, onDelete }: {
  courses: SavedAccountCourse[]; busy: boolean; onClose: () => void;
  onOpen: (course: SavedAccountCourse) => void; onDelete: (course: SavedAccountCourse) => void;
}) {
  return <div className={styles.backdrop} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="saved-course-title">
      <header><div><p>내 계정에 보관한 여행</p><h2 id="saved-course-title">저장한 코스</h2></div>
        <button type="button" onClick={onClose} aria-label="저장한 코스 닫기"><X size={21} /></button></header>
      {!courses.length ? <div className={styles.empty}><MapPin size={28} /><strong>저장한 코스가 아직 없어요</strong><p>마음에 드는 장소를 골라 첫 코스를 저장해보세요.</p></div> :
        <ul>{courses.map(course => <li key={course.id}><button className={styles.course} type="button" disabled={busy} onClick={() => onOpen(course)}>
          <strong>{course.title}</strong><span><MapPin size={14} />{course.intent.city ?? "강원도 전체"} · {course.placeIds.length}곳</span>
          <small><CalendarDays size={13} />{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(course.updatedAt))}</small></button>
          <button className={styles.delete} type="button" disabled={busy} onClick={() => onDelete(course)} aria-label={`${course.title} 삭제`}><Trash2 size={18} /></button></li>)}</ul>}
    </section>
  </div>;
}
