import { ButtonLink } from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function NotFoundPage({ what = 'page' }: { what?: string }) {
  return (
    <div className="tc-wrap" style={{ maxWidth: 880 }}>
      <EmptyState
        title={`This ${what} doesn't exist`}
        text="It may have been deleted, or the link is wrong."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink to="/trips" variant="primary">
              Go to my trips
            </ButtonLink>
            <ButtonLink to="/" variant="secondary">
              Plan a new trip
            </ButtonLink>
          </div>
        }
      />
    </div>
  )
}
