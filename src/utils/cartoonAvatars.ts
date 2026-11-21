// Cartoon & Chibi Avatar Library + Image Compression Utilities

const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

const PANDA_AVATAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg-panda" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE8D6"/>
      <stop offset="100%" stop-color="#FFD1BA"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg-panda)"/>
  <circle cx="44" cy="46" r="18" fill="#232529"/>
  <circle cx="116" cy="46" r="18" fill="#232529"/>
  <circle cx="44" cy="46" r="8" fill="#3F424A"/>
  <circle cx="116" cy="46" r="8" fill="#3F424A"/>
  <ellipse cx="80" cy="86" rx="48" ry="44" fill="#FFFFFF" stroke="#232529" stroke-width="3.5"/>
  <ellipse cx="59" cy="82" rx="14" ry="16" transform="rotate(-14 59 82)" fill="#232529"/>
  <ellipse cx="101" cy="82" rx="14" ry="16" transform="rotate(14 101 82)" fill="#232529"/>
  <circle cx="61" cy="79" r="5" fill="#FFFFFF"/>
  <circle cx="99" cy="79" r="5" fill="#FFFFFF"/>
  <circle cx="63" cy="77" r="2" fill="#232529"/>
  <circle cx="101" cy="77" r="2" fill="#232529"/>
  <ellipse cx="47" cy="98" rx="8" ry="4.5" fill="#FF9AA2" opacity="0.75"/>
  <ellipse cx="113" cy="98" rx="8" ry="4.5" fill="#FF9AA2" opacity="0.75"/>
  <ellipse cx="80" cy="93" rx="6.5" ry="4.5" fill="#232529"/>
  <path d="M71 101 Q80 110 89 101" fill="none" stroke="#232529" stroke-width="3" stroke-linecap="round"/>
  <path d="M44 126 Q80 140 116 126 L122 152 Q80 162 38 152 Z" fill="#C85A43"/>
  <rect x="64" y="132" width="32" height="10" rx="5" fill="#F59E0B"/>
</svg>
`);

const LUCKY_CAT_AVATAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg-cat" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF2CC"/>
      <stop offset="100%" stop-color="#FDE0A6"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg-cat)"/>
  <polygon points="36,70 46,28 74,50" fill="#FFFFFF" stroke="#232529" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="44,62 50,38 66,52" fill="#F78C8C"/>
  <polygon points="124,70 114,28 86,50" fill="#FFFFFF" stroke="#232529" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="116,62 110,38 94,52" fill="#F78C8C"/>
  <ellipse cx="80" cy="88" rx="48" ry="43" fill="#FFFFFF" stroke="#232529" stroke-width="3.5"/>
  <path d="M52 82 Q60 72 68 82" fill="none" stroke="#232529" stroke-width="4" stroke-linecap="round"/>
  <path d="M92 82 Q100 72 108 82" fill="none" stroke="#232529" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="48" cy="96" rx="8" ry="5" fill="#FFA5AB" opacity="0.8"/>
  <ellipse cx="112" cy="96" rx="8" ry="5" fill="#FFA5AB" opacity="0.8"/>
  <polygon points="75,92 85,92 80,98" fill="#E86A58"/>
  <path d="M70 103 Q75 109 80 103 Q85 109 90 103" fill="none" stroke="#232529" stroke-width="3" stroke-linecap="round"/>
  <line x1="28" y1="90" x2="44" y2="92" stroke="#232529" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="28" y1="99" x2="44" y2="98" stroke="#232529" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="132" y1="90" x2="116" y2="92" stroke="#232529" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="132" y1="99" x2="116" y2="98" stroke="#232529" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M46 126 Q80 138 114 126" fill="none" stroke="#C85A43" stroke-width="10" stroke-linecap="round"/>
  <circle cx="80" cy="134" r="10" fill="#FBBF24" stroke="#232529" stroke-width="2.5"/>
  <circle cx="80" cy="136" r="2.5" fill="#232529"/>
</svg>
`);

