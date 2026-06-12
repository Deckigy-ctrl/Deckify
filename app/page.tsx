import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeckifyApp from '@/components/deckify/DeckifyApp'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <DeckifyApp user={{ email: user.email, id: user.id }} />
  )
}
