import { Link } from 'react-router-dom'
import { EmptyState } from '../components/StateViews'

export default function NotFoundPage({ what = 'page' }: { what?: string }) {
  return (
    <EmptyState
      title={`This ${what} doesn't exist`}
      text="It may have been deleted, or the link is wrong."
      action={
        <Link to="/trips" className="btn-primary">
          Go to my trips
        </Link>
      }
    />
  )
}
