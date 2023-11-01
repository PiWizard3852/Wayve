import { component$, useSignal } from '@builder.io/qwik'

export default component$(() => {
  const activePage = useSignal<1 | 2>(1)
  const firstName = useSignal('')
  const lastName = useSignal('')
  const email = useSignal('')
  const password = useSignal('')
  const passwordConf = useSignal('')
  const username = useSignal('')

  return (
    <form class='flex h-min min-h-[calc(100vh-130px)] w-full flex-col items-center rounded-[8px] border border-border bg-white px-[20px] py-[40px]'>
      <h1 class='mb-[20px] text-[23px]'>Sign Up</h1>
      {activePage.value === 1 ? (
        <>
          <div class='mb-[20px] flex w-[calc(60%+20px)] min-w-[270px] max-w-[370px]'>
            <input
              type='text'
              placeholder='First Name'
              bind:value={firstName}
              class='mr-[5px] w-[50%] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
            />
            <input
              type='text'
              placeholder='Last Name'
              bind:value={lastName}
              class='ml-[5px] w-[50%] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
            />
          </div>
          <input
            type='text'
            placeholder='Email'
            bind:value={email}
            class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <input
            type='password'
            placeholder='Password'
            bind:value={password}
            class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <input
            type='password'
            placeholder='Confirm Password'
            bind:value={passwordConf}
            class='mb-[20px] w-[60%] min-w-[250px] max-w-[350px] rounded-[5px] bg-primary p-[10px] placeholder-gray outline-none'
          />
          <button
            preventdefault:click
            class='cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
            onClick$={() => {
              activePage.value = 2
            }}
          >
            Sign Up
          </button>
        </>
      ) : (
        <div class='mb-[20px] flex w-[calc(60%+20px)] min-w-[270px] max-w-[370px] justify-center'>
          <div class='mb-[20px] flex w-full items-center rounded-[5px] bg-primary p-[10px]'>
            <div class='mr-[2px]'>@</div>
            <input
              type='text'
              placeholder='Username'
              bind:value={username}
              class='w-full placeholder-gray outline-none'
            />
          </div>
          <button
            preventdefault:click
            class='ml-[10px] h-min cursor-pointer rounded-[5px] bg-primary p-[10px] duration-200 hover:text-branding'
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
                d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9'
              />
            </svg>
          </button>
        </div>
      )}
    </form>
  )
})
