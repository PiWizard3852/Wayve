import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'
import { useGetUser } from '~/routes/(app)/user/@[username]/layout'

import { posts } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import { CommentView, GetCommentVotes } from '~/components/Comment'
import { GetDb, SortByRecent } from '~/components/Utils'

export const useGetComments = routeLoader$(async (requestEvent) => {
  const user = await requestEvent.resolveValue(useGetUser)
  const currentUser = await VerifyAuth(requestEvent)

  const db = GetDb(requestEvent)

  const userComments = await db.query.comments.findMany({
    where: eq(posts.username, user.username),
    columns: {
      id: true,
      postId: true,
      createdAt: true,
      content: true,
    },
    with: {
      likes: true,
      dislikes: true,
      user: {
        columns: {
          name: true,
          username: true,
        },
      },
    },
  })

  return SortByRecent(await GetCommentVotes(userComments, db, currentUser))
})

export default component$(() => {
  const data = useGetComments()
  const comments = useSignal(data.value)

  if (comments.value.length === 0) {
    return <></>
  }

  return (
    <>
      {comments.value.map((comment) => (
        <CommentView
          // @ts-ignore
          preview
          comment={comment}
          key={comment.id}
        />
      ))}
    </>
  )
})
