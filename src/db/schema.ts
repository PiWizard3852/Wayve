import { relations } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
  'user',
  {
    name: varchar('name', { length: 180 }).notNull(),
    username: varchar('username', { length: 50 }).primaryKey().notNull(),
    email: varchar('email', { length: 180 }).notNull(),
    emailVerified: boolean('email_verified').default(false),
    password: varchar('password', { length: 60 }).notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: false,
      mode: 'date',
    }).defaultNow(),
  },
  (table) => {
    return {
      emailKey: uniqueIndex('email_key').on(table.email),
    }
  },
)

export const userRelations = relations(users, ({ one, many }) => ({
  verification: one(verifications, {
    fields: [users.email],
    references: [verifications.email],
  }),
  followers: many(followers, { relationName: 'followers' }),
  following: many(followers, { relationName: 'following' }),
  posts: many(posts),
  postLikes: many(postLikes),
  postDislikes: many(postDislikes),
  comments: many(comments),
  commentLikes: many(commentLikes),
  commentDislikes: many(commentDislikes),
}))

export const verifications = pgTable(
  'verification',
  {
    id: uuid('id').defaultRandom(),
    email: varchar('email', { length: 180 }).notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: false,
      mode: 'date',
    }).defaultNow(),
  },
  (table) => {
    return {
      emailKey: uniqueIndex('email_key').on(table.email),
    }
  },
)

export const verificationRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.email],
    references: [users.email],
  }),
}))

export const followers = pgTable('follower', {
  followed: varchar('user', { length: 191 }).notNull(),
  follower: varchar('follower', { length: 191 }).notNull(),
})

export const followerRelations = relations(followers, ({ one }) => ({
  user: one(users, {
    fields: [followers.followed],
    references: [users.username],
    relationName: 'followers',
  }),
  follower: one(users, {
    fields: [followers.follower],
    references: [users.username],
    relationName: 'following',
  }),
}))

export const posts = pgTable('post', {
  id: uuid('id').defaultRandom(),
  username: varchar('username', { length: 191 }).notNull(),
  title: varchar('title', { length: 80 }).notNull(),
  content: varchar('content', { length: 500 }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: false,
    mode: 'date',
  }).defaultNow(),
})

export const postRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.username],
    references: [users.username],
  }),
  likes: many(postLikes),
  dislikes: many(postDislikes),
  comments: many(comments),
}))

export const postLikes = pgTable('post_like', {
  postId: uuid('post_id').notNull(),
  voter: varchar('voter', { length: 191 }).notNull(),
})

export const postLikeRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.voter],
    references: [users.username],
  }),
}))

export const postDislikes = pgTable('post_dislike', {
  postId: uuid('post_id').notNull(),
  voter: varchar('voter', { length: 191 }).notNull(),
})

export const postDislikeRelations = relations(postDislikes, ({ one }) => ({
  post: one(posts, {
    fields: [postDislikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postDislikes.voter],
    references: [users.username],
  }),
}))

export const comments = pgTable('comment', {
  id: uuid('id').defaultRandom(),
  postId: uuid('post_id').notNull(),
  username: varchar('username', { length: 191 }).notNull(),
  content: varchar('content', { length: 500 }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: false,
    mode: 'date',
  }).defaultNow(),
})

export const commentsRelations = relations(comments, ({ many, one }) => ({
  user: one(users, {
    fields: [comments.username],
    references: [users.username],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  likes: many(commentLikes),
  dislikes: many(commentDislikes),
}))

export const commentLikes = pgTable('comment_like', {
  commentId: uuid('post_id').notNull(),
  voter: varchar('voter', { length: 191 }).notNull(),
})

export const commentLikeRelations = relations(commentLikes, ({ one }) => ({
  post: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentLikes.voter],
    references: [users.username],
  }),
}))

export const commentDislikes = pgTable('comment_dislike', {
  commentId: uuid('post_id').notNull(),
  voter: varchar('voter', { length: 191 }).notNull(),
})

export const commentDislikeRelations = relations(
  commentDislikes,
  ({ one }) => ({
    post: one(comments, {
      fields: [commentDislikes.commentId],
      references: [comments.id],
    }),
    user: one(users, {
      fields: [commentDislikes.voter],
      references: [users.username],
    }),
  }),
)