const FOX_AVATAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg-fox" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#DCFCE7"/>
      <stop offset="100%" stop-color="#BBF7D0"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg-fox)"/>
  <polygon points="34,74 44,26 76,52" fill="#EA7B3C" stroke="#232529" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="44,64 49,38 66,54" fill="#FFF7ED"/>
  <polygon points="126,74 116,26 84,52" fill="#EA7B3C" stroke="#232529" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="116,64 111,38 94,54" fill="#FFF7ED"/>
  <ellipse cx="80" cy="90" rx="48" ry="42" fill="#EA7B3C" stroke="#232529" stroke-width="3.5"/>
  <path d="M36 96 Q58 84 80 108 Q102 84 124 96 Q116 130 80 132 Q44 130 36 96 Z" fill="#FFF7ED"/>
  <circle cx="60" cy="84" r="6.5" fill="#232529"/>
  <circle cx="100" cy="84" r="6.5" fill="#232529"/>
  <circle cx="62" cy="82" r="2.3" fill="#FFFFFF"/>
  <circle cx="102" cy="82" r="2.3" fill="#FFFFFF"/>
  <ellipse cx="48" cy="98" rx="7" ry="4" fill="#FDA4AF" opacity="0.75"/>
  <ellipse cx="112" cy="98" rx="7" ry="4" fill="#FDA4AF" opacity="0.75"/>
  <ellipse cx="80" cy="97" rx="6" ry="4.5" fill="#232529"/>
  <path d="M72 106 Q80 113 88 106" fill="none" stroke="#232529" stroke-width="3" stroke-linecap="round"/>
</svg>
`);

const BUNNY_AVATAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg-bunny" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCE7F3"/>
      <stop offset="100%" stop-color="#FBCFE8"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg-bunny)"/>
  <ellipse cx="58" cy="40" rx="13" ry="30" transform="rotate(-10 58 40)" fill="#FFFFFF" stroke="#232529" stroke-width="3.5"/>
  <ellipse cx="58" cy="42" rx="6.5" ry="20" transform="rotate(-10 58 42)" fill="#F9A8D4"/>
  <ellipse cx="102" cy="40" rx="13" ry="30" transform="rotate(10 102 40)" fill="#FFFFFF" stroke="#232529" stroke-width="3.5"/>
  <ellipse cx="102" cy="42" rx="6.5" ry="20" transform="rotate(10 102 42)" fill="#F9A8D4"/>
  <ellipse cx="80" cy="96" rx="46" ry="40" fill="#FFFFFF" stroke="#232529" stroke-width="3.5"/>
  <circle cx="61" cy="92" r="6" fill="#232529"/>
  <circle cx="99" cy="92" r="6" fill="#232529"/>
  <circle cx="63" cy="90" r="2.2" fill="#FFFFFF"/>
  <circle cx="101" cy="90" r="2.2" fill="#FFFFFF"/>
  <ellipse cx="48" cy="103" rx="8" ry="4.5" fill="#F472B6" opacity="0.6"/>
  <ellipse cx="112" cy="103" rx="8" ry="4.5" fill="#F472B6" opacity="0.6"/>
  <ellipse cx="80" cy="101" rx="5" ry="3.5" fill="#F472B6"/>
  <path d="M72 108 Q80 115 88 108" fill="none" stroke="#232529" stroke-width="3" stroke-linecap="round"/>
</svg>
`);

const CHIBI_BOY_AVATAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg-boy" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#DBEAFE"/>
      <stop offset="100%" stop-color="#BFDBFE"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg-boy)"/>
  <path d="M40 152 Q46 122 80 122 Q114 122 120 152 Z" fill="#C85A43"/>
  <path d="M68 122 L80 138 L92 122 Z" fill="#FFFFFF"/>
  <circle cx="80" cy="80" r="42" fill="#FFE0C2" stroke="#232529" stroke-width="3.5"/>
  <path d="M36 74 Q38 30 82 30 Q122 30 124 74 Q112 56 96 58 Q84 44 68 58 Q50 54 36 74 Z" fill="#27272A" stroke="#232529" stroke-width="3"/>
  <circle cx="62" cy="84" r="11" fill="none" stroke="#232529" stroke-width="3"/>
  <circle cx="98" cy="84" r="11" fill="none" stroke="#232529" stroke-width="3"/>
  <line x1="73" y1="84" x2="87" y2="84" stroke="#232529" stroke-width="3"/>
  <circle cx="62" cy="84" r="4.5" fill="#232529"/>
  <circle cx="98" cy="84" r="4.5" fill="#232529"/>
  <circle cx="64" cy="82" r="1.6" fill="#FFFFFF"/>
  <circle cx="100" cy="82" r="1.6" fill="#FFFFFF"/>
  <ellipse cx="49" cy="96" rx="6.5" ry="3.5" fill="#FCA5A5" opacity="0.75"/>
  <ellipse cx="111" cy="96" rx="6.5" ry="3.5" fill="#FCA5A5" opacity="0.75"/>
  <path d="M70 102 Q80 112 90 102" fill="none" stroke="#232529" stroke-width="3.2" stroke-linecap="round"/>
