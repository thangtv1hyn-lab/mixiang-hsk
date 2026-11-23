import React, { useMemo, useState } from 'react';
import {
  Palette,
  Type,
  Layout,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Upload,
  Sparkles,
  Megaphone,
  Globe,
  Camera,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import {
  useHSK,
  DEFAULT_SITE_UI_CONFIG,
  DEFAULT_CLASSROOM_MOMENTS,
} from '../../context/HSKContext';
import { ClassroomMomentItem, SiteUIConfig } from '../../types/hsk';
import { compressImageToDataUrl } from '../../utils/cartoonAvatars';
import {
  estimateSiteConfigBytes,
  MAX_SITE_CONFIG_BYTES,
} from '../../services/firestoreService';

const isCorruptedLegacyImage = (url?: string): boolean =>
  typeof url === 'string' && url.startsWith('data:image/') && url.length >= 179000;

export const UIEditorPanel: React.FC = () => {
  const {
    siteUIConfig,
    updateSiteUIConfig,
    saveSiteUIConfigNow,
    resetSiteUIConfig,
    setActiveTab,
  } = useHSK();
  const [savedNotice, setSavedNotice] = useState(false);
  const [savedText, setSavedText] = useState('Đã lưu thay đổi giao diện!');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const momentsList: ClassroomMomentItem[] =
    Array.isArray(siteUIConfig.classroomMoments) && siteUIConfig.classroomMoments.length > 0
      ? siteUIConfig.classroomMoments
      : DEFAULT_CLASSROOM_MOMENTS;

  const totalBytesUsed = useMemo(() => estimateSiteConfigBytes(siteUIConfig), [siteUIConfig]);
  const usedKB = Math.round(totalBytesUsed / 1024);
  const maxKB = Math.round(MAX_SITE_CONFIG_BYTES / 1024);

  const corruptedLegacyCount = useMemo(() => {
    let count = 0;
    if (isCorruptedLegacyImage(siteUIConfig.headerLogoUrl)) count++;
    if (isCorruptedLegacyImage(siteUIConfig.footerLogoUrl)) count++;
    if (isCorruptedLegacyImage(siteUIConfig.poster1Url)) count++;
    if (isCorruptedLegacyImage(siteUIConfig.poster2Url)) count++;
    for (const m of momentsList) {
      if (isCorruptedLegacyImage(m.image)) count++;
    }
    return count;
  }, [siteUIConfig, momentsList]);

  const triggerSavedNotice = (message = 'Đã lưu thay đổi giao diện!') => {
    setErrorNotice(null);
    setSavedText(message);
    setSavedNotice(true);
    setHasUnsavedChanges(false);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  const handleFieldChange = (partial: Partial<SiteUIConfig>) => {
    setErrorNotice(null);
    updateSiteUIConfig(partial);
    setHasUnsavedChanges(true);
  };

  const handleExplicitSave = async () => {
    setIsSaving(true);
    setErrorNotice(null);
    const res = await saveSiteUIConfigNow({ ...siteUIConfig });
    setIsSaving(false);
    if (res.success) {
      triggerSavedNotice(res.message || 'Đã lưu cấu hình giao diện & logo lên Cloud thành công!');
    } else {
      setErrorNotice(res.message || 'Không thể lưu giao diện. Vui lòng thử lại.');
    }
  };

  const handleCleanCorruptedLegacyImages = async () => {
    setIsSaving(true);
    setErrorNotice(null);
    const cleanedMoments = momentsList.map((m, idx) =>
      isCorruptedLegacyImage(m.image)
        ? {
            ...m,
            image:
              DEFAULT_CLASSROOM_MOMENTS[idx % DEFAULT_CLASSROOM_MOMENTS.length]?.image ||
              '/assets/aistudio/image_f2d52981.png',
          }
        : m
    );
    const cleanedConfig: SiteUIConfig = {
      ...siteUIConfig,
      headerLogoUrl: isCorruptedLegacyImage(siteUIConfig.headerLogoUrl)
        ? ''
        : siteUIConfig.headerLogoUrl,
      footerLogoUrl: isCorruptedLegacyImage(siteUIConfig.footerLogoUrl)
        ? DEFAULT_SITE_UI_CONFIG.footerLogoUrl
        : siteUIConfig.footerLogoUrl,
      poster1Url: isCorruptedLegacyImage(siteUIConfig.poster1Url)
        ? DEFAULT_SITE_UI_CONFIG.poster1Url
        : siteUIConfig.poster1Url,
      poster2Url: isCorruptedLegacyImage(siteUIConfig.poster2Url)
        ? DEFAULT_SITE_UI_CONFIG.poster2Url
        : siteUIConfig.poster2Url,
      classroomMoments: cleanedMoments,
    };

    const res = await saveSiteUIConfigNow(cleanedConfig);
    setIsSaving(false);
    if (res.success) {
      triggerSavedNotice('Đã dọn sạch ảnh bị lỗi cắt dung lượng cũ! Bạn có thể tải lại ảnh mới ngay.');
    } else {
      setErrorNotice(res.message || 'Không thể dọn ảnh lỗi cũ lúc này.');
    }
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'headerLogoUrl' | 'poster1Url' | 'poster2Url' | 'footerLogoUrl'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingSlot(field);
    setErrorNotice(null);

    try {
      const isLogo = field === 'headerLogoUrl' || field === 'footerLogoUrl';
      const dataUrl = await compressImageToDataUrl(
        file,
        isLogo ? 320 : 900,
        isLogo,
        isLogo ? 48000 : 110000
      );

      // Automatically clean any legacy 180KB broken image on OTHER fields only if needed? No, keep user edits explicit
      const nextConfig: SiteUIConfig = {
        ...siteUIConfig,
        [field]: dataUrl,
      };
      const saveRes = await saveSiteUIConfigNow(nextConfig);
      if (saveRes.success) {
        triggerSavedNotice(
          `Đã nén ảnh (${Math.round(dataUrl.length / 1024)} KB) và lưu lên Cloud thành công!`
        );
      } else {
        setErrorNotice(saveRes.message || 'Lưu ảnh lên Cloud thất bại.');
      }
    } catch (err: any) {
      setErrorNotice(
        err?.message || 'Không thể xử lý tệp ảnh này. Vui lòng thử ảnh JPG, PNG hoặc WebP khác.'
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleUpdateMoment = (index: number, partial: Partial<ClassroomMomentItem>) => {
    const updated = momentsList.map((item, idx) =>
      idx === index ? { ...item, ...partial } : item
    );
    updateSiteUIConfig({ classroomMoments: updated });
  };

  const handleMomentImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const slotKey = `moment-${index}`;
    setUploadingSlot(slotKey);
    setErrorNotice(null);

    try {
      const dataUrl = await compressImageToDataUrl(file, 720, false, 65000);
      const updated = momentsList.map((item, idx) =>
        idx === index ? { ...item, image: dataUrl } : item
      );
      const nextConfig: SiteUIConfig = {
        ...siteUIConfig,
        classroomMoments: updated,
      };
      const saveRes = await saveSiteUIConfigNow(nextConfig);
      if (saveRes.success) {
        triggerSavedNotice(
          `Đã nén ảnh Khoảnh khắc #${index + 1} (${Math.round(
            dataUrl.length / 1024
          )} KB) và lưu lên Cloud!`
        );
      } else {
        setErrorNotice(saveRes.message || 'Lưu ảnh khoảnh khắc lên Cloud thất bại.');
      }
    } catch (err: any) {
      setErrorNotice(
        err?.message || 'Không thể nén ảnh khoảnh khắc này. Vui lòng chọn ảnh JPG/PNG/WebP khác.'
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleAddMoment = () => {
    const newMoment: ClassroomMomentItem = {
      id: `moment-${Date.now()}`,
      title: 'Khoảnh khắc lớp học mới',
      subtitle: 'Hoạt động giao lưu và thực hành tiếng Trung sôi nổi tại MiXiangg HSK',
      detail:
        'Buổi học thực hành giao tiếp phản xạ và văn hóa Trung Hoa cùng giảng viên và các bạn học viên tại lớp.',
      date: 'Tháng 11/2026',
      location: 'Cơ sở MiXiangg HSK & Online',
      image: '/assets/aistudio/image_f2d52981.png',
    };
    updateSiteUIConfig({ classroomMoments: [...momentsList, newMoment] });
    triggerSavedNotice('Đã thêm thẻ khoảnh khắc mới!');
  };

  const handleDeleteMoment = (index: number) => {
    if (momentsList.length <= 1) return;
    const updated = momentsList.filter((_, idx) => idx !== index);
    updateSiteUIConfig({ classroomMoments: updated });
    triggerSavedNotice('Đã xóa thẻ khoảnh khắc!');
  };

  const colorPresets = [
    { name: 'Đỏ gạch Terracotta (Chuẩn PDF)', primary: '#C85A43', canvas: '#F7F4EC' },
    { name: 'Đỏ Chu Sa Cổ Điển', primary: '#B83B2A', canvas: '#FAF6EE' },
    { name: 'Đỏ Hồng Pastel Hiện Đại', primary: '#D46A6A', canvas: '#FCF9F5' },
    { name: 'Cam Đất Ấm Áp', primary: '#C96A2C', canvas: '#F8F4EC' },
    { name: 'Xanh Ngọc Bích Hoàng Gia', primary: '#2B6E63', canvas: '#F4F7F4' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F3] text-red-700 text-[12px] font-extrabold border border-red-200">
              <Palette className="w-3.5 h-3.5" />
              <span>TRÌNH CHỈNH SỬA GIAO DIỆN &amp; LOGO</span>
            </div>
            <h3 className="font-sans font-extrabold text-[#18181B] text-[21px] sm:text-[23px] tracking-tight">
              Tùy chỉnh Logo, Màu sắc, Poster &amp; Khoảnh khắc Lớp học
            </h3>
            <p className="text-[14.5px] text-slate-600">
              Ảnh tải lên được tự động nén gọn chuẩn WebP/JPG để lưu nhanh trên Cloud (đang dùng{' '}
              <strong className={usedKB > 800 ? 'text-rose-700' : 'text-[#18181B]'}>
                {usedKB} KB / {maxKB} KB
              </strong>
              ).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {uploadingSlot && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[13px] font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang nén &amp; lưu ảnh...</span>
              </span>
            )}

            {savedNotice && !uploadingSlot && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{savedText}</span>
              </span>
            )}

            <button
              type="button"
              disabled={isSaving || Boolean(uploadingSlot)}
              onClick={handleExplicitSave}
              className={`px-5 py-2.5 min-h-[44px] rounded-2xl font-bold text-[14px] flex items-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-60 ${
                hasUnsavedChanges
                  ? 'bg-[#C85A43] hover:bg-[#B24A34] text-white ring-2 ring-[#C85A43]/30'
                  : 'bg-[#C85A43] hover:bg-[#B24A34] text-white'
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#18181B] hover:bg-black text-white font-bold text-[13.5px] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              <span>Xem Trang Chủ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetSiteUIConfig();
                triggerSavedNotice('Đã khôi phục giao diện & logo mặc định!');
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#FAF7F0] hover:bg-[#FFF5F3] text-[#18181B] hover:text-red-700 border border-[#E8DFCE] font-bold text-[13.5px] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>
        </div>

        {errorNotice && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorNotice}</span>
          </div>
        )}

        {corruptedLegacyCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-[13.5px] text-amber-950">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">
                  Phát hiện {corruptedLegacyCount} ảnh tải lên trước đây bị vượt dung lượng (đang chiếm{' '}
                  {usedKB} KB / {maxKB} KB)
                </p>
                <p className="text-[12.5px] text-amber-900/90 mt-0.5">
                  Hãy bấm dọn các ảnh bị lỗi cũ này để giải phóng bộ nhớ Cloud, sau đó tải lại ảnh mới — hệ thống sẽ tự động nén siêu nhẹ và sắc nét.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCleanCorruptedLegacyImages}
              className="shrink-0 px-4 py-2.5 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] cursor-pointer transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Đang dọn...' : 'Dọn ảnh lỗi cũ ngay'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (5 cols): THEME COLORS, FONT SCALE, SECTION TOGGLES & FOOTER */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Theme Colors & Presets */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE7D6]">
              <Palette className="w-5 h-5 text-red-600" />
              <h4 className="font-serif font-black text-[18px] text-[#18181B]">
                1. Bảng Màu Chủ Đạo &amp; Nền Web
              </h4>
            </div>

            <div className="space-y-3">
              <label className="block text-[13px] font-bold text-slate-700">
                Chọn nhanh bộ màu chuẩn thiết kế:
              </label>
              <div className="space-y-2">
                {colorPresets.map((preset) => {
                  const isSelected =
                    siteUIConfig.primaryColor.toLowerCase() === preset.primary.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        updateSiteUIConfig({
                          primaryColor: preset.primary,
                          canvasColor: preset.canvas,
                        });
                        triggerSavedNotice();
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFF5F3] border-red-500 shadow-2xs'
                          : 'bg-[#FDFBF7] border-[#E8DFCE] hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-1.5">
                          <span
                            className="w-6 h-6 rounded-full border-2 border-white shadow-2xs"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span
                            className="w-6 h-6 rounded-full border-2 border-slate-300 shadow-2xs"
                            style={{ backgroundColor: preset.canvas }}
                          />
                        </div>
                        <span className="text-[13.5px] font-bold text-[#18181B]">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                          Đang dùng
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1.5">
                  Màu chủ đạo (Primary):
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7]">
                  <input
                    type="color"
                    value={siteUIConfig.primaryColor}
                    onChange={(e) => {
                      updateSiteUIConfig({ primaryColor: e.target.value });
                      triggerSavedNotice();
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={siteUIConfig.primaryColor}
                    onChange={(e) => updateSiteUIConfig({ primaryColor: e.target.value })}
                    className="w-full text-[13px] font-mono font-bold text-[#18181B] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1.5">
                  Màu nền kem (Canvas):
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7]">
                  <input
                    type="color"
                    value={siteUIConfig.canvasColor}
                    onChange={(e) => {
                      updateSiteUIConfig({ canvasColor: e.target.value });
                      triggerSavedNotice();
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={siteUIConfig.canvasColor}
                    onChange={(e) => updateSiteUIConfig({ canvasColor: e.target.value })}
                    className="w-full text-[13px] font-mono font-bold text-[#18181B] bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Font Scale */}
            <div className="pt-2 border-t border-[#EFE7D6]">
              <label className="block text-[13px] font-bold text-[#18181B] mb-2 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-red-600" />
                <span>Cỡ chữ hiển thị toàn trang:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: '13.5px', label: 'Gọn gàng (13.5px)' },
                    { value: '14px', label: 'Tiêu chuẩn (14px)' },
                    { value: '15px', label: 'Cỡ lớn dễ đọc (15px)' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      updateSiteUIConfig({ fontScale: item.value });
                      triggerSavedNotice();
                    }}
                    className={`py-2.5 px-3 rounded-xl text-[12.5px] font-bold border transition-all cursor-pointer ${
                      siteUIConfig.fontScale === item.value
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-[#FDFBF7] text-[#18181B] border-[#E8DFCE] hover:border-red-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Section Visibility Toggles */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE7D6]">
              <Layout className="w-5 h-5 text-red-600" />
              <h4 className="font-serif font-black text-[18px] text-[#18181B]">
                2. Bật / Tắt Các Khu Vực Trang Chủ
              </h4>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'showCoursesSection' as const,
                  label: 'Khối Lộ Trình Cốt Lõi (Các Khóa Học Nổi Bật)',
                  desc: 'Hiển thị 3 khóa học HSK 1, HSK 2, HSK 3 ở trang chủ',
                },
                {
                  key: 'showPostersSection' as const,
                  label: 'Khối Đồng Hành Cùng Giảng Viên (2 Ảnh Poster)',
                  desc: 'Hiển thị 2 ảnh Poster tuyển sinh trong mục Đồng hành giảng viên',
                },
                {
                  key: 'showAdmissionBanner' as const,
                  label: 'Banner Tuyển Sinh Khóa Mới K24 (Nền Đen Than)',
                  desc: 'Khối thông báo tuyển sinh và nút Đăng ký tư vấn',
                },
                {
                  key: 'showMomentsSection' as const,
                  label: 'Khối Khoảnh Khắc Cùng Lớp Học',
                  desc: 'Hiển thị danh sách thẻ hình ảnh hoạt động ngoại khóa & bế giảng',
                },
              ].map((sec) => (
                <label
                  key={sec.key}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] cursor-pointer hover:border-red-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="text-[13.5px] font-bold text-[#18181B]">{sec.label}</div>
                    <div className="text-[12px] text-slate-500">{sec.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteUIConfig[sec.key]}
                    onChange={(e) => {
                      updateSiteUIConfig({ [sec.key]: e.target.checked });
                      triggerSavedNotice();
                    }}
                    className="mt-1 w-5 h-5 accent-red-600 rounded cursor-pointer shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 3. Brand Header & Footer Card Info */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE7D6]">
              <Globe className="w-5 h-5 text-red-600" />
              <h4 className="font-sans font-extrabold text-[18px] text-[#18181B]">
                3. Logo Thương Hiệu Header &amp; Thẻ Footer
              </h4>
            </div>

            {/* Header Logo Replacement Section */}
            <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-extrabold text-[#18181B]">
                  Logo góc trái Header &amp; Menu:
                </span>
                <button
                  type="button"
                  onClick={() => handleFieldChange({ headerLogoUrl: '' })}
                  className="text-[11.5px] font-bold text-[#C85A43] hover:underline cursor-pointer"
                >
                  Dùng biểu tượng 米 mặc định
                </button>
              </div>

              <div className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-[#EAE5DC]">
                {siteUIConfig.headerLogoUrl ? (
                  <div className="w-14 h-14 rounded-full bg-white border border-[#EAE5DC] overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={siteUIConfig.headerLogoUrl}
                      alt="Header Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-full text-white flex items-center justify-center font-serif text-[26px] font-bold shrink-0"
                    style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                  >
                    米
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-2">
                  <label className="w-full py-2 px-3 min-h-[40px] rounded-xl bg-[#FFF5F3] hover:bg-[#C85A43] text-[#C85A43] hover:text-white border border-[#F3C5B6] text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Tải ảnh Logo mới từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, 'headerLogoUrl')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={
                      siteUIConfig.headerLogoUrl?.startsWith('data:image/')
                        ? ''
                        : siteUIConfig.headerLogoUrl || ''
                    }
                    onChange={(e) => handleFieldChange({ headerLogoUrl: e.target.value })}
                    placeholder={
                      siteUIConfig.headerLogoUrl?.startsWith('data:image/')
                        ? 'Đã tải ảnh Logo từ máy tính (bấm Lưu thay đổi)'
                        : 'Hoặc dán đường dẫn URL ảnh Logo...'
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E8DFCE] bg-[#FDFBF7] text-[12px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Tên thương hiệu Header:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.brandName}
                  onChange={(e) => handleFieldChange({ brandName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Chữ nổi bật (Màu đỏ):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.brandHighlight}
                  onChange={(e) => handleFieldChange({ brandHighlight: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold text-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                Dòng phụ đề dưới Logo Header:
              </label>
              <input
                type="text"
                value={siteUIConfig.brandSubtitle}
                onChange={(e) => handleFieldChange({ brandSubtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px]"
              />
            </div>

            {/* Footer Banner Card Settings */}
            <div className="pt-3 border-t border-[#EFE7D6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-[#18181B]">
                  Ảnh Logo Banner ở Footer:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange({
                      footerLogoUrl: DEFAULT_SITE_UI_CONFIG.footerLogoUrl,
                    })
                  }
                  className="text-[11.5px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Mặc định
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] flex flex-col items-center gap-2.5">
                <img
                  src={siteUIConfig.footerLogoUrl || '/assets/aistudio/banner_d01a30da.jpg'}
                  alt="Footer Logo Preview"
                  className="h-16 w-auto object-contain bg-white px-4 py-1.5 rounded-xl border border-[#EAE5DC]"
                />
                <label className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#E8DFCE] hover:border-red-400 text-[12.5px] font-bold text-[#18181B] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-red-600" />
                  <span>Tải ảnh Logo Footer từ máy tính</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, 'footerLogoUrl')}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={
                    siteUIConfig.footerLogoUrl?.startsWith('data:image/')
                      ? ''
                      : siteUIConfig.footerLogoUrl || ''
                  }
                  onChange={(e) => handleFieldChange({ footerLogoUrl: e.target.value })}
                  placeholder={
                    siteUIConfig.footerLogoUrl?.startsWith('data:image/')
                      ? 'Đã tải ảnh Logo Footer từ máy tính'
                      : 'Hoặc dán đường dẫn URL Logo Footer...'
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E8DFCE] bg-white text-[12px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Dòng tiêu đề chính ở Footer:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.footerTitle}
                  onChange={(e) => updateSiteUIConfig({ footerTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Dòng thông tin lớp học ở Footer:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.footerSubtitle}
                  onChange={(e) => updateSiteUIConfig({ footerSubtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                    Số Hotline / Zalo:
                  </label>
                  <input
                    type="text"
                    value={siteUIConfig.hotline}
                    onChange={(e) => updateSiteUIConfig({ hotline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold text-red-700"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                    Nút bấm bên phải Footer:
                  </label>
                  <input
                    type="text"
                    value={siteUIConfig.footerCtaText}
                    onChange={(e) => updateSiteUIConfig({ footerCtaText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): 2 POSTERS EDITOR, HERO TEXTS & ADMISSION BANNER */}
        <div className="lg:col-span-7 space-y-6">
          {/* 4. Section Đồng Hành Cùng Giảng Viên (2 Poster Images) */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFE7D6]">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-red-600" />
                <h4 className="font-serif font-black text-[18px] text-[#18181B]">
                  4. Khu Vực &ldquo;Đồng Hành Cùng Giảng Viên&rdquo; (2 Ảnh Poster)
                </h4>
              </div>
              <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-[#FFF5F3] text-red-700 border border-red-200">
                2 Poster Tuyển sinh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Nhãn nhỏ phía trên (Badge):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.posterSectionBadge}
                  onChange={(e) => updateSiteUIConfig({ posterSectionBadge: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Tiêu đề Section:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.posterSectionTitle}
                  onChange={(e) => updateSiteUIConfig({ posterSectionTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                Mô tả phụ dưới tiêu đề:
              </label>
              <input
                type="text"
                value={siteUIConfig.posterSectionSubtitle}
                onChange={(e) => updateSiteUIConfig({ posterSectionSubtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px]"
              />
            </div>

            {/* 2 Poster Cards Editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Poster 1 */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold text-[#18181B]">
                    Ảnh Poster số 1 (Bên trái)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateSiteUIConfig({
                        poster1Url: DEFAULT_SITE_UI_CONFIG.poster1Url,
                        poster1Caption: DEFAULT_SITE_UI_CONFIG.poster1Caption,
                      })
                    }
                    className="text-[11.5px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Mặc định
                  </button>
                </div>

                <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-white border border-[#E8DFCE] flex items-center justify-center">
                  <img
                    src={siteUIConfig.poster1Url}
                    alt="Poster 1 Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <label className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#E8DFCE] hover:border-red-400 text-[12.5px] font-bold text-[#18181B] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-red-600" />
                    <span>Tải ảnh Poster 1 từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, 'poster1Url')}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={
                      siteUIConfig.poster1Url?.startsWith('data:image/')
                        ? ''
                        : siteUIConfig.poster1Url
                    }
                    onChange={(e) => updateSiteUIConfig({ poster1Url: e.target.value })}
                    placeholder={
                      siteUIConfig.poster1Url?.startsWith('data:image/')
                        ? 'Đã tải ảnh Poster 1 từ máy tính (dán link mới để thay)'
                        : 'Hoặc dán đường dẫn URL ảnh Poster 1...'
                    }
                    className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12px]"
                  />

                  <input
                    type="text"
                    value={siteUIConfig.poster1Caption}
                    onChange={(e) => updateSiteUIConfig({ poster1Caption: e.target.value })}
                    placeholder="Chú thích dưới ảnh Poster 1..."
                    className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12.5px] font-semibold"
                  />
                </div>
              </div>

              {/* Poster 2 */}
              <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold text-[#18181B]">
                    Ảnh Poster số 2 (Bên phải)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateSiteUIConfig({
                        poster2Url: DEFAULT_SITE_UI_CONFIG.poster2Url,
                        poster2Caption: DEFAULT_SITE_UI_CONFIG.poster2Caption,
                      })
                    }
                    className="text-[11.5px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Mặc định
                  </button>
                </div>

                <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-white border border-[#E8DFCE] flex items-center justify-center">
                  <img
                    src={siteUIConfig.poster2Url}
                    alt="Poster 2 Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <label className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#E8DFCE] hover:border-red-400 text-[12.5px] font-bold text-[#18181B] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-red-600" />
                    <span>Tải ảnh Poster 2 từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, 'poster2Url')}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={
                      siteUIConfig.poster2Url?.startsWith('data:image/')
                        ? ''
                        : siteUIConfig.poster2Url
                    }
                    onChange={(e) => updateSiteUIConfig({ poster2Url: e.target.value })}
                    placeholder={
                      siteUIConfig.poster2Url?.startsWith('data:image/')
                        ? 'Đã tải ảnh Poster 2 từ máy tính (dán link mới để thay)'
                        : 'Hoặc dán đường dẫn URL ảnh Poster 2...'
                    }
                    className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12px]"
                  />

                  <input
                    type="text"
                    value={siteUIConfig.poster2Caption}
                    onChange={(e) => updateSiteUIConfig({ poster2Caption: e.target.value })}
                    placeholder="Chú thích dưới ảnh Poster 2..."
                    className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12.5px] font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Hero Banner Content & 3 Proof Metrics */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE7D6]">
              <Sparkles className="w-5 h-5 text-red-600" />
              <h4 className="font-serif font-black text-[18px] text-[#18181B]">
                5. Nội Dung Hero Trang Chủ &amp; Các Con Số Ấn Tượng
              </h4>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                Nhãn giới thiệu đầu trang (Hero Badge):
              </label>
              <input
                type="text"
                value={siteUIConfig.heroBadge}
                onChange={(e) => updateSiteUIConfig({ heroBadge: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Tiêu đề Dòng 1:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.heroTitleLine1}
                  onChange={(e) => updateSiteUIConfig({ heroTitleLine1: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Dòng 2 (Tô màu chủ đạo):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.heroTitleHighlight}
                  onChange={(e) => updateSiteUIConfig({ heroTitleHighlight: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold text-red-600"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Tiêu đề Dòng 3:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.heroTitleLine3}
                  onChange={(e) => updateSiteUIConfig({ heroTitleLine3: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                Đoạn mô tả phương pháp học:
              </label>
              <textarea
                rows={2}
                value={siteUIConfig.heroDescription}
                onChange={(e) => updateSiteUIConfig({ heroDescription: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px]"
              />
            </div>

            {/* 3 Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-1.5">
                <label className="block text-[11.5px] font-bold text-slate-500">
                  Chỉ số 1 (Số lượng):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.stat1Value}
                  onChange={(e) => updateSiteUIConfig({ stat1Value: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#E8DFCE] bg-white text-[14px] font-black"
                />
                <input
                  type="text"
                  value={siteUIConfig.stat1Label}
                  onChange={(e) => updateSiteUIConfig({ stat1Label: e.target.value })}
                  className="w-full p-1.5 rounded-lg border border-[#E8DFCE] bg-white text-[12px]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-1.5">
                <label className="block text-[11.5px] font-bold text-slate-500">
                  Chỉ số 2 (Tỷ lệ đỗ):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.stat2Value}
                  onChange={(e) => updateSiteUIConfig({ stat2Value: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#E8DFCE] bg-white text-[14px] font-black text-red-600"
                />
                <input
                  type="text"
                  value={siteUIConfig.stat2Label}
                  onChange={(e) => updateSiteUIConfig({ stat2Label: e.target.value })}
                  className="w-full p-1.5 rounded-lg border border-[#E8DFCE] bg-white text-[12px]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-1.5">
                <label className="block text-[11.5px] font-bold text-slate-500">
                  Chỉ số 3 (Danh hiệu):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.stat3Value}
                  onChange={(e) => updateSiteUIConfig({ stat3Value: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#E8DFCE] bg-white text-[14px] font-black text-amber-600"
                />
                <input
                  type="text"
                  value={siteUIConfig.stat3Label}
                  onChange={(e) => updateSiteUIConfig({ stat3Label: e.target.value })}
                  className="w-full p-1.5 rounded-lg border border-[#E8DFCE] bg-white text-[12px]"
                />
              </div>
            </div>
          </div>

          {/* 6. Admission Banner K24 */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE7D6]">
              <Megaphone className="w-5 h-5 text-red-600" />
              <h4 className="font-serif font-black text-[18px] text-[#18181B]">
                6. Khối Banner Tuyển Sinh Khóa Mới (Nền Đen Than)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Nhãn thông báo màu vàng:
                </label>
                <input
                  type="text"
                  value={siteUIConfig.admissionBadge}
                  onChange={(e) => updateSiteUIConfig({ admissionBadge: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                  Chữ trên nút kêu gọi (CTA):
                </label>
                <input
                  type="text"
                  value={siteUIConfig.admissionCta}
                  onChange={(e) => updateSiteUIConfig({ admissionCta: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold text-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                Tiêu đề khóa tuyển sinh:
              </label>
              <input
                type="text"
                value={siteUIConfig.admissionTitle}
                onChange={(e) => updateSiteUIConfig({ admissionTitle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
                Mô tả quyền lợi &amp; lịch học:
              </label>
              <textarea
                rows={2}
                value={siteUIConfig.admissionDescription}
                onChange={(e) => updateSiteUIConfig({ admissionDescription: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 7. FULL-WIDTH SECTION: KHOẢNH KHẮC CÙNG LỚP HỌC (KỶ NIỆM ĐÁNG NHỚ) */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE7D6]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-red-600" />
              <h4 className="font-serif font-black text-[19px] sm:text-[20px] text-[#18181B]">
                7. Khu Vực &ldquo;Khoảnh Khắc Cùng Lớp Học&rdquo; ({momentsList.length} thẻ kỷ niệm)
              </h4>
            </div>
            <p className="text-[13.5px] text-slate-600">
              Chỉnh sửa tiêu đề khu vực, thay ảnh từ máy tính hoặc URL, sửa nội dung từng kỷ niệm lớp học hoặc thêm khoảnh khắc mới.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                updateSiteUIConfig({
                  momentsSectionBadge: DEFAULT_SITE_UI_CONFIG.momentsSectionBadge,
                  momentsSectionTitle: DEFAULT_SITE_UI_CONFIG.momentsSectionTitle,
                  momentsSectionSubtitle: DEFAULT_SITE_UI_CONFIG.momentsSectionSubtitle,
                  classroomMoments: DEFAULT_CLASSROOM_MOMENTS,
                });
                triggerSavedNotice();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] text-[#18181B] hover:text-red-700 border border-[#E8DFCE] font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>Khôi phục 4 kỷ niệm mặc định</span>
            </button>

            <button
              type="button"
              onClick={handleAddMoment}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm khoảnh khắc mới</span>
            </button>
          </div>
        </div>

        {/* Section Heading Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
              Nhãn nhỏ phía trên (Badge):
            </label>
            <input
              type="text"
              value={siteUIConfig.momentsSectionBadge || ''}
              onChange={(e) => updateSiteUIConfig({ momentsSectionBadge: e.target.value })}
              placeholder="Ví dụ: KỶ NIỆM ĐÁNG NHỚ"
              className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
              Tiêu đề chính của khu vực:
            </label>
            <input
              type="text"
              value={siteUIConfig.momentsSectionTitle || ''}
              onChange={(e) => updateSiteUIConfig({ momentsSectionTitle: e.target.value })}
              placeholder="Ví dụ: Khoảnh Khắc Cùng Lớp Học"
              className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px] font-bold"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-[#18181B] mb-1">
              Mô tả phụ dưới tiêu đề:
            </label>
            <input
              type="text"
              value={siteUIConfig.momentsSectionSubtitle || ''}
              onChange={(e) => updateSiteUIConfig({ momentsSectionSubtitle: e.target.value })}
              placeholder="Mô tả ý nghĩa hoạt động lớp học..."
              className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF7] text-[13.5px]"
            />
          </div>
        </div>

        {/* Grid of Editable Classroom Moment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {momentsList.map((moment, idx) => (
            <div
              key={moment.id || `moment-editor-${idx}`}
              className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#E8DFCE] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[12px] font-extrabold">
                    Khoảnh khắc #{idx + 1}
                  </span>

                  {momentsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMoment(idx)}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-[#FFF5F3] text-[12px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Xóa khoảnh khắc này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa thẻ</span>
                    </button>
                  )}
                </div>

                {/* Image Preview & Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                  <div className="sm:col-span-5 aspect-16/11 rounded-xl overflow-hidden bg-white border border-[#E8DFCE]">
                    <img
                      src={moment.image}
                      alt={moment.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="sm:col-span-7 space-y-2">
                    <label className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#E8DFCE] hover:border-red-400 text-[12.5px] font-bold text-[#18181B] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-red-600" />
                      <span>Tải ảnh từ máy tính</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMomentImageUpload(e, idx)}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={moment.image?.startsWith('data:image/') ? '' : moment.image}
                      onChange={(e) => handleUpdateMoment(idx, { image: e.target.value })}
                      placeholder={
                        moment.image?.startsWith('data:image/')
                          ? 'Đã tải ảnh từ máy tính (dán link mới để thay)'
                          : 'Hoặc dán đường dẫn URL ảnh...'
                      }
                      className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12px]"
                    />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[12px] font-bold text-[#18181B] mb-1">
                      Tiêu đề khoảnh khắc:
                    </label>
                    <input
                      type="text"
                      value={moment.title}
                      onChange={(e) => handleUpdateMoment(idx, { title: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-white text-[13.5px] font-extrabold text-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#18181B] mb-1">
                      Mô tả ngắn hiển thị ngoài thẻ:
                    </label>
                    <input
                      type="text"
                      value={moment.subtitle}
                      onChange={(e) => handleUpdateMoment(idx, { subtitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-white text-[13px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[12px] font-bold text-[#18181B] mb-1">
                        Thời gian:
                      </label>
                      <input
                        type="text"
                        value={moment.date}
                        onChange={(e) => handleUpdateMoment(idx, { date: e.target.value })}
                        placeholder="Ví dụ: Tháng 10/2026"
                        className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12.5px] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#18181B] mb-1">
                        Địa điểm / Lớp học:
                      </label>
                      <input
                        type="text"
                        value={moment.location}
                        onChange={(e) => handleUpdateMoment(idx, { location: e.target.value })}
                        placeholder="Ví dụ: Cơ sở Hà Nội"
                        className="w-full p-2 rounded-xl border border-[#E8DFCE] bg-white text-[12.5px] font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#18181B] mb-1">
                      Nội dung chi tiết (hiển thị khi học viên bấm vào xem thẻ):
                    </label>
                    <textarea
                      rows={2}
                      value={moment.detail}
                      onChange={(e) => handleUpdateMoment(idx, { detail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-white text-[12.5px] leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sticky-Style Save Bar */}
      <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="font-sans font-extrabold text-[15px] text-[#18181B]">
            Xác nhận lưu cấu hình giao diện &amp; Logo
          </p>
          <p className="text-[13px] text-slate-600">
            {savedNotice
              ? savedText
              : hasUnsavedChanges
              ? 'Bạn có thay đổi mới chưa bấm xác nhận lưu.'
              : 'Nhấn Lưu thay đổi sau khi chỉnh sửa Logo, màu sắc hoặc nội dung trang.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              resetSiteUIConfig();
              triggerSavedNotice('Đã khôi phục giao diện & logo mặc định!');
            }}
            className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#FAF7F0] hover:bg-[#FFF5F3] text-[#18181B] hover:text-red-700 border border-[#E8DFCE] font-bold text-[13.5px] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-red-600" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleExplicitSave}
            className="px-6 py-2.5 min-h-[44px] rounded-2xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14.5px] flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
