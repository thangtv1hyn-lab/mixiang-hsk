import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Course,
  Exam,
  ExamResult,
  ForumPost,
  HSKLevel,
  Lesson,
  StudentProfile,
  VocabItem,
  AuthUser,
  AppUser,
  VocabDeck,
  UserRole,
  UserStatus,
  SiteUIConfig,
  ClassroomMomentItem,
} from '../types/hsk';
import {
  INITIAL_COURSES,
  INITIAL_EXAMS,
  INITIAL_FORUM_POSTS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_VOCABULARY,
  INITIAL_VOCAB_DECKS,
  INITIAL_APP_USERS,
} from '../data/initialData';
import { DEFAULT_CARTOON_AVATAR, resolveCartoonAvatar } from '../utils/cartoonAvatars';

interface HSKContextType {
  // Authentication & Self-Registration
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  loginWithGoogle: (customData?: Partial<AuthUser>) => Promise<{ success: boolean; message?: string }>;
  registerAccount: (data: { name: string; email: string; password: string; level: HSKLevel }) => Promise<{ success: boolean; message?: string }>;
  loginWithEmail: (data: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  resetPasswordWithEmail: (data: { email: string; newPassword: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isGoogleAuthModalOpen: boolean;
  setIsGoogleAuthModalOpen: (open: boolean) => void;
  isUserProfileOpen: boolean;
  setIsUserProfileOpen: (open: boolean) => void;
  updateCurrentUserProfile: (data: Partial<AppUser> & { currentPassword?: string; targetLevel?: HSKLevel }) => Promise<{ success: boolean; message?: string }>;

  // Navigation & Role
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLevel: HSKLevel;
  setActiveLevel: (level: HSKLevel) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  showPinyin: boolean;
  setShowPinyin: (show: boolean) => void;
  isMobileCompanionOpen: boolean;
  setIsMobileCompanionOpen: (open: boolean) => void;

  // Selected entities for deep view
  currentLesson: Lesson | null;
  setCurrentLesson: (lesson: Lesson | null) => void;
  currentExam: Exam | null;
  setCurrentExam: (exam: Exam | null) => void;
  lastExamResult: ExamResult | null;
  setLastExamResult: (result: ExamResult | null) => void;

  // Data states
  courses: Course[];
  exams: Exam[];
  vocabularies: VocabItem[];
  vocabDecks: VocabDeck[];
  activeDeckId: string | null;
  setActiveDeckId: (id: string | null) => void;
  forumPosts: ForumPost[];
  studentProfile: StudentProfile;
  appUsers: AppUser[];

  // Course & Lesson actions
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  addLesson: (courseId: string, lesson: Lesson) => void;
  updateLesson: (courseId: string, lesson: Lesson) => void;
  deleteLesson: (courseId: string, lessonId: string) => void;
  completeLesson: (lessonId: string) => void;

  // Exam actions
  addExam: (exam: Exam) => void;
  updateExam: (exam: Exam) => void;
  deleteExam: (examId: string) => void;
  submitExam: (result: ExamResult) => void;

  // Vocab & Flashcard Decks actions
  markVocabMastered: (vocabId: string) => void;
  markVocabLearning: (vocabId: string) => void;
  addCustomVocab: (vocab: VocabItem) => void;
  addVocabDeck: (deck: VocabDeck) => void;
  updateVocabDeck: (deck: VocabDeck) => void;
  deleteVocabDeck: (deckId: string) => void;
  addCardToDeck: (deckId: string, card: VocabItem) => void;
  updateCardInDeck: (deckId: string, card: VocabItem) => void;
  deleteCardFromDeck: (deckId: string, cardId: string) => void;

  // User Management & Role Assignment (Admin)
  addUserAdmin: (data: Partial<AppUser>) => Promise<{ success: boolean; message?: string }>;
  updateUserRoleAdmin: (userId: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  updateUserStatusAdmin: (userId: string, status: UserStatus) => Promise<{ success: boolean; message?: string }>;
  updateUserAdmin: (userId: string, data: Partial<AppUser>) => Promise<{ success: boolean; message?: string }>;
  deleteUserAdmin: (userId: string) => Promise<{ success: boolean; message?: string }>;

  // Forum actions
  addForumPost: (post: Omit<ForumPost, 'id' | 'createdAt' | 'likes' | 'repliesCount' | 'replies'>) => void;
  addForumReply: (postId: string, content: string, role?: 'student' | 'teacher' | 'admin' | 'ai') => void;
  likeForumPost: (postId: string) => void;
  togglePinPost: (postId: string) => void;
  toggleSolvedPost: (postId: string) => void;

  // Profile & Reminders
  updateReminderSettings: (enabled: boolean, time: string, dailyGoal: number) => void;
  recordStudyMinutes: (minutes: number) => void;
  resetAllData: () => void;

  // UI Customization (Admin / Teacher)
  siteUIConfig: SiteUIConfig;
  updateSiteUIConfig: (partial: Partial<SiteUIConfig>) => void;
  resetSiteUIConfig: () => void;
}

const HSKContext = createContext<HSKContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'mixiang_hsk_';

export const DEFAULT_CLASSROOM_MOMENTS: ClassroomMomentItem[] = [
  {
    id: 'moment-1',
    title: 'Lễ bế giảng khóa HSK 3 K18',
    subtitle: '100% học viên lớp vượt qua kỳ thi với số điểm trên 240/300',
    detail:
      'Buổi tổng kết và trao chứng nhận hoàn thành khóa HSK 3 K18. Cả lớp cùng ôn lại hành trình 30 buổi học chữ Hán, luyện nghe phản xạ và chia sẻ bí quyết đạt điểm tuyệt đối phần đọc hiểu.',
    date: 'Tháng 10/2026',
    location: 'Cơ sở Hà Nội & Zoom Online',
    image:
      '/assets/aistudio/1794493556654_2645543663410262361_g4922351168579610784_e99743bc4875704f02020ec30504d074_7a96f4ba.jpg',
  },
  {
    id: 'moment-2',
    title: 'Workshop Thư pháp & Văn hóa Trung Hoa',
    subtitle: 'Trải nghiệm viết câu đối chữ Hán và thưởng thức trà Long Tỉnh',
    detail:
      'Hoạt động ngoại khóa cuối tuần giúp học viên trực tiếp cầm bút lông luyện quy tắc bút thuận trên giấy tuyên chỉ, tìm hiểu chiết tự chữ Hán và văn hóa thưởng trà truyền thống.',
    date: 'Tháng 09/2026',
    location: 'Không gian Văn hóa MiXiangg',
    image: '/assets/aistudio/image_f2d52981.png',
  },
  {
    id: 'moment-3',
    title: 'Giao lưu cùng du học sinh Thượng Hải',
    subtitle: 'Chia sẻ kinh nghiệm săn học bổng CSC toàn phần',
    detail:
      'Buổi tọa đàm trực tiếp cùng các cựu học viên MiXiangg đang theo học Thạc sĩ tại Đại học Phúc Đán và Đại học Giao thông Thượng Hải, giải đáp hồ sơ xin học bổng Chính phủ Trung Quốc.',
    date: 'Tháng 08/2026',
    location: 'Hội trường MiXiangg HSK',
    image:
      '/assets/aistudio/1794493556657_2645543663410262361_g4922351168579610784_dce6dc1e88bf0bec69888aec30c627a0_f9b8c805.jpg',
  },
  {
    id: 'moment-4',
    title: 'Giờ học thực hành giao tiếp gọi món',
    subtitle: 'Mô phỏng tình huống gọi món Dimsum và thanh toán thực tế',
    detail:
      'Lớp học nhập vai thực hành hội thoại nhà hàng: đặt bàn, hỏi món đặc sản, yêu cầu khẩu vị và thanh toán bằng tiếng Trung tự nhiên không cần nhìn sách.',
    date: 'Hàng tuần',
    location: 'Lớp Thực chiến Giao tiếp HSK 1-2',
    image: '/assets/aistudio/mh_c19ddbdc.jpg',
  },
];

export const DEFAULT_SITE_UI_CONFIG: SiteUIConfig = {
  primaryColor: '#C85A43',
  canvasColor: '#F7F4EC',
  fontScale: '14px',

  headerLogoUrl: '',
  brandName: 'MiXiangg',
  brandHighlight: 'HSK',
  brandSubtitle: '米香中文 • Học Chuẩn & Nhớ Lâu',

  heroBadge: '米香中文 • Lớp học Tiếng Trung Dành Cho Người Bắt Đầu',
  heroTitleLine1: 'Học Tiếng Trung',
  heroTitleHighlight: 'Tự Nhiên & Chuẩn Nét',
  heroTitleLine3: 'Từ Con Số 0',
  heroDescription:
    'Phương pháp giảng dạy trực quan, thực chiến dành riêng cho người mới bắt đầu. Tự tin giao tiếp và đạt HSK điểm cao trong 3 tháng.',
  heroCtaPrimary: 'Khám Phá Các Khóa Học',
  heroCtaSecondary: 'Học Thử Flashcard 3D',
  stat1Value: '45,000+',
  stat1Label: 'Học viên theo học',
  stat2Value: '98.6%',
  stat2Label: 'Tỷ lệ đỗ HSK 1 - 4',
  stat3Value: 'Top 1',
  stat3Label: 'Khóa học cho người mới',

  posterSectionBadge: 'ĐỘI NGŨ TÂM HUYẾT',
  posterSectionTitle: 'Đồng Hành Cùng Giảng Viên MiXiangg',
  posterSectionSubtitle:
    'Tuyển sinh các lớp Tiếng Trung Boya & Luyện thi HSK 1–5 (Online & Offline) cùng đội ngũ giảng viên giàu kinh nghiệm.',
  poster1Url:
    '/assets/aistudio/1794493556654_2645543663410262361_g4922351168579610784_e99743bc4875704f02020ec30504d074_7a96f4ba.jpg',
  poster1Caption: 'Tuyển sinh Lớp Tiếng Trung Boya Sơ Cấp 1 — Giảng viên Nguyễn Thị Minh Hương',
  poster2Url:
    '/assets/aistudio/1794493556657_2645543663410262361_g4922351168579610784_dce6dc1e88bf0bec69888aec30c627a0_f9b8c805.jpg',
  poster2Caption: 'Thông báo Tuyển sinh Khóa Học Tiếng Trung Online & Offline — MiXiangg HSK',
  admissionBadge: 'THÔNG BÁO TUYỂN SINH KHÓA MỚI',
  admissionTitle: 'Lớp Học Tiếng Trung Cơ Bản MiXiangg K24',
  admissionDescription:
    'Lịch học linh hoạt ca tối và cuối tuần. Tặng giáo trình bản cứng chuẩn HSK 3.0 và tài khoản học Flashcard không giới hạn.',
  admissionCta: 'Đăng Ký Tư Vấn Ngay',

  momentsSectionBadge: 'KỶ NIỆM ĐÁNG NHỚ',
  momentsSectionTitle: 'Khoảnh Khắc Cùng Lớp Học',
  momentsSectionSubtitle:
    'Học tập không chỉ là thi cử, mà là hành trình kết nối văn hóa và bạn bè.',
  classroomMoments: DEFAULT_CLASSROOM_MOMENTS,

  showCoursesSection: true,
  showPostersSection: true,
  showAdmissionBanner: true,
  showMomentsSection: true,

  footerLogoUrl: '/assets/aistudio/banner_d01a30da.jpg',
  footerTitle: 'Tuyển sinh lớp Tiếng Trung Sơ cấp – HSK 1–6 (Online / Offline)',
  footerSubtitle: 'Giáo trình Boya · Tối đa 08 học viên/lớp',
  hotline: '0378.105.999',
  footerCtaText: 'Xem Lộ trình Khóa học',
  facebook: 'fb.com/nguyenminhhuong.min',
  copyrightText: '© 2026 MiXiangg HSK',
  motto: '学而时习之',
};

const AVATAR_CACHE_KEY = 'mixiang_hsk_saved_avatars_v1';

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private browsing errors so state & backend save still succeed
  }
};

const getCachedAvatar = (email?: string): string | null => {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    const key = email.trim().toLowerCase();
    return typeof map[key] === 'string' && map[key].trim() ? map[key] : null;
  } catch {
    return null;
  }
};

const saveCachedAvatar = (email?: string, avatar?: string): void => {
  if (!email || !avatar) return;
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[email.trim().toLowerCase()] = avatar;
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
};

const resolvePersistentAvatar = (serverAvatar?: string, email?: string): string => {
  const cached = getCachedAvatar(email);
  const normalizedServer =
    serverAvatar && !serverAvatar.includes('images.unsplash.com/photo-')
      ? serverAvatar.trim()
      : '';

  // If server has a custom non-default avatar, prefer it (and sync cache)
  if (normalizedServer && normalizedServer !== DEFAULT_CARTOON_AVATAR) {
    saveCachedAvatar(email, normalizedServer);
    return normalizedServer;
  }

  // Otherwise, if this user saved a preferred avatar in cache (survives logout/server restarts), restore it
  if (cached) {
    return cached;
  }

  return resolveCartoonAvatar(normalizedServer || undefined, email);
};

export const HSKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Role
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeLevel, setActiveLevel] = useState<HSKLevel>('HSK 1');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'user');
      if (!saved) return null;
      const parsed: AuthUser = JSON.parse(saved);
      return {
        ...parsed,
        avatar: resolvePersistentAvatar(parsed.avatar, parsed.email),
      };
    } catch {
      return null;
    }
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role) return u.role;
      }
      return 'student';
    } catch {
      return 'student';
    }
  });
  const [showPinyin, setShowPinyinState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'show_pinyin');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const setShowPinyin = (show: boolean) => {
    setShowPinyinState(show);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'show_pinyin', String(show));
    } catch {
      // ignore storage errors
    }
  };
  const [isMobileCompanionOpen, setIsMobileCompanionOpen] = useState<boolean>(false);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PREFIX + 'auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  // Selected entities
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [lastExamResult, setLastExamResult] = useState<ExamResult | null>(null);

  // Data states with LocalStorage persistence
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'courses');
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'exams');
      return saved ? JSON.parse(saved) : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  });

  const [vocabularies, setVocabularies] = useState<VocabItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'vocab');
      return saved ? JSON.parse(saved) : INITIAL_VOCABULARY;
    } catch {
      return INITIAL_VOCABULARY;
    }
  });

  const [vocabDecks, setVocabDecks] = useState<VocabDeck[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'decks');
      return saved ? JSON.parse(saved) : INITIAL_VOCAB_DECKS;
    } catch {
      return INITIAL_VOCAB_DECKS;
    }
  });
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'forum');
      return saved ? JSON.parse(saved) : INITIAL_FORUM_POSTS;
    } catch {
      return INITIAL_FORUM_POSTS;
    }
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'profile');
      if (!saved) return INITIAL_STUDENT_PROFILE;
      const parsed: StudentProfile = JSON.parse(saved);
      return {
        ...parsed,
        avatar: resolveCartoonAvatar(parsed.avatar, parsed.email),
      };
    } catch {
      return INITIAL_STUDENT_PROFILE;
    }
  });

  const [appUsers, setAppUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'app_users');
      return saved ? JSON.parse(saved) : INITIAL_APP_USERS;
    } catch {
      return INITIAL_APP_USERS;
    }
  });

  const [siteUIConfig, setSiteUIConfig] = useState<SiteUIConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'site_ui_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SITE_UI_CONFIG,
          ...parsed,
          classroomMoments:
            Array.isArray(parsed.classroomMoments) && parsed.classroomMoments.length > 0
              ? parsed.classroomMoments
              : DEFAULT_CLASSROOM_MOMENTS,
        };
      }
      return DEFAULT_SITE_UI_CONFIG;
    } catch {
      return DEFAULT_SITE_UI_CONFIG;
    }
  });

  const updateSiteUIConfig = (partial: Partial<SiteUIConfig>) => {
    setSiteUIConfig((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'site_ui_config_v2', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const resetSiteUIConfig = () => {
    setSiteUIConfig(DEFAULT_SITE_UI_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'site_ui_config_v2');
    } catch {
      // ignore
    }
  };

  // Apply dynamic UI theme tokens to root document
  useEffect(() => {
    const root = document.documentElement;
    if (siteUIConfig.primaryColor) {
      root.style.setProperty('--color-red-600', siteUIConfig.primaryColor);
      root.style.setProperty('--accent-red', siteUIConfig.primaryColor);
    }
    if (siteUIConfig.canvasColor) {
      root.style.setProperty('--bg-canvas', siteUIConfig.canvasColor);
    }
    if (siteUIConfig.fontScale) {
      root.style.fontSize = siteUIConfig.fontScale;
    }
  }, [siteUIConfig.primaryColor, siteUIConfig.canvasColor, siteUIConfig.fontScale]);

  // Helper to build headers including active session token and user identity
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    try {
      const token = localStorage.getItem(STORAGE_KEY_PREFIX + 'token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // ignore storage access issues
    }
    const activeEmail = currentUser?.email || studentProfile?.email;
    const activeUserId = currentUser?.id || studentProfile?.id;
    if (activeEmail) headers['x-user-email'] = activeEmail;
    if (activeUserId) headers['x-user-id'] = activeUserId;
    return headers;
  };

  // Save changes to localStorage safely (never throw QuotaExceededError)
  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'vocab', JSON.stringify(vocabularies));
  }, [vocabularies]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'decks', JSON.stringify(vocabDecks));
  }, [vocabDecks]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'forum', JSON.stringify(forumPosts));
  }, [forumPosts]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'profile', JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    safeSetItem(STORAGE_KEY_PREFIX + 'app_users', JSON.stringify(appUsers));
  }, [appUsers]);

  // Initial synchronization with Backend API
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEY_PREFIX + 'token');
        const emailParam = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : '';
        const authFetchHeaders: Record<string, string> = {};
        if (storedToken) authFetchHeaders['Authorization'] = `Bearer ${storedToken}`;

        const requests: Promise<Response>[] = [
          fetch('/api/courses'),
          fetch('/api/exams'),
          fetch('/api/vocab'),
          fetch('/api/vocab/decks'),
          fetch('/api/forum'),
          fetch('/api/admin/users'),
          fetch(`/api/reports/summary${emailParam}`, { headers: authFetchHeaders }),
        ];

        if (storedToken) {
          requests.push(fetch('/api/auth/me', { headers: authFetchHeaders }));
        }

        const [cRes, eRes, vRes, dRes, fRes, uRes, rRes, meRes] = await Promise.allSettled(requests);

        if (cRes.status === 'fulfilled' && cRes.value.ok) {
          const cData = await cRes.value.json();
          if (Array.isArray(cData) && cData.length > 0) setCourses(cData);
        }
        if (eRes.status === 'fulfilled' && eRes.value.ok) {
          const eData = await eRes.value.json();
          if (Array.isArray(eData) && eData.length > 0) setExams(eData);
        }
        if (vRes.status === 'fulfilled' && vRes.value.ok) {
          const vData = await vRes.value.json();
          if (vData.items && Array.isArray(vData.items) && vData.items.length > 0) {
            setVocabularies(vData.items);
          }
        }
        if (dRes.status === 'fulfilled' && dRes.value.ok) {
          const dData = await dRes.value.json();
          if (Array.isArray(dData) && dData.length > 0) {
            setVocabDecks(dData);
          }
        }
        if (fRes.status === 'fulfilled' && fRes.value.ok) {
          const fData = await fRes.value.json();
          if (Array.isArray(fData) && fData.length > 0) setForumPosts(fData);
        }
        if (uRes.status === 'fulfilled' && uRes.value.ok) {
          const uData = await uRes.value.json();
          if (Array.isArray(uData) && uData.length > 0) {
            setAppUsers(
              uData.map((u: AppUser) => ({
                ...u,
                avatar: resolveCartoonAvatar(u.avatar, u.email),
              }))
            );
          }
        }
        if (rRes.status === 'fulfilled' && rRes.value.ok) {
          const rData = await rRes.value.json();
          if (rData && rData.studentName) {
            setStudentProfile((prev) => ({
              ...prev,
              name: rData.studentName || prev.name,
              email: rData.email || prev.email,
              xp: typeof rData.xp === 'number' ? rData.xp : prev.xp,
              completedLessonIds: Array.isArray(rData.completedLessonIds)
                ? rData.completedLessonIds
                : prev.completedLessonIds,
              masteredVocabIds: Array.isArray(rData.masteredVocabIds)
                ? rData.masteredVocabIds
                : prev.masteredVocabIds,
              learningVocabIds: Array.isArray(rData.learningVocabIds)
                ? rData.learningVocabIds
                : prev.learningVocabIds,
              studyLog: rData.studyLog || prev.studyLog,
              examHistory: rData.examHistory || prev.examHistory,
            }));
          }
        }

        if (meRes && meRes.status === 'fulfilled') {
          if (meRes.value.ok) {
            const meData = await meRes.value.json();
            if (meData.authenticated && meData.user) {
              const resolvedAvatar = resolvePersistentAvatar(meData.user.avatar, meData.user.email);
              const normalizedUser: AuthUser = {
                ...meData.user,
                avatar: resolvedAvatar,
              };
              setIsAuthenticated(true);
              setCurrentUser(normalizedUser);
              setUserRole(normalizedUser.role || 'student');
              safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(normalizedUser));
              if (meData.profile) {
                setStudentProfile({
                  ...meData.profile,
                  avatar: resolvedAvatar,
                });
              }
            }
          } else if (meRes.value.status === 401) {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setUserRole('student');
            localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth');
            localStorage.removeItem(STORAGE_KEY_PREFIX + 'user');
            localStorage.removeItem(STORAGE_KEY_PREFIX + 'token');
          }
        }
      } catch (err) {
        console.warn('Backend initial sync notice (using cached data):', err);
      }
    };

    syncWithBackend();
  }, [currentUser?.email]);

  // Course actions
  const addCourse = async (course: Course) => {
    setCourses((prev) => [course, ...prev]);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(course),
      });
      if (res.ok) {
        const saved = await res.json();
        setCourses((prev) => prev.map((c) => (c.id === course.id ? saved : c)));
      }
    } catch (e) {
      console.error('API create course error:', e);
    }
  };

  const updateCourse = async (updatedCourse: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
    try {
      await fetch(`/api/courses/${updatedCourse.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCourse),
      });
    } catch (e) {
      console.error('API update course error:', e);
    }
  };

  const deleteCourse = async (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    try {
      await fetch(`/api/courses/${courseId}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch (e) {
      console.error('API delete course error:', e);
    }
  };

  const addLesson = async (courseId: string, lesson: Lesson) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            lessons: [...course.lessons, lesson],
          };
        }
        return course;
      })
    );
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(lesson),
      });
      if (res.ok) {
        const savedLesson = await res.json();
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  lessons: course.lessons.map((l) => (l.id === lesson.id ? savedLesson : l)),
                }
              : course
          )
        );
      }
    } catch (e) {
      console.error('API add lesson error:', e);
    }
  };

  const updateLesson = async (courseId: string, updatedLesson: Lesson) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            lessons: course.lessons.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)),
          };
        }
        return course;
      })
    );
    try {
      await fetch(`/api/courses/${courseId}/lessons/${updatedLesson.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedLesson),
      });
    } catch (e) {
      console.error('API update lesson error:', e);
    }
  };

  const deleteLesson = async (courseId: string, lessonId: string) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            lessons: course.lessons.filter((l) => l.id !== lessonId),
          };
        }
        return course;
      })
    );
    try {
      await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.error('API delete lesson error:', e);
    }
  };

  const completeLesson = async (lessonId: string) => {
    setStudentProfile((prev) => {
      if (prev.completedLessonIds.includes(lessonId)) return prev;
      return {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lessonId],
        xp: prev.xp + 50,
      };
    });
    try {
      await fetch(`/api/courses/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: currentUser?.email || studentProfile.email }),
      });
    } catch (e) {
      console.error('API complete lesson error:', e);
    }
  };

  // Exam actions
  const addExam = async (exam: Exam) => {
    setExams((prev) => [exam, ...prev]);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(exam),
      });
      if (res.ok) {
        const saved = await res.json();
        setExams((prev) => prev.map((e) => (e.id === exam.id ? saved : e)));
      }
    } catch (e) {
      console.error('API add exam error:', e);
    }
  };

  const updateExam = async (updatedExam: Exam) => {
    setExams((prev) => prev.map((e) => (e.id === updatedExam.id ? updatedExam : e)));
    try {
      await fetch(`/api/exams/${updatedExam.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedExam),
      });
    } catch (e) {
      console.error('API update exam error:', e);
    }
  };

  const deleteExam = async (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    try {
      await fetch(`/api/exams/${examId}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch (e) {
      console.error('API delete exam error:', e);
    }
  };

  const submitExam = async (result: ExamResult) => {
    setLastExamResult(result);
    setStudentProfile((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const todayMinutes = (prev.studyLog[today] || 0) + Math.max(1, Math.round(result.timeSpentSeconds / 60));

      return {
        ...prev,
        xp: prev.xp + (result.passed ? 150 : 50),
        examHistory: [result, ...prev.examHistory],
        studyLog: {
          ...prev.studyLog,
          [today]: todayMinutes,
        },
      };
    });

    try {
      await fetch(`/api/exams/${result.examId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: currentUser?.email || studentProfile.email,
          userAnswers: result.userAnswers,
          timeSpentSeconds: result.timeSpentSeconds,
        }),
      });
    } catch (e) {
      console.error('API submit exam error:', e);
    }
  };

  // Vocab actions
  const markVocabMastered = async (vocabId: string) => {
    setStudentProfile((prev) => {
      const isMastered = prev.masteredVocabIds.includes(vocabId);
      return {
        ...prev,
        masteredVocabIds: isMastered
          ? prev.masteredVocabIds
          : [...prev.masteredVocabIds, vocabId],
        learningVocabIds: prev.learningVocabIds.filter((id) => id !== vocabId),
        xp: isMastered ? prev.xp : prev.xp + 10,
      };
    });
    try {
      await fetch(`/api/vocab/${vocabId}/master`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'mastered',
          email: currentUser?.email || studentProfile.email,
        }),
      });
    } catch (e) {
      console.error('API mark mastered error:', e);
    }
  };

  const markVocabLearning = async (vocabId: string) => {
    setStudentProfile((prev) => {
      return {
        ...prev,
        masteredVocabIds: prev.masteredVocabIds.filter((id) => id !== vocabId),
        learningVocabIds: prev.learningVocabIds.includes(vocabId)
          ? prev.learningVocabIds
          : [...prev.learningVocabIds, vocabId],
      };
    });
    try {
      await fetch(`/api/vocab/${vocabId}/master`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'learning',
          email: currentUser?.email || studentProfile.email,
        }),
      });
    } catch (e) {
      console.error('API mark learning error:', e);
    }
  };

  const addCustomVocab = async (vocab: VocabItem) => {
    setVocabularies((prev) => [vocab, ...prev]);
    try {
      await fetch('/api/vocab', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(vocab),
      });
    } catch (e) {
      console.error('API add custom vocab error:', e);
    }
  };

  // Vocab Decks & Flashcards actions
  const addVocabDeck = async (deck: VocabDeck) => {
    setVocabDecks((prev) => [deck, ...prev]);
    if (deck.cards && deck.cards.length > 0) {
      setVocabularies((prev) => {
        const newOnes = deck.cards.filter((c) => !prev.some((v) => v.word === c.word));
        return [...newOnes, ...prev];
      });
    }

    try {
      const res = await fetch('/api/vocab/decks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(deck),
      });
      if (res.ok) {
        const saved = await res.json();
        setVocabDecks((prev) => prev.map((d) => (d.id === deck.id ? saved : d)));
      }
    } catch (e) {
      console.error('API add deck error:', e);
    }
  };

  const updateVocabDeck = async (updatedDeck: VocabDeck) => {
    setVocabDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    try {
      await fetch(`/api/vocab/decks/${updatedDeck.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedDeck),
      });
    } catch (e) {
      console.error('API update deck error:', e);
    }
  };

  const deleteVocabDeck = async (deckId: string) => {
    setVocabDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (activeDeckId === deckId) setActiveDeckId(null);
    try {
      await fetch(`/api/vocab/decks/${deckId}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch (e) {
      console.error('API delete deck error:', e);
    }
  };

  const addCardToDeck = async (deckId: string, card: VocabItem) => {
    setVocabDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          const cards = [card, ...d.cards];
          return { ...d, cards, cardCount: cards.length };
        }
        return d;
      })
    );
    setVocabularies((prev) => (prev.some((v) => v.word === card.word) ? prev : [card, ...prev]));

    try {
      await fetch(`/api/vocab/decks/${deckId}/cards`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(card),
      });
    } catch (e) {
      console.error('API add card error:', e);
    }
  };

  const updateCardInDeck = async (deckId: string, updatedCard: VocabItem) => {
    setVocabDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          return {
            ...d,
            cards: d.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
          };
        }
        return d;
      })
    );
    setVocabularies((prev) => prev.map((v) => (v.id === updatedCard.id ? updatedCard : v)));

    try {
      await fetch(`/api/vocab/decks/${deckId}/cards/${updatedCard.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCard),
      });
    } catch (e) {
      console.error('API update card error:', e);
    }
  };

  const deleteCardFromDeck = async (deckId: string, cardId: string) => {
    setVocabDecks((prev) =>
      prev.map((d) => {
        if (d.id === deckId) {
          const cards = d.cards.filter((c) => c.id !== cardId);
          return { ...d, cards, cardCount: cards.length };
        }
        return d;
      })
    );

    try {
      await fetch(`/api/vocab/decks/${deckId}/cards/${cardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.error('API delete card error:', e);
    }
  };

  // Self-service User Registration & Password Login
  const registerAccount = async (data: { name: string; email: string; password: string; level: HSKLevel }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Đăng ký không thành công' };
      }

      const resolvedAvatar = resolvePersistentAvatar(resData.user?.avatar, resData.user?.email);
      const authedUser: AuthUser = {
        ...resData.user,
        avatar: resolvedAvatar,
      };
      setIsAuthenticated(true);
      setCurrentUser(authedUser);
      setUserRole(authedUser.role || 'student');
      if (resData.profile) {
        setStudentProfile({
          ...resData.profile,
          avatar: resolvedAvatar,
        });
      }

      setAppUsers((prev) => {
        const matchingAppUser: AppUser = {
          id: authedUser.id,
          name: authedUser.name,
          email: authedUser.email,
          avatar: resolvedAvatar,
          role: 'student',
          status: 'active',
          level: data.level,
          provider: 'email',
          joinedDate: new Date().toISOString().split('T')[0],
          streak: 1,
          completedLessons: 0,
          examsTaken: 0,
          avgScore: 0,
        };
        return [matchingAppUser, ...prev.filter((u) => u.email !== authedUser.email)];
      });

      safeSetItem(STORAGE_KEY_PREFIX + 'auth', 'true');
      safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(authedUser));
      if (resData.token) {
        safeSetItem(STORAGE_KEY_PREFIX + 'token', resData.token);
      }
      setIsGoogleAuthModalOpen(false);
      return { success: true, message: resData.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng khi kết nối máy chủ' };
    }
  };

  const loginWithEmail = async (data: { email: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Đăng nhập không thành công' };
      }

      const resolvedAvatar = resolvePersistentAvatar(resData.user?.avatar, resData.user?.email);
      const authedUser: AuthUser = {
        ...resData.user,
        avatar: resolvedAvatar,
      };
      setIsAuthenticated(true);
      setCurrentUser(authedUser);
      setUserRole(authedUser.role || 'student');
      if (resData.profile) {
        setStudentProfile({
          ...resData.profile,
          avatar: resolvedAvatar,
        });
      }

      safeSetItem(STORAGE_KEY_PREFIX + 'auth', 'true');
      safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(authedUser));
      if (resData.token) {
        safeSetItem(STORAGE_KEY_PREFIX + 'token', resData.token);
      }

      // If cached avatar was restored after server restart, silently resync to backend
      if (resolvedAvatar !== resData.user?.avatar && authedUser.email) {
        fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(resData.token ? { Authorization: `Bearer ${resData.token}` } : {}),
            'x-user-email': authedUser.email,
          },
          body: JSON.stringify({ email: authedUser.email, avatar: resolvedAvatar }),
        }).catch(() => {});
      }

      setIsGoogleAuthModalOpen(false);
      return { success: true, message: resData.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng khi kết nối máy chủ' };
    }
  };

  const resetPasswordWithEmail = async (data: { email: string; newPassword: string }) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Đặt lại mật khẩu không thành công' };
      }

      const resolvedAvatar = resolvePersistentAvatar(resData.user?.avatar, resData.user?.email);
      const authedUser: AuthUser = {
        ...resData.user,
        avatar: resolvedAvatar,
      };
      setIsAuthenticated(true);
      setCurrentUser(authedUser);
      setUserRole(authedUser.role || 'student');
      if (resData.profile) {
        setStudentProfile({
          ...resData.profile,
          avatar: resolvedAvatar,
        });
      }

      safeSetItem(STORAGE_KEY_PREFIX + 'auth', 'true');
      safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(authedUser));
      if (resData.token) {
        safeSetItem(STORAGE_KEY_PREFIX + 'token', resData.token);
      }
      setIsGoogleAuthModalOpen(false);
      return { success: true, message: resData.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng khi kết nối máy chủ' };
    }
  };

  // Admin User Management & Role Assignment
  const addUserAdmin = async (data: Partial<AppUser>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Thêm tài khoản thất bại' };
      }
      setAppUsers((prev) => [resData, ...prev]);
      return { success: true, message: 'Tạo tài khoản thành công' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateUserRoleAdmin = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Cập nhật quyền thất bại' };
      }

      setAppUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );

      if (currentUser && currentUser.id === userId) {
        setUserRole(role);
        setCurrentUser((prev) => (prev ? { ...prev, role } : null));
      }

      return { success: true, message: `Đã phân quyền thành công: ${role}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateUserStatusAdmin = async (userId: string, status: UserStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Cập nhật trạng thái thất bại' };
      }

      setAppUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );

      return { success: true, message: `Đã chuyển trạng thái: ${status}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateUserAdmin = async (userId: string, data: Partial<AppUser>) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Cập nhật thất bại' };
      }

      setAppUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data } : u))
      );

      return { success: true, message: 'Cập nhật thông tin tài khoản thành công' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const deleteUserAdmin = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Xóa tài khoản thất bại' };
      }

      setAppUsers((prev) => prev.filter((u) => u.id !== userId));
      return { success: true, message: 'Đã xóa tài khoản' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Forum actions
  const addForumPost = async (
    newPostData: Omit<ForumPost, 'id' | 'createdAt' | 'likes' | 'repliesCount' | 'replies'>
  ) => {
    const tempId = `fp-${Date.now()}`;
    const newPost: ForumPost = {
      ...newPostData,
      id: tempId,
      createdAt: new Date().toISOString(),
      likes: 1,
      repliesCount: 0,
      replies: [],
    };
    setForumPosts((prev) => [newPost, ...prev]);

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newPostData,
          id: tempId,
          authorName: newPostData.authorName || currentUser?.name || studentProfile.name,
          authorAvatar: newPostData.authorAvatar || currentUser?.avatar || studentProfile.avatar,
          role: newPostData.role || userRole,
        }),
      });
      if (res.ok) {
        const savedPost = await res.json();
        setForumPosts((prev) => prev.map((p) => (p.id === tempId ? savedPost : p)));
      }
    } catch (e) {
      console.error('API add forum post error:', e);
    }
  };

  const addForumReply = async (
    postId: string,
    content: string,
    role: 'student' | 'teacher' | 'admin' | 'ai' = 'student'
  ) => {
    const replyId = role === 'ai' ? `fr-ai-${Date.now()}` : `fr-${Date.now()}`;
    const authorName =
      role === 'ai'
        ? 'Lão Sư AI (Trợ lý Giáo viên)'
        : userRole === 'admin'
        ? 'Quản trị viên / Giáo viên'
        : currentUser?.name || studentProfile.name;
    const authorAvatar =
      role === 'ai' || userRole === 'admin' ? '' : currentUser?.avatar || studentProfile.avatar;

    const newReply = {
      id: replyId,
      authorName,
      authorAvatar,
      role,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setForumPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isSolved: role === 'ai' ? true : post.isSolved,
            repliesCount: post.repliesCount + 1,
            replies: [...post.replies, newReply],
          };
        }
        return post;
      })
    );

    try {
      await fetch(`/api/forum/${postId}/replies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: replyId, content, role, authorName, authorAvatar }),
      });
    } catch (e) {
      console.error('API reply forum post error:', e);
    }
  };

  const likeForumPost = async (postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
    try {
      await fetch(`/api/forum/${postId}/like`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {
      console.error('API like forum post error:', e);
    }
  };

  const togglePinPost = async (postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p))
    );
    try {
      await fetch(`/api/forum/${postId}/toggle-pin`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {
      console.error('API pin forum post error:', e);
    }
  };

  const toggleSolvedPost = async (postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSolved: !p.isSolved } : p))
    );
    try {
      await fetch(`/api/forum/${postId}/toggle-solved`, { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {
      console.error('API solve forum post error:', e);
    }
  };

  // Profile updates
  const updateReminderSettings = async (enabled: boolean, time: string, dailyGoal: number) => {
    setStudentProfile((prev) => ({
      ...prev,
      reminderEnabled: enabled,
      reminderTime: time,
      dailyGoalMinutes: dailyGoal,
    }));
    try {
      await fetch('/api/reminders/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          enabled,
          time,
          dailyGoal,
          email: currentUser?.email || studentProfile.email,
        }),
      });
    } catch (e) {
      console.error('API reminder settings error:', e);
    }
  };

  const recordStudyMinutes = async (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStudentProfile((prev) => ({
      ...prev,
      xp: prev.xp + minutes * 2,
      studyLog: {
        ...prev.studyLog,
        [today]: (prev.studyLog[today] || 0) + minutes,
      },
    }));
    try {
      await fetch('/api/reports/log-time', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          minutes,
          email: currentUser?.email || studentProfile.email,
        }),
      });
    } catch (e) {
      console.error('API record study minutes error:', e);
    }
  };

  const loginWithGoogle = async (customData?: Partial<AuthUser>): Promise<{ success: boolean; message?: string }> => {
    const userPayload = {
      name: customData?.name || 'Thắng Trần',
      email: customData?.email || 'thangtv1.hyn@gmail.com',
      avatar: customData?.avatar || DEFAULT_CARTOON_AVATAR,
    };

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Đăng nhập Google không thành công' };
      }

      const rawAuthedUser: AuthUser = data.user || {
        id: `g-user-${Date.now()}`,
        ...userPayload,
        provider: 'google',
        joinedAt: new Date().toISOString(),
      };
      const resolvedAvatar = resolvePersistentAvatar(rawAuthedUser.avatar, rawAuthedUser.email);
      const authedUser: AuthUser = {
        ...rawAuthedUser,
        avatar: resolvedAvatar,
      };

      setIsAuthenticated(true);
      setCurrentUser(authedUser);
      if (authedUser.role) {
        setUserRole(authedUser.role);
      }
      if (data.profile) {
        setStudentProfile({
          ...data.profile,
          avatar: resolvedAvatar,
        });
      } else {
        setStudentProfile((prev) => ({
          ...prev,
          name: authedUser.name,
          email: authedUser.email,
          avatar: resolvedAvatar,
        }));
      }

      safeSetItem(STORAGE_KEY_PREFIX + 'auth', 'true');
      safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(authedUser));
      if (data.token) {
        safeSetItem(STORAGE_KEY_PREFIX + 'token', data.token);
      }

      if (resolvedAvatar !== rawAuthedUser.avatar && authedUser.email) {
        fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
            'x-user-email': authedUser.email,
          },
          body: JSON.stringify({ email: authedUser.email, avatar: resolvedAvatar }),
        }).catch(() => {});
      }

      setIsGoogleAuthModalOpen(false);
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng khi kết nối máy chủ' };
    }
  };

  const updateCurrentUserProfile = async (
    data: Partial<AppUser> & { currentPassword?: string; targetLevel?: HSKLevel }
  ) => {
    try {
      const targetEmail = (currentUser?.email || studentProfile?.email || '').trim();
      if (!targetEmail) {
        return { success: false, message: 'Bạn chưa đăng nhập' };
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: targetEmail,
          ...data,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Cập nhật thất bại' };
      }

      const savedAvatar =
        (data.avatar && data.avatar.trim()) ||
        resolveCartoonAvatar(resData.user?.avatar || currentUser?.avatar, targetEmail);

      // Persist chosen avatar per email so it survives logout, refresh, and server restarts
      if (data.avatar && data.avatar.trim()) {
        saveCachedAvatar(targetEmail, savedAvatar);
      }

      if (resData.user) {
        const updatedUser: AuthUser = {
          ...resData.user,
          avatar: savedAvatar,
        };
        setCurrentUser(updatedUser);
        if (updatedUser.role) {
          setUserRole(updatedUser.role);
        }
        safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(updatedUser));
      } else if (currentUser) {
        const updatedUser: AuthUser = {
          ...currentUser,
          name: data.name || currentUser.name,
          avatar: savedAvatar,
          targetLevel: (data.targetLevel || data.level || currentUser.targetLevel) as HSKLevel,
        };
        setCurrentUser(updatedUser);
        safeSetItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(updatedUser));
      }

      if (resData.profile) {
        const updatedProfile: StudentProfile = {
          ...resData.profile,
          avatar: savedAvatar,
        };
        setStudentProfile(updatedProfile);
        safeSetItem(STORAGE_KEY_PREFIX + 'profile', JSON.stringify(updatedProfile));
      } else {
        setStudentProfile((prev) => ({
          ...prev,
          name: data.name || prev.name,
          avatar: savedAvatar,
          targetLevel: (data.targetLevel || data.level || prev.targetLevel) as HSKLevel,
        }));
      }

      setAppUsers((prev) =>
        prev.map((u) => {
          if (u.email.toLowerCase() === targetEmail.toLowerCase()) {
            return {
              ...u,
              name: data.name || u.name,
              avatar: savedAvatar,
              level: (data.level || data.targetLevel || u.level) as HSKLevel,
            };
          }
          return u;
        })
      );

      return { success: true, message: resData.message || 'Cập nhật thành công' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối khi cập nhật' };
    }
  };

  const logout = async () => {
    const headers = getAuthHeaders();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole('student');
    setActiveTab('home');
    setCurrentLesson(null);
    setCurrentExam(null);
    setLastExamResult(null);
    setIsUserProfileOpen(false);
    setIsGoogleAuthModalOpen(false);
    setStudentProfile(INITIAL_STUDENT_PROFILE);
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'user');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'token');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'profile');
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers });
    } catch (e) {
      console.error(e);
    }
  };

  const resetAllData = async () => {
    setCourses(INITIAL_COURSES);
    setExams(INITIAL_EXAMS);
    setVocabularies(INITIAL_VOCABULARY);
    setVocabDecks(INITIAL_VOCAB_DECKS);
    setForumPosts(INITIAL_FORUM_POSTS);
    setStudentProfile(INITIAL_STUDENT_PROFILE);
    setAppUsers(INITIAL_APP_USERS);
    localStorage.clear();
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
    } catch (e) {
      console.error('API reset error:', e);
    }
  };

  return (
    <HSKContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        loginWithGoogle,
        registerAccount,
        loginWithEmail,
        resetPasswordWithEmail,
        logout,
        isGoogleAuthModalOpen,
        setIsGoogleAuthModalOpen,
        isUserProfileOpen,
        setIsUserProfileOpen,
        updateCurrentUserProfile,
        activeTab,
        setActiveTab,
        activeLevel,
        setActiveLevel,
        userRole,
        setUserRole,
        showPinyin,
        setShowPinyin,
        isMobileCompanionOpen,
        setIsMobileCompanionOpen,
        currentLesson,
        setCurrentLesson,
        currentExam,
        setCurrentExam,
        lastExamResult,
        setLastExamResult,
        courses,
        exams,
        vocabularies,
        vocabDecks,
        activeDeckId,
        setActiveDeckId,
        forumPosts,
        studentProfile,
        appUsers,
        addCourse,
        updateCourse,
        deleteCourse,
        addLesson,
        updateLesson,
        deleteLesson,
        completeLesson,
        addExam,
        updateExam,
        deleteExam,
        submitExam,
        markVocabMastered,
        markVocabLearning,
        addCustomVocab,
        addVocabDeck,
        updateVocabDeck,
        deleteVocabDeck,
        addCardToDeck,
        updateCardInDeck,
        deleteCardFromDeck,
        addUserAdmin,
        updateUserRoleAdmin,
        updateUserStatusAdmin,
        updateUserAdmin,
        deleteUserAdmin,
        addForumPost,
        addForumReply,
        likeForumPost,
        togglePinPost,
        toggleSolvedPost,
        updateReminderSettings,
        recordStudyMinutes,
        resetAllData,
        siteUIConfig,
        updateSiteUIConfig,
        resetSiteUIConfig,
      }}
    >
      {children}
    </HSKContext.Provider>
  );
};

export const useHSK = () => {
  const context = useContext(HSKContext);
  if (!context) {
    throw new Error('useHSK must be used within an HSKProvider');
  }
  return context;
};
