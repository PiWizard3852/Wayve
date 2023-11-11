import { component$ } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async (requestEvent) => {
  throw requestEvent.redirect(
    301,
    `/user/@${requestEvent.params.username}/posts`,
  )
}

export default component$(() => {
  return <></>
})
