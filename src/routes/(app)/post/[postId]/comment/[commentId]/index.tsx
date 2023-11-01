import { component$ } from '@builder.io/qwik'
import { Link } from '@builder.io/qwik-city'

import { CommentView } from '~/components/Comment'

export default component$(() => {
  const comment = {
    content: 'This is the example content',
    postId: '2344',
    user: {
      username: 'wodicode',
      name: 'test user',
    },
    likes: [],
    dislikes: [],
    createdAt: new Date(),
  }

  return (
    <div class='mb-[20px] flex flex-col'>
      <CommentView
        // @ts-ignore
        preview={true}
        comment={comment}
      />
      <Link
        class='cursor-pointer rounded-[5px] border border-solid border-border bg-white p-[10px] text-center duration-200 hover:text-branding'
        href={'/post/' + comment.postId}
      >
        See all comments
      </Link>
    </div>
  )
})
