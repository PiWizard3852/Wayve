import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'

export default component$(() => {
  const textareaRef = useSignal<Element>()
  const title = useSignal('')
  const postContent = useSignal('')

  useVisibleTask$(() => {
    textareaRef.value.addEventListener('input', (e) => {
      e.target.style.height = 'auto'
      e.target.style.height = e.target.scrollHeight - 20 + 'px'
    })
  })

  return (
    <form class='mb-[20px] flex w-full flex-col rounded-[8px] border border-border bg-white p-[20px]'>
      <div class='mb-[10px] flex w-full'>
        <input
          type='text'
          placeholder='Title your post'
          bind:value={title}
          class='w-full rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
        />
        <button
          preventdefault:click
          class='ml-[10px] cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            stroke-width='1.5'
            stroke='currentColor'
            class='h-6 w-6'
          >
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
            />
          </svg>
        </button>
      </div>
      <textarea
        ref={textareaRef}
        bind:value={postContent}
        rows={10}
        placeholder='What&#8217;s on your mind?'
        class='whitespace-normal rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
      />
    </form>
  )
})
