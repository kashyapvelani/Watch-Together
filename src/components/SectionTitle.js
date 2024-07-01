import React from 'react'

function SectionTitle({title}) {
  return (
    <div className='py-2'>
        <h1 className="font-bold text-xl">
          <span className="text-[#4977FF]">{title}</span> Movies
        </h1>
      </div>
  )
}

export default SectionTitle