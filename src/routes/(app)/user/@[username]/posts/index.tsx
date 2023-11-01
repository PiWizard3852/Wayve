import { component$ } from '@builder.io/qwik'

import { PostView } from '~/components/Post'

export default component$(() => {
  const posts = []

  return (
    <>
      {posts.map((post) => (
        <PostView
          // @ts-ignore
          preview
          post={post}
          key={post.id}
        />
      ))}
    </>
  )
})
