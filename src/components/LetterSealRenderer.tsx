import React, { useEffect, useRef, useState } from 'react';
import {
  Crown,
  ShieldCheck,
  Award,
  Sparkles,
  Trash2,
  PenTool,
  Type,
  Stamp,
  Star,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import {
  LetterSignatureStampConfig,
  SealColorTheme,
  SignatureTemplateId,
  StampTemplateId,
} from '../types/bank';
import {
  compressCanvasToSignatureDataUrl,
  compressSignatureDataUrl,
  estimateDataUrlKb,
} from '../utils/signatureCompression';

export const DEFAULT_LETTER_SEAL_CONFIG: LetterSignatureStampConfig = {
  signatureMode: 'template',
  signatureDrawingDataUrl: '',
  signatureTemplateId: 'kaligrafi_royal',
  signatureName: 'Admin Utama Bank Nusantara',
  signatureColor: 'amber',
  stampTemplateId: 'royal_wax',
  stampPrimaryName: 'BANK NUSANTARA',
  stampSecondaryName: 'RESMI • TERVERIFIKASI',
  stampColor: 'amber',
};

export const SEAL_COLOR_OPTIONS: {
  id: SealColorTheme;
  label: string;
  hex: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
}[] = [
  {
    id: 'amber',
    label: 'Emas Royal',
    hex: '#fbbf24',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/80',
    bgClass: 'bg-amber-500/15',
  },
  {
    id: 'white',
    label: 'Putih Perak',
    hex: '#f8fafc',
    textClass: 'text-slate-100',
    borderClass: 'border-slate-200/80',
    bgClass: 'bg-slate-200/10',
  },
  {
    id: 'cyan',
    label: 'Biru Cyber',
    hex: '#38bdf8',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/80',
    bgClass: 'bg-cyan-500/15',
  },
  {
    id: 'emerald',
    label: 'Hijau Zamrud',
    hex: '#34d399',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/80',
    bgClass: 'bg-emerald-500/15',
  },
  {
    id: 'rose',
    label: 'Merah Crimson',
    hex: '#fb7185',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-400/80',
    bgClass: 'bg-rose-500/15',
  },
];

export const getSealColorMeta = (c?: SealColorTheme) =>
  SEAL_COLOR_OPTIONS.find((x) => x.id === c) || SEAL_COLOR_OPTIONS[0];

export const SIGNATURE_TEMPLATES_5: {
  id: SignatureTemplateId;
  name: string;
  previewClass: string;
  prefix?: string;
  suffix?: string;
}[] = [
  {
    id: 'kaligrafi_royal',
    name: '1. Royal Kaligrafi',
    previewClass: 'font-serif italic text-xl sm:text-2xl tracking-wide',
  },
  {
    id: 'kursif_klasik',
    name: '2. Kursif Tulisan Tangan',
    previewClass: 'font-serif italic font-light text-2xl tracking-[0.08em] -rotate-2',
  },
  {
    id: 'modern_eksekutif',
    name: '3. Eksekutif Tegas',
    previewClass: 'font-sans font-black uppercase text-base sm:text-lg tracking-[0.2em]',
  },
  {
    id: 'minimalis_tajam',
    name: '4. Monogram Digital',
    previewClass: 'font-mono font-extrabold text-base sm:text-lg tracking-[0.14em]',
  },
  {
    id: 'aristokrat_garis',
    name: '5. Aristokrat Hias Emas',
    previewClass: 'font-serif italic font-semibold text-xl tracking-wider',
    prefix: '✦ ',
    suffix: ' ✦',
  },
];

export const STAMP_TEMPLATES_5: {
  id: StampTemplateId;
  name: string;
  subtitle: string;
}[] = [
  { id: 'bulat_resmi', name: '1. Bulat Resmi', subtitle: 'Lingkaran ganda klasik' },
  { id: 'royal_wax', name: '2. Royal Wax Seal', subtitle: 'Segel lilin kerajaan' },
  { id: 'oval_notaris', name: '3. Oval Notaris', subtitle: 'Akta oval formal' },
  { id: 'perisai_vip', name: '4. Perisai VIP', subtitle: 'Lambang perisai pelindung' },
  { id: 'bintang_emas', name: '5. Bintang Emas', subtitle: 'Cap penghargaan sultan' },
];

export const OfficialStampBadge: React.FC<{
  config: LetterSignatureStampConfig;
  compact?: boolean;
}> = ({ config, compact = false }) => {
  const col = getSealColorMeta(config.stampColor);
  const primary = (config.stampPrimaryName || 'BANK NUSANTARA').toUpperCase();
  const secondary = (config.stampSecondaryName || 'RESMI • TERVERIFIKASI').toUpperCase();
  const tpl = config.stampTemplateId || 'royal_wax';

  const glowStyle: Record<SealColorTheme, string> = {
    amber: 'shadow-[0_0_28px_rgba(251,191,36,0.45),inset_0_0_16px_rgba(251,191,36,0.28)] ring-2 ring-amber-300/50',
    white: 'shadow-[0_0_26px_rgba(248,250,252,0.35),inset_0_0_14px_rgba(248,250,252,0.22)] ring-2 ring-slate-200/50',
    cyan: 'shadow-[0_0_28px_rgba(56,189,248,0.45),inset_0_0_16px_rgba(56,189,248,0.28)] ring-2 ring-cyan-300/50',
    emerald: 'shadow-[0_0_28px_rgba(52,211,153,0.45),inset_0_0_16px_rgba(52,211,153,0.28)] ring-2 ring-emerald-300/50',
    rose: 'shadow-[0_0_28px_rgba(251,113,133,0.45),inset_0_0_16px_rgba(251,113,133,0.28)] ring-2 ring-rose-300/50',
  };
  const activeGlow = glowStyle[config.stampColor || 'amber'] || glowStyle.amber;

  if (tpl === 'oval_notaris') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center rounded-[50%] border-[3px] border-double ${col.borderClass} ${col.bgClass} ${col.textClass} ${activeGlow} -rotate-6 select-none transition-transform duration-300 hover:scale-105 ${
          compact ? 'px-3.5 py-2 min-w-[116px]' : 'px-6 py-3.5 min-w-[172px]'
        }`}
      >
        <div
          className={`w-full border border-dashed ${col.borderClass} rounded-[50%] px-3 py-1.5 text-center relative overflow-hidden`}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5 opacity-90">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span className="text-[7px] font-mono font-black tracking-[0.22em] uppercase">
              AKTA RESMI
            </span>
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
          <span
            className={`${
              compact ? 'text-[10px]' : 'text-xs'
            } font-black tracking-wider block drop-shadow`}
          >
            {primary}
          </span>
          <span className="text-[7px] font-mono font-bold tracking-widest block opacity-90 mt-0.5">
            ✦ {secondary} ✦
          </span>
        </div>
      </div>
    );
  }

  if (tpl === 'perisai_vip') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center rounded-t-2xl rounded-b-[2.2rem] border-[3px] border-double ${col.borderClass} ${col.bgClass} ${col.textClass} ${activeGlow} -rotate-3 select-none text-center transition-transform duration-300 hover:scale-105 ${
          compact ? 'w-22 py-2 px-2' : 'w-32 py-3.5 px-3'
        }`}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <Star className="w-2.5 h-2.5 fill-current opacity-80" />
          <ShieldCheck className={compact ? 'w-4 h-4' : 'w-6 h-6'} />
          <Star className="w-2.5 h-2.5 fill-current opacity-80" />
        </div>
        <span className="text-[6.5px] font-mono font-black tracking-[0.18em] leading-tight opacity-90 truncate max-w-full">
          {secondary}
        </span>
        <div className={`w-4/5 border-t ${col.borderClass} my-0.5 opacity-60`} />
        <span
          className={`${
            compact ? 'text-[8.5px]' : 'text-[10.5px]'
          } font-black tracking-wider leading-tight truncate max-w-full drop-shadow`}
        >
          {primary}
        </span>
        {!compact && (
          <span className="text-[6px] font-mono tracking-widest opacity-80 mt-0.5">
            ★ ROYAL SHIELD ★
          </span>
        )}
      </div>
    );
  }

  if (tpl === 'bintang_emas') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center rounded-2xl border-[3px] border-double ${col.borderClass} ${col.bgClass} ${col.textClass} ${activeGlow} rotate-2 select-none text-center transition-transform duration-300 hover:scale-105 ${
          compact ? 'px-3 py-2' : 'px-5 py-3'
        }`}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <Star className="w-3 h-3 fill-current" />
          <Crown className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          <Award className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          <Star className="w-3 h-3 fill-current" />
        </div>
        <span
          className={`${
            compact ? 'text-[9px]' : 'text-xs'
          } font-black tracking-wider block drop-shadow`}
        >
          {primary}
        </span>
        <div className={`w-full border-t border-dashed ${col.borderClass} my-0.5 opacity-60`} />
        <span className="text-[7px] font-mono font-bold tracking-[0.2em] block opacity-90">
          ★ {secondary} ★
        </span>
      </div>
    );
  }

  if (tpl === 'royal_wax') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center rounded-full border-4 border-double ${col.borderClass} ${col.bgClass} ${col.textClass} ${activeGlow} -rotate-6 select-none text-center transition-transform duration-300 hover:scale-105 ${
          compact ? 'w-18 h-18 p-1.5' : 'w-28 h-28 p-2.5'
        }`}
      >
        {/* Inner serrated micro-ring */}
        <div
          className={`pointer-events-none absolute inset-1 rounded-full border border-dashed ${col.borderClass} opacity-75`}
        />
        <div className="flex items-center gap-0.5 mb-0.5 relative z-10">
          <Star className="w-2.5 h-2.5 fill-current opacity-85" />
          <Crown className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
          <Star className="w-2.5 h-2.5 fill-current opacity-85" />
        </div>
        <span
          className={`relative z-10 ${
            compact ? 'text-[7.5px]' : 'text-[9.5px]'
          } font-black leading-tight tracking-wider truncate max-w-full drop-shadow`}
        >
          {primary}
        </span>
        <span className="relative z-10 text-[6px] font-mono font-bold leading-tight opacity-90 truncate max-w-full mt-0.5">
          {secondary}
        </span>
        {!compact && (
          <span className="relative z-10 text-[5.5px] font-mono font-black tracking-[0.22em] opacity-80 mt-0.5">
            • SULTAN SEAL •
          </span>
        )}
      </div>
    );
  }

  // Default: 'bulat_resmi'
  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center rounded-full border-[3px] border-dashed ${col.borderClass} ${col.bgClass} ${col.textClass} ${activeGlow} -rotate-6 select-none text-center transition-transform duration-300 hover:scale-105 ${
        compact ? 'w-18 h-18 p-1.5' : 'w-28 h-28 p-2.5'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-1.5 rounded-full border ${col.borderClass} opacity-60`}
      />
      <ShieldCheck className={`relative z-10 ${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
      <span className="relative z-10 text-[6px] font-mono font-bold uppercase tracking-widest mt-0.5 truncate max-w-full">
        {secondary}
      </span>
      <span
        className={`relative z-10 ${
          compact ? 'text-[7.5px]' : 'text-[9.5px]'
        } font-black uppercase tracking-wider leading-tight truncate max-w-full drop-shadow`}
      >
        {primary}
      </span>
      {!compact && (
        <span className="relative z-10 text-[5.5px] font-mono tracking-widest opacity-80 mt-0.5">
          ★ VERIFIED ★
        </span>
      )}
    </div>
  );
};

