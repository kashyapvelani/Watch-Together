/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig,
{
  reactStrictMode:false,
  images: {
    domains:['image.tmdb.org'],
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'image.tmdb.org',
            port: '',
            pathname: '/t/p/original/**',
        },
    ],
},
  }
  
