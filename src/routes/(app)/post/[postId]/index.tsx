import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'

import { comments } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import { CommentView, GetCommentVotes } from '~/components/Comment'
import { GetDb, SortByPopularity } from '~/components/Utils'

export const useGetComments = routeLoader$(async (requestEvent) => {
  const postId = requestEvent.params.postId

  const currentUser = await VerifyAuth(requestEvent)

  if (!currentUser) {
    throw requestEvent.redirect(302, '/login')
  }

  const db = GetDb(requestEvent)

  const postComments = await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    columns: {
      id: true,
      content: true,
      createdAt: true,
    },
    with: {
      user: {
        columns: {
          name: true,
          username: true,
        },
      },
      likes: true,
      dislikes: true,
    },
  })

  return SortByPopularity(await GetCommentVotes(postComments, db, currentUser))
})

export default component$(() => {
  const comments = useGetComments()

  if (!comments) {
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
