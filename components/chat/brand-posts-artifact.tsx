import * as React from "react"
import { format } from "date-fns"
import { ExternalLink, Instagram, Facebook, Linkedin, Twitter, Youtube, Video, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface BrandPost {
  id: string
  brandId: string
  type: string
  text: string
  translation?: string
  description?: string
  images: any[]
  videos: any[]
  status: string
  publishTime: number
  [key: string]: any
}

interface BrandPostsArtifactProps {
  data: BrandPost[] | { brand_posts?: BrandPost[]; data?: BrandPost[]; [key: string]: any }
}

export function BrandPostsArtifact({ data }: BrandPostsArtifactProps) {
  // Handle different data structures
  let posts: BrandPost[] = []
  
  if (Array.isArray(data)) {
    // Check if array elements are brand posts themselves (have brandId or publishId)
    if (data.length > 0 && (data[0]?.brandId || data[0]?.publishId)) {
      posts = data
    } else {
      // Array might contain objects with brand_posts property
      // Look for brand_posts in any element
      for (const item of data) {
        if (item && typeof item === 'object') {
          if (Array.isArray(item.brand_posts)) {
            posts = item.brand_posts
            break
          } else if (Array.isArray(item.data)) {
            posts = item.data
            break
          }
        }
      }
    }
  } else if (data && typeof data === 'object') {
    // Handle nested brand_posts
    if (Array.isArray(data.brand_posts)) {
      posts = data.brand_posts
    } else if (data.data && Array.isArray(data.data)) {
      // Handle nested data property
      posts = data.data
    } else {
      // Try to find any array property that might contain posts
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]))
      if (arrayKeys.length > 0) {
        posts = data[arrayKeys[0]]
      }
    }
  } else if (typeof data === 'string') {
    // Try to parse string data
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        // Check if parsed array elements are brand posts
        if (parsed.length > 0 && (parsed[0]?.brandId || parsed[0]?.publishId)) {
          posts = parsed
        } else {
          // Look for brand_posts in array elements
          for (const item of parsed) {
            if (item && typeof item === 'object' && Array.isArray(item.brand_posts)) {
              posts = item.brand_posts
              break
            }
          }
        }
      } else if (parsed.brand_posts && Array.isArray(parsed.brand_posts)) {
        posts = parsed.brand_posts
      }
    } catch (e) {
      console.error("Failed to parse brand posts data:", e)
    }
  }

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        <p>No posts found.</p>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post, idx) => (
        <BrandPostCard key={post.id || `post-${idx}`} post={post} />
      ))}
    </div>
  )
}

function BrandPostCard({ post }: { post: BrandPost }) {
  // Handle empty strings as falsy
  const title = (post.translation && post.translation.trim()) || 
                (post.text && post.text.trim()) || 
                (post.title && post.title.trim()) ||
                "Untitled Post"
  const content = (post.description && post.description.trim()) || 
                  (post.text && post.text.trim()) || 
                  (post.body && post.body.trim()) ||
                  null
  const date = post.publishTime ? new Date(post.publishTime) : null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformIcon type={post.type} />
          <span className="text-sm font-medium text-gray-700 capitalize">{post.type}</span>
          {post.status && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              post.status === "published" ? "bg-green-50 text-green-700 border-green-200" :
              post.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
              "bg-gray-100 text-gray-600 border-gray-200"
            )}>
              {post.status}
            </span>
          )}
        </div>
        {date && (
          <span className="text-xs text-gray-500">
            {format(date, "MMM d, yyyy h:mm a")}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          {content && (
            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>

        {/* Media */}
        {(post.images?.length > 0 || post.videos?.length > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {post.videos?.map((video: any, idx: number) => (
              <div key={`video-${idx}`} className="relative aspect-square bg-black rounded-lg overflow-hidden group">
                {video.image?.sizes?.m ? (
                  <img 
                    src={video.image.sizes.m} 
                    alt="Video thumbnail" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Video className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent ml-1" />
                  </div>
                </div>
                {video.urlOri && (
                  <a 
                    href={video.urlOri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    title="Watch video"
                  />
                )}
              </div>
            ))}
            
            {post.images?.map((image: any, idx: number) => {
              const url = typeof image === 'string' ? image : (image.url || image.sizes?.m || image.sizes?.o);
              if (!url) return null;
              
              return (
                <div key={`image-${idx}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={url} 
                    alt="Post image" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PlatformIcon({ type }: { type: string }) {
  if (!type) return <span className="text-gray-400 text-xs border border-gray-400 rounded px-1">SOC</span>
  
  switch (type?.toLowerCase()) {
    case 'xhs':
    case 'xiaohongshu':
      return <span className="text-red-500 font-bold text-xs border border-red-500 rounded px-1">RED</span>
    case 'instagram':
    case 'ig':
      return <Instagram className="h-4 w-4 text-pink-600" />
    case 'facebook':
    case 'fb':
      return <Facebook className="h-4 w-4 text-blue-600" />
    case 'linkedin':
      return <Linkedin className="h-4 w-4 text-blue-700" />
    case 'twitter':
    case 'x':
      return <Twitter className="h-4 w-4 text-black" />
    case 'youtube':
    case 'yt':
      return <Youtube className="h-4 w-4 text-red-600" />
    case 'douyin':
      return <span className="text-black font-bold text-xs border border-black rounded px-1">DY</span>
    case 'wechat':
      return <span className="text-green-600 font-bold text-xs border border-green-600 rounded px-1">WC</span>
    default:
      return <span className="text-gray-400 text-xs border border-gray-400 rounded px-1">SOC</span>
  }
}
