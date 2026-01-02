export const PLATFORMS = {
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    nameEn: 'Xiaohongshu',
    color: '#FF2442',
    icon: '📕',
  },
  douyin: {
    id: 'douyin',
    name: '抖音',
    nameEn: 'Douyin',
    color: '#000000',
    icon: '🎵',
  },
  weibo: {
    id: 'weibo',
    name: '微博',
    nameEn: 'Weibo',
    color: '#E6162D',
    icon: '🐦',
  },
  wechat: {
    id: 'wechat',
    name: '微信',
    nameEn: 'WeChat',
    color: '#07C160',
    icon: '💬',
  },
} as const

export type PlatformId = keyof typeof PLATFORMS
