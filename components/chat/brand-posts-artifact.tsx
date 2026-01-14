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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  
  const hasMedia = (post.images?.length > 0 || post.videos?.length > 0)
  const firstImage = post.images?.[0]
  const firstVideo = post.videos?.[0]
  const imageUrl = firstImage 
    ? (typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.sizes?.m || firstImage.sizes?.o))
    : null
  const videoThumbnail = firstVideo?.image?.sizes?.m

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      {/* Image/Video Section - 小红书 style: image first */}
      {hasMedia && (
        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
          {firstVideo ? (
            <>
              {videoThumbnail ? (
                <img 
                  src={videoThumbnail} 
                  alt="Video thumbnail" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {/* Video play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-red-500 border-b-[8px] border-b-transparent ml-1" />
                </div>
              </div>
              {firstVideo.urlOri && (
                <a 
                  href={firstVideo.urlOri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-10"
                  title="Watch video"
                />
              )}
            </>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : null}
          
          {/* Platform badge - top right corner */}
          <div className="absolute top-3 right-3 z-20">
            <PlatformIcon type={post.type} />
          </div>
          
          {/* Status badge - top left corner */}
          {post.status && (
            <div className="absolute top-3 left-3 z-20">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm",
                post.status === "published" ? "bg-green-500/90 text-white" :
                post.status === "scheduled" ? "bg-blue-500/90 text-white" :
                "bg-gray-500/90 text-white"
              )}>
                {post.status}
              </span>
            </div>
          )}
          
          {/* Multiple images indicator */}
          {post.images?.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {post.images.length} photos
            </div>
          )}
        </div>
      )}

      {/* Content Section - 小红书 style: text below image */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
          {title}
        </h3>
        
        {/* Description/Content */}
        {content && content !== title && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {content}
          </p>
        )}
        
        {/* Additional images grid (if multiple images and no video) */}
        {!firstVideo && post.images?.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {post.images.slice(1, 4).map((image: any, idx: number) => {
              const url = typeof image === 'string' ? image : (image.url || image.sizes?.m || image.sizes?.o);
              if (!url) return null;
              return (
                <div key={`image-${idx + 1}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Post image ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            })}
            {post.images.length > 4 && (
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">+{post.images.length - 4}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Footer with date */}
        {date && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {format(date, "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function PlatformIcon({ type }: { type: string }) {
  if (!type) return (
    <span className="bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-lg backdrop-blur-sm">
      SOC
    </span>
  )
  
  switch (type?.toLowerCase()) {
    case 'xhs':
    case 'xiaohongshu':
      return (
        <span className="bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow-lg">
          RED
        </span>
      )
    case 'instagram':
    case 'ig':
      return (
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-1.5 rounded-lg backdrop-blur-sm shadow-lg">
          <Instagram className="h-3.5 w-3.5 text-white" />
        </div>
      )
    case 'facebook':
    case 'fb':
      return (
        <div className="bg-blue-600/90 p-1.5 rounded-lg backdrop-blur-sm shadow-lg">
          <Facebook className="h-3.5 w-3.5 text-white" />
        </div>
      )
    case 'linkedin':
      return (
        <div className="bg-blue-700/90 p-1.5 rounded-lg backdrop-blur-sm shadow-lg">
          <Linkedin className="h-3.5 w-3.5 text-white" />
        </div>
      )
    case 'twitter':
    case 'x':
      return (
        <div className="bg-black/80 p-1.5 rounded-lg backdrop-blur-sm shadow-lg">
          <Twitter className="h-3.5 w-3.5 text-white" />
        </div>
      )
    case 'youtube':
    case 'yt':
      return (
        <div className="bg-red-600/90 p-1.5 rounded-lg backdrop-blur-sm shadow-lg">
          <Youtube className="h-3.5 w-3.5 text-white" />
        </div>
      )
    case 'douyin':
      return (
        <span className="bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow-lg">
          DY
        </span>
      )
    case 'wechat':
      return (
        <span className="bg-green-600/90 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow-lg">
          WC
        </span>
      )
    default:
      return (
        <span className="bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-lg backdrop-blur-sm">
          SOC
        </span>
      )
  }
}
