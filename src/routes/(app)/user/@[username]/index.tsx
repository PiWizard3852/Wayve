import { component$ } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'

export const onRequest: RequestHandler = async ({ params, redirect }) => {
  redirect(302, `/user/@${params.username}/posts`)
}

export default component$(() => {
  return <></>
})
