import { useParams } from 'react-router-dom'

export default function Plaza() {
  const { locationId } = useParams()
  return (
    <main>
      <h1>Plaza</h1>
      <p>locationId: {locationId ?? '(none)'}</p>
    </main>
  )
}
