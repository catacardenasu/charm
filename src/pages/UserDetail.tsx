import { useParams } from 'react-router-dom'

export default function UserDetail() {
  const { userId } = useParams()
  return (
    <main>
      <h1>Avatar detail</h1>
      <p>userId: {userId ?? '(none)'}</p>
    </main>
  )
}
