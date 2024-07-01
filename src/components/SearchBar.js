"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from 'use-debounce';

function SearchBar() {

    const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchQuery] = useDebounce(query,500   )

  useEffect(()=>{
    if(!searchQuery){
        router.push('/search')
    }
    else{
        router.push(`/search?query=${searchQuery}`)
    }
  },[searchQuery, router])
  

  return (
    <div>
      <form >
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="search"
            id="default-search"
            className="block w-full p-4 ps-10 text-sm rounded-lg bg-[#121212] focus:bg-[#252525] border-gray-600 placeholder-gray-400 text-white focus:border-blue-500"
            placeholder="Search Movies"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
          <button
            type="submit"
            className="text-white absolute end-2.5 bottom-2.5 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-4 py-2 bg-[#4977FF] hover:bg-blue-700 focus:ring-blue-800"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