export const OfficialSignatureBlock: React.FC<{
  config: LetterSignatureStampConfig;
  fallbackSenderName?: string;
}> = ({ config, fallbackSenderName }) => {
  const sigColor = getSealColorMeta(config.signatureColor);
  const sigTpl =
    SIGNATURE_TEMPLATES_5.find((t) => t.id === config.signatureTemplateId) ||
    SIGNATURE_TEMPLATES_5[0];
  const displayName = config.signatureName?.trim() || fallbackSenderName || 'Admin Bank Nusantara';

  return (
    <div className="text-right min-w-[200px] flex flex-col items-end bg-slate-950/65 px-4 py-2.5 rounded-2xl border border-amber-400/35 shadow-inner">
      <span className="text-[9.5px] text-amber-300/90 font-mono uppercase tracking-wider flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Otorisasi &amp; Tanda Tangan Resmi:</span>
      </span>

      <div className="min-h-[58px] flex items-center justify-end py-1.5 border-b-2 border-double border-amber-400/60 w-full">
        {config.signatureMode === 'draw' && config.signatureDrawingDataUrl ? (
          <img
            src={config.signatureDrawingDataUrl}
            alt={`Tanda tangan ${displayName}`}
            className="h-14 max-w-[210px] object-contain ml-auto drop-shadow-[0_2px_8px_rgba(251,191,36,0.35)]"
          />
        ) : (
          <div className={`${sigTpl.previewClass} ${sigColor.textClass} select-none drop-shadow`}>
            {sigTpl.prefix || ''}
            {displayName}
            {sigTpl.suffix || ''}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-1">
        <Crown className="w-3 h-3 text-amber-400" />
        <span className="text-[11px] font-black text-white tracking-wide">{displayName}</span>
      </div>
      <span className="text-[8.5px] font-mono text-emerald-300/90 uppercase tracking-widest">
        ✓ Digital Royal Signature Verified
      </span>
    </div>
  );
};

interface LetterSealStudioEditorProps {
  value: LetterSignatureStampConfig;
  onChange: (next: LetterSignatureStampConfig) => void;
}

export const LetterSealStudioEditor: React.FC<LetterSealStudioEditorProps> = ({
  value,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(3.5);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const inkColor = getSealColorMeta(value.signatureColor);

  // Restore existing drawing or uploaded photo onto the canvas whenever mode or dataUrl updates
  useEffect(() => {
    if (isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas || value.signatureMode !== 'draw') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (value.signatureDrawingDataUrl) {
      const img = new Image();
      img.onload = () => {
        if (isDrawingRef.current) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / Math.max(1, img.width), canvas.height / Math.max(1, img.height));
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = (canvas.width - drawW) / 2;
        const offsetY = (canvas.height - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      };
      img.src = value.signatureDrawingDataUrl;
    }
  }, [value.signatureMode, value.signatureDrawingDataUrl]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar/foto (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran foto tanda tangan maksimal 5 MB.');
      return;
    }
    setUploadError('');
    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string' && result) {
          const compressed = await compressSignatureDataUrl(result, 44000);
          onChange({
            ...value,
            signatureMode: 'draw',
            signatureDrawingDataUrl: compressed.dataUrl,
          });
          setAutoSaveStatus(
            `✓ Foto tanda tangan terkompresi (${compressed.kbText}) & siap disimpan ke Cloud`
          );
        }
      } finally {
        setIsProcessingImage(false);
      }
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      setUploadError('Gagal membaca file gambar tanda tangan.');
    };
    reader.readAsDataURL(file);
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;
    isDrawingRef.current = true;
    setIsDrawing(true);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = inkColor.hex;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasPoint(e);
    ctx.strokeStyle = inkColor.hex;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPointRef.current = pt;
  };

  const finalizeStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const compressed = compressCanvasToSignatureDataUrl(canvas, 44000);
      onChange({
        ...value,
        signatureMode: 'draw',
        signatureDrawingDataUrl: compressed.dataUrl,
      });
      setAutoSaveStatus(
        `✓ Goresan tanda tangan terkompresi (${compressed.kbText}) & siap disimpan ke Cloud`
      );
    }
  };

  const clearCanvas = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange({
      ...value,
      signatureDrawingDataUrl: '',
    });
    setAutoSaveStatus('');
    setUploadError('');
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: SIGNATURE STUDIO (DRAW OR 5 TEMPLATES) */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-400/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <span className="font-black text-amber-300 flex items-center gap-1.5">
              <PenTool className="w-4 h-4" />
              <span>1. Tanda Tangan Pengirim</span>
            </span>

            <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onChange({ ...value, signatureMode: 'draw' })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1 ${
                  value.signatureMode === 'draw'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <PenTool className="w-3 h-3" />
                <span>Gambar Bebas</span>
              </button>
              <label className="px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
                <ImageIcon className="w-3 h-3" />
                <span>Pilih Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange({ ...value, signatureMode: 'template' })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1 ${
                  value.signatureMode === 'template'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Type className="w-3 h-3" />
                <span>5 Template Huruf</span>
              </button>
            </div>
          </div>

          {(isProcessingImage || autoSaveStatus || (value.signatureMode === 'draw' && value.signatureDrawingDataUrl)) && (
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold flex items-center justify-between gap-2">
              <span>
                {isProcessingImage
                  ? '⏳ Mengompresi gambar tanda tangan agar tersimpan ringan di Cloud...'
                  : autoSaveStatus ||
                    `✓ Tanda tangan gambar aktif (${estimateDataUrlKb(value.signatureDrawingDataUrl)})`}
              </span>
              <span className="font-mono text-[9px] text-emerald-400/90 uppercase shrink-0">
                Siap Cloud ({estimateDataUrlKb(value.signatureDrawingDataUrl)})
              </span>
            </div>
          )}

          {uploadError && (
            <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-300 text-[10px] font-bold">
              {uploadError}
            </div>
          )}

          {/* Nama di bawah tanda tangan */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              Nama Tanda Tangan (Dapat Di-setting Bebas)
            </label>
            <input
              type="text"
              value={value.signatureName}
              onChange={(e) => onChange({ ...value, signatureName: e.target.value })}
              placeholder="Contoh: CEO Bank Nusantara"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
            />
          </div>

          {/* Warna Tinta Tanda Tangan */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 mr-1">Warna Tinta:</span>
            {SEAL_COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ ...value, signatureColor: c.id })}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                  value.signatureColor === c.id
                    ? 'bg-slate-800 border-white text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {value.signatureMode === 'draw' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Tebal Pena:</span>
                  {[
                    { size: 2, label: 'Tipis' },
                    { size: 3.5, label: 'Sedang' },
                    { size: 6.5, label: 'Tebal' },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setBrushSize(b.size)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                        brushSize === b.size
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap">
                    <Upload className="w-3 h-3" />
                    <span>Pilih Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-amber-400/50 bg-[#0b101d] overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={160}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finalizeStroke}
                  onPointerCancel={finalizeStroke}
                  onPointerLeave={finalizeStroke}
                  className="w-full h-36 cursor-crosshair touch-none block"
                />
                {!value.signatureDrawingDataUrl && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-slate-500 font-mono">
                    Gambar tanda tangan di sini atau pilih foto...
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 block">
                Pilih 1 dari 5 Template Huruf Tanda Tangan:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {SIGNATURE_TEMPLATES_5.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onChange({ ...value, signatureTemplateId: tpl.id })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer flex items-center justify-between gap-2 transition-all ${
                      value.signatureTemplateId === tpl.id
                        ? 'bg-amber-950/50 border-amber-400 text-white'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {tpl.name}
                    </span>
                    <span className={`${tpl.previewClass} ${inkColor.textClass} truncate`}>
                      {tpl.prefix || ''}
                      {value.signatureName || 'Admin Bank Nusantara'}
                      {tpl.suffix || ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: 5 STAMP TEMPLATES + CUSTOM NAMES */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-400/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-black text-emerald-300 flex items-center gap-1.5">
              <Stamp className="w-4 h-4" />
              <span>2. Stempel Surat Resmi (5 Template)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">
                Nama Utama Stempel
              </label>
              <input
                type="text"
                value={value.stampPrimaryName}
                onChange={(e) => onChange({ ...value, stampPrimaryName: e.target.value })}
                placeholder="Contoh: BANK NUSANTARA"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">
                Sub-Teks Stempel
              </label>
              <input
                type="text"
                value={value.stampSecondaryName}
                onChange={(e) => onChange({ ...value, stampSecondaryName: e.target.value })}
                placeholder="Contoh: RESMI • TERVERIFIKASI"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-200 font-bold uppercase"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 mr-1">Warna Stempel:</span>
            {SEAL_COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ ...value, stampColor: c.id })}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                  value.stampColor === c.id
                    ? 'bg-slate-800 border-white text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* 5 Stamp Template Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STAMP_TEMPLATES_5.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onChange({ ...value, stampTemplateId: tpl.id })}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  value.stampTemplateId === tpl.id
                    ? 'bg-emerald-950/50 border-emerald-400 shadow-lg'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                }`}
              >
                <OfficialStampBadge
                  compact
                  config={{ ...value, stampTemplateId: tpl.id }}
                />
                <span className="text-[10px] font-black text-white text-center leading-tight">
                  {tpl.name}
                </span>
              </button>
            ))}
          </div>

          {/* Live Combined Footer Preview */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1f1708] via-[#0c1222] to-[#171107] border border-amber-400/50 space-y-2">
            <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Pratinjau Gabungan di Kaki Surat Royal:</span>
            </span>
            <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
              <OfficialStampBadge config={value} />
              <OfficialSignatureBlock config={value} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
