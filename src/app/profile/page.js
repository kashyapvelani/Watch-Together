import { UserProfile } from '@clerk/nextjs'
import React from 'react'

function profile() {
  return (
    <main className="p-4 pl-20 ">
      <div className='mx-44 px-20'>
          <UserProfile />
      </div>
    </main>
  )
}

export default profile