import { useParams } from 'react-router-dom'

export default function Keychain() {
  const { code } = useParams()
  return (
    <main>
      <h1>Tap in</h1>
      <p>code: {code ?? '(none)'}</p>
    </main>
  )
}
