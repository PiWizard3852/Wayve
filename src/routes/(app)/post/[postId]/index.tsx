import { component$ } from '@builder.io/qwik'

import { CommentView } from '~/components/Comment'

export default component$(() => {
  const comments = []

  return (
    <>
      {comments.map((comment) => (
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
