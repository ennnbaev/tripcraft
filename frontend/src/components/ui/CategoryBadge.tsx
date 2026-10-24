import { categoryStyle } from '../../lib/category'
import type { Category } from '../../types/api'

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, icon: Icon, slug } = categoryStyle(category)
  return (
    <span className={`tc-cat tc-cat--${slug}`}>
      <Icon className="tc-icon" aria-hidden />
      {label}
    </span>
  )
}
