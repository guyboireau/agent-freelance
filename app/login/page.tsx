import LoginForm from './LoginForm'

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return <LoginForm nextPath={searchParams.next || '/dashboard'} />
}
