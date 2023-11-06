import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

import { ne } from 'drizzle-orm'

import { posts } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import { GetPostVote, PostView } from '~/components/Post'
import { GetDb, SortByPopularity } from '~/components/Utils'

export const useGetPosts = routeLoader$(async (requestEvent) => {
  const currentUser = await VerifyAuth(requestEvent)

  if (!currentUser) {
    throw requestEvent.redirect(302, '/login')
  }

  const db = GetDb(requestEvent)

  const filteredPosts = await db.query.posts.findMany({
    where: ne(posts.username, currentUser.username),
    columns: {
      id: true,
      title: true,
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
      comments: {
        columns: {
          id: true,
        },
      },
      likes: true,
      dislikes: true,
    },
  })

  return SortByPopularity(await GetPostVote(filteredPosts, db, currentUser))
})

export default component$(() => {
  const posts = useGetPosts()

  if (posts.value.length === 0) {
    return <></>
  }

  return (
    <>
      {posts.value.map((post) => (
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
