import { component$, useSignal } from '@builder.io/qwik'
import { Link, routeLoader$ } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'

import { comments } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import { CommentView, GetCommentVotes } from '~/components/Comment'
import { GetDb } from '~/components/Utils'

export const useGetComment = routeLoader$(async (requestEvent) => {
  const commentId = requestEvent.params.commentId

  const currentUser = await VerifyAuth(requestEvent)

  if (!currentUser) {
    throw requestEvent.redirect(302, '/login')
  }

  const db = GetDb(requestEvent)

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: {
      id: true,
      postId: true,
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

  if (!comment) {
    return requestEvent.fail(404, {
      response: 'Comment does not exist',
    })
  }

  return (await GetCommentVotes([comment], db, currentUser))[0]
})

export default component$(() => {
  const data = useGetComment()
  const comment = useSignal(data.value)

  if (!comment.value.id) {
    return <></>
  }

  return (
    <div class='mb-[20px] flex flex-col'>
      <CommentView
        // @ts-ignore
        preview={true}
        comment={comment.value}
      />
      <Link
        class='cursor-pointer rounded-[5px] border border-solid border-border bg-white p-[10px] text-center duration-200 hover:text-branding'
        href={'/post/' + comment.value.postId}
      >
        See all comments
      </Link>
    </div>
  )
})
