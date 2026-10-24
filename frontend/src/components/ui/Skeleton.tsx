import type { CSSProperties } from 'react'

/** Shimmer placeholder; size it with className or style. */
export default function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`tc-skel ${className}`} style={style} aria-hidden />
}
