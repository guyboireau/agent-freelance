import LoginForm from './LoginForm'
import { safeRedirectPath } from '@/lib/safe-redirect'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams
  return <LoginForm nextPath={safeRedirectPath(next)} />
}
