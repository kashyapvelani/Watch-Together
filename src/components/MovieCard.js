import React from 'react';

function MovieCard({img}) {
  return (
    <div className='p-2 w-[185px] h-[285px]'>
        <button>
        <img src={img} height="190px" width="500px" className='rounded-lg'/>
        </button>
    </div>
  )
}

export default MovieCard


