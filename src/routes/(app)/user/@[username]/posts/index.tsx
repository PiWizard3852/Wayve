import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

import { eq } from 'drizzle-orm'
import { useGetUser } from '~/routes/(app)/user/@[username]/layout'

import { posts } from '~/db/schema'

import { VerifyAuth } from '~/components/Auth'
import { GetPostVote, PostView } from '~/components/Post'
import { GetDb, SortByRecent } from '~/components/Utils'

export const useGetPosts = routeLoader$(async (requestEvent) => {
  const user = await requestEvent.resolveValue(useGetUser)
  const currentUser = await VerifyAuth(requestEvent)

  const db = GetDb(requestEvent)

  const userPosts = await db.query.posts.findMany({
    where: eq(posts.username, user.username),
    columns: {
      id: true,
      createdAt: true,
      title: true,
      content: true,
    },
    with: {
      likes: true,
      dislikes: true,
      comments: {
        columns: {
          id: true,
        },
      },
      user: {
        columns: {
          name: true,
          username: true,
        },
      },
    },
  })

  return SortByRecent(await GetPostVote(userPosts, db, currentUser))
})

export default component$(() => {
  const posts = useGetPosts()

  if (!posts.value.id) {
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
