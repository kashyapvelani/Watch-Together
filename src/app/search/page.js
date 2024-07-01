'use client'

import SearchBar from '@/components/SearchBar'
import { useSearchParams } from 'next/navigation';
import React from 'react'

import SearchResult from '@/components/SearchResult';



function search() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  
  return (
    <main className="p-4 pl-20">
    <SearchBar/>
    <SearchResult query={query}/>

    </main>
  )
}

export default search