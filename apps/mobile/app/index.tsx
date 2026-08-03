import { signOut } from '@pinpoint/auth'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Button, ScrollView, Text, View } from 'react-native'

import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

/**
 * The signed-in screen.
 *
 * Same query as the web app, against the same policies, through a different
 * bundler. That last part is the point: a package resolving under Next proves
 * nothing about Metro, and the trips arriving here is what proves both.
 *
 * No map yet — that is the next change.
 */

interface TripRow {
  id: string
  name: string
  archived: boolean
  trip_members: { display_name: string }[]
}

export default function Index() {
  const { session, loading } = useSession()
  const [trips, setTrips] = useState<TripRow[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!session) return
    let active = true

    supabase
      .from('trips')
      .select('id, name, archived, trip_members (display_name)')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setFailed(true)
        else setTrips(data)
      })

    return () => {
      active = false
    }
  }, [session])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!session) return <Redirect href="/login" />

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>pinpoint</Text>

      {failed ? <Text>Could not load your trips.</Text> : null}

      {trips === null && !failed ? <ActivityIndicator /> : null}

      {trips?.length === 0 ? (
        // Not an error — an account with no membership correctly sees nothing.
        <Text>You are not on any trips yet.</Text>
      ) : null}

      {trips?.map((trip) => (
        <View key={trip.id}>
          <Text style={{ fontWeight: '600' }}>
            {trip.name}
            {trip.archived ? ' (archived)' : ''}
          </Text>
          <Text style={{ opacity: 0.7 }}>
            {trip.trip_members.map((member) => member.display_name).join(', ')}
          </Text>
        </View>
      ))}

      <Button title="Sign out" onPress={() => void signOut(supabase)} />
    </ScrollView>
  )
}