</svg>
`);

const CHIBI_GIRL_AVATAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg-girl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FEF3C7"/>
      <stop offset="100%" stop-color="#FDE68A"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg-girl)"/>
  <circle cx="38" cy="64" r="16" fill="#2D2322" stroke="#232529" stroke-width="3"/>
  <circle cx="122" cy="64" r="16" fill="#2D2322" stroke="#232529" stroke-width="3"/>
  <circle cx="48" cy="52" r="7" fill="#C85A43"/>
  <circle cx="112" cy="52" r="7" fill="#C85A43"/>
  <path d="M40 154 Q46 122 80 122 Q114 122 120 154 Z" fill="#E0664F"/>
  <circle cx="80" cy="82" r="41" fill="#FFE4CC" stroke="#232529" stroke-width="3.5"/>
  <path d="M38 76 Q42 32 80 32 Q118 32 122 76 Q106 58 80 60 Q54 58 38 76 Z" fill="#2D2322" stroke="#232529" stroke-width="3"/>
  <circle cx="62" cy="86" r="5.5" fill="#232529"/>
  <circle cx="98" cy="86" r="5.5" fill="#232529"/>
  <circle cx="64" cy="84" r="2" fill="#FFFFFF"/>
  <circle cx="100" cy="84" r="2" fill="#FFFFFF"/>
  <ellipse cx="48" cy="96" rx="7" ry="4" fill="#FB7185" opacity="0.65"/>
  <ellipse cx="112" cy="96" rx="7" ry="4" fill="#FB7185" opacity="0.65"/>
  <path d="M71 102 Q80 111 89 102" fill="none" stroke="#232529" stroke-width="3" stroke-linecap="round"/>
</svg>
`);

export interface CartoonAvatarPreset {
  id: string;
  label: string;
  url: string;
}

export const DEFAULT_CARTOON_AVATAR = '/assets/aistudio/icon2_d1d361e7.png';

export const CARTOON_AVATAR_PRESETS: CartoonAvatarPreset[] = [
  {
    id: 'chibi-hsk',
    label: 'Chibi HSK',
    url: '/assets/aistudio/icon2_d1d361e7.png',
  },
  {
    id: 'chibi-boya',
    label: 'Chibi Boya',
    url: '/assets/aistudio/icon4_80b113ba.png',
  },
  {
    id: 'panda',
    label: 'Gấu Trúc',
    url: PANDA_AVATAR,
  },
  {
    id: 'lucky-cat',
    label: 'Mèo Thần Tài',
    url: LUCKY_CAT_AVATAR,
  },
  {
    id: 'fox',
    label: 'Cáo Nhỏ',
    url: FOX_AVATAR,
  },
  {
    id: 'bunny',
    label: 'Thỏ Ngọc',
    url: BUNNY_AVATAR,
  },
  {
    id: 'chibi-boy',
    label: 'Nam Sinh',
    url: CHIBI_BOY_AVATAR,
  },
  {
    id: 'chibi-girl',
    label: 'Nữ Sinh',
    url: CHIBI_GIRL_AVATAR,
  },
];

export function isLegacyStockPhotoAvatar(url?: string): boolean {
  if (!url) return true;
  return url.includes('images.unsplash.com/photo-');
}

export function resolveCartoonAvatar(url?: string, seed?: string): string {
  if (url && !isLegacyStockPhotoAvatar(url)) {
    return url;
  }
  if (!seed) return DEFAULT_CARTOON_AVATAR;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CARTOON_AVATAR_PRESETS[hash % CARTOON_AVATAR_PRESETS.length].url;
}

export function compressImageToDataUrl(
  file: File,
  maxSize = 320,
  preserveTransparency = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) {
        reject(new Error('Dữ liệu hình ảnh không hợp lệ'));
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const outputType = preserveTransparency ? 'image/png' : 'image/jpeg';
        const dataUrl = preserveTransparency
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL(outputType, 0.86);
        resolve(dataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
