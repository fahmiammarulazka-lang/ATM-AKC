/**
 * Panel Admin — Pusat Kelola Hutang Nasabah & Kontrol Risiko Kerugian Mining/Lelang
 * - Tambah hutang, kurangi hutang, set nominal pasti, lunasi/hapus total 1-klik
 * - Ubah / perpanjang tenggat waktu bayar (jam / menit) & cabut Banned Hutang 1 Hari
 * - Kontrol global peluang risiko kerugian Mining/Lelang/Bursa, persentase rugi, durasi tenggat,
 *   durasi auto-ban, dan sakelar opsional bunga denda keterlambatan
 */
import React, { useState } from 'react';
import {
  ReceiptText,
  Sliders,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Clock,
  ShieldOff,
  Search,
  AlertTriangle,
  Percent,
  Save,
  History,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

export const AdminDebtManagementTab: React.FC = () => {
  const {
    accounts,
    sultanEmpireConfig,
    adminUpdateSultanEmpireConfig,
    adminManageAccountDebt,
  } = useBank();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('500000');
  const [noteInput, setNoteInput] = useState<string>('');
  const [customHoursInput, setCustomHoursInput] = useState<string>('24');
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('5');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Global policy form state synced with sultanEmpireConfig (anti-reset dirty guard)
  const isPolicyDirtyRef = React.useRef<boolean>(false);
  const [lossRisk, setLossRisk] = useState<string>(String(sultanEmpireConfig.lossRiskPercent ?? 25));
  const [lossSeverity, setLossSeverity] = useState<string>(
    String(sultanEmpireConfig.lossSeverityPercent ?? 35)
  );
  const [defaultTermHours, setDefaultTermHours] = useState<string>(
    String(sultanEmpireConfig.debtDefaultTermHours ?? 24)
  );
  const [banHours, setBanHours] = useState<string>(
    String(sultanEmpireConfig.debtBanDurationHours ?? 24)
  );
  const [lateFeeEnabled, setLateFeeEnabled] = useState<boolean>(
    Boolean(sultanEmpireConfig.debtLateFeeEnabled)
  );
  const [lateFeePercent, setLateFeePercent] = useState<string>(
    String(sultanEmpireConfig.debtLateFeePercent ?? 5)
  );

  React.useEffect(() => {
    if (!isPolicyDirtyRef.current) {
      setLossRisk(String(sultanEmpireConfig.lossRiskPercent ?? 25));
      setLossSeverity(String(sultanEmpireConfig.lossSeverityPercent ?? 35));
      setDefaultTermHours(String(sultanEmpireConfig.debtDefaultTermHours ?? 24));
      setBanHours(String(sultanEmpireConfig.debtBanDurationHours ?? 24));
      setLateFeeEnabled(Boolean(sultanEmpireConfig.debtLateFeeEnabled));
      setLateFeePercent(String(sultanEmpireConfig.debtLateFeePercent ?? 5));
    }
  }, [sultanEmpireConfig]);

  const customerAccounts = accounts
    .filter((a) => a.id !== 'acc-admin')
    .filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        (a.googleEmail || a.email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (b.debtAmount || 0) - (a.debtAmount || 0));

  const activeAccount =
    customerAccounts.find((a) => a.id === selectedAccountId) || customerAccounts[0] || null;

  const totalDebtAllAccounts = accounts.reduce(
    (sum, a) => sum + Math.max(0, Math.round(a.debtAmount || 0)),
    0
  );
  const indebtedCount = accounts.filter((a) => (a.debtAmount || 0) > 0).length;
  const debtBannedCount = accounts.filter((a) => a.isDebtAutoBanned && a.cardStatus === 'banned').length;

  const parseNum = (raw: string, fallback: number, min: number, max: number) => {
    const trimmed = raw.trim();
    if (trimmed === '') return min;
    const n = Number(trimmed);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  const handleSaveGlobalPolicy = () => {
    const res = adminUpdateSultanEmpireConfig({
      lossRiskPercent: parseNum(lossRisk, 0, 0, 80),
      lossSeverityPercent: parseNum(lossSeverity, 35, 0, 100),
      debtDefaultTermHours: parseNum(defaultTermHours, 24, 1, 720),
      debtBanDurationHours: parseNum(banHours, 24, 1, 720),
      debtLateFeeEnabled: lateFeeEnabled,
      debtLateFeePercent: parseNum(lateFeePercent, 0, 0, 50),
    });
    isPolicyDirtyRef.current = false;
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const runDebtAction = (
    accId: string,
    action:
      | 'add'
      | 'reduce'
      | 'set'
      | 'forgive'
      | 'extend_deadline'
      | 'set_deadline_minutes'
      | 'lift_debt_ban',
    payload?: { amount?: number; note?: string; hours?: number; minutes?: number }
  ) => {
    const res = adminManageAccountDebt(accId, action, {
      ...payload,
      note: payload?.note ?? noteInput,
    });
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) setNoteInput('');
  };

  const numericAmount = Math.max(0, Number(amountInput.replace(/[^\d]/g, '')) || 0);

  return (
    <div className="space-y-6">
      {/* KPI Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Total Hutang Beredar</span>
          <div className="text-xl font-black font-mono text-rose-400 mt-1 tabular-nums">
            {formatRupiah(totalDebtAllAccounts)}
          </div>
          <span className="text-[11px] text-slate-400">{indebtedCount} rekening memiliki hutang aktif</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Risiko Rugi Mining &amp; Lelang</span>
          <div className="text-xl font-black font-mono text-amber-300 mt-1 tabular-nums">
            {sultanEmpireConfig.lossRiskPercent ?? 25}% Peluang • {sultanEmpireConfig.lossSeverityPercent ?? 35}% Rugi
          </div>
          <span className="text-[11px] text-slate-400">
            Tenggat {sultanEmpireConfig.debtDefaultTermHours ?? 24} Jam • Bunga Denda:{' '}
            {sultanEmpireConfig.debtLateFeeEnabled
              ? `AKTIF (${sultanEmpireConfig.debtLateFeePercent ?? 5}%)`
              : 'NONAKTIF (Pokok Murni)'}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/40">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Terkena Auto-Ban Hutang</span>
          <div className="text-xl font-black font-mono text-red-400 mt-1 tabular-nums">
            {debtBannedCount} Akun
          </div>
          <span className="text-[11px] text-slate-400">
            Sanksi default {sultanEmpireConfig.debtBanDurationHours ?? 24} Jam (1 Hari)
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Bagian 1: Pengaturan Global Risiko Kerugian & Kebijakan Hutang */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Kontrol Global Risiko Kerugian Mining/Lelang &amp; Kebijakan Hutang
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur peluang rugi, besaran kerugian, durasi kesepakatan bayar, durasi Auto-Ban, serta bunga denda opsional.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveGlobalPolicy}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Kebijakan Global</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <label className="font-bold text-slate-200 block">
              Peluang Rugi Mining/Lelang (%)
            </label>
            <input
              type="number"
              min={0}
              max={80}
              value={lossRisk}
              onChange={(e) => {
                isPolicyDirtyRef.current = true;
                setLossRisk(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
            <span className="text-[10px] text-slate-400">0% = bebas rugi, bawaan 25% (seimbang)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <label className="font-bold text-slate-200 block">
              Persentase Besaran Rugi (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={lossSeverity}
              onChange={(e) => {
                isPolicyDirtyRef.current = true;
                setLossSeverity(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
            <span className="text-[10px] text-slate-400">Default 35% dari nilai aktivitas</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <label className="font-bold text-slate-200 block">
              Tenggat Kesepakatan (Jam)
            </label>
            <input
              type="number"
              min={1}
              max={720}
              value={defaultTermHours}
              onChange={(e) => {
                isPolicyDirtyRef.current = true;
                setDefaultTermHours(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
            <span className="text-[10px] text-slate-400">Bawaan 24 jam sejak hutang tercatat</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <label className="font-bold text-slate-200 block">
              Durasi Auto-Ban Jatuh Tempo (Jam)
            </label>
            <input
              type="number"
              min={1}
              max={720}
              value={banHours}
              onChange={(e) => {
                isPolicyDirtyRef.current = true;
                setBanHours(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
            <span className="text-[10px] text-slate-400">Bawaan 24 jam (1 Hari)</span>
          </div>
        </div>

        {/* Sakelar Opsional Bunga Denda */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Percent className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Bunga Denda Keterlambatan (Opsional)</div>
              <div className="text-[11px] text-slate-400">
                Secara bawaan nonaktif (pokok hutang murni). Aktifkan jika ingin menambahkan bunga denda saat mendekati jatuh tempo.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                isPolicyDirtyRef.current = true;
                setLateFeeEnabled((v) => !v);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                lateFeeEnabled
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {lateFeeEnabled ? 'Bunga Denda: AKTIF' : 'Bunga Denda: NONAKTIF'}
            </button>
            {lateFeeEnabled && (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={lateFeePercent}
                  onChange={(e) => {
                    isPolicyDirtyRef.current = true;
                    setLateFeePercent(e.target.value);
                  }}
                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
                <span className="text-slate-300 font-bold">%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bagian 2: Kelola Hutang Per Akun Nasabah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daftar Akun */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama nasabah, no. rekening, email..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {customerAccounts.map((acc) => {
              const debt = Math.max(0, Math.round(acc.debtAmount || 0));
              const isSelected = activeAccount?.id === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500/70'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-white truncate">{acc.fullName}</span>
                    {acc.isDebtAutoBanned && acc.cardStatus === 'banned' ? (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-black">
                        BAN HUTANG
                      </span>
                    ) : debt > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                        {formatRupiah(debt)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400">Bebas Hutang</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>Rek: {acc.accountNumber}</span>
                    <span>Saldo: {formatRupiah(acc.balance)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Aksi Lengkap Untuk Akun Terpilih */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-5">
          {!activeAccount ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Pilih rekening nasabah di sebelah kiri untuk mengelola hutangnya.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-rose-300 uppercase font-bold">
                    KELOLA HUTANG REKENING TERPILIH
                  </span>
                  <h4 className="text-lg font-black text-white">
                    {activeAccount.fullName}{' '}
                    <span className="text-xs font-mono text-slate-400">
                      ({activeAccount.accountNumber})
                    </span>
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Tenggat aktif:{' '}
                    <strong className="text-amber-300">
                      {activeAccount.debtDueAt
                        ? new Date(activeAccount.debtDueAt).toLocaleString('id-ID')
                        : 'Tidak ada tenggat aktif'}
                    </strong>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Hutang Saat Ini</div>
                  <div
                    className={`text-xl font-black tabular-nums ${
                      (activeAccount.debtAmount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatRupiah(Math.round(activeAccount.debtAmount || 0))}
                  </div>
                </div>
              </div>

              {/* Input Nominal & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nominal Hutang (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="Contoh: 1000000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Catatan / Alasan Admin (Opsional)</label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="Mis. Koreksi tagihan lelang / keringanan"
                  />
                </div>
              </div>

              {/* Tombol Preset Nominal Cepat */}
              <div className="flex flex-wrap gap-1.5">
                {[100_000, 500_000, 1_000_000, 5_000_000, 25_000_000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountInput(String(v))}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    {formatRupiah(v)}
                  </button>
                ))}
              </div>

              {/* Aksi Utama Nominal Hutang */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    runDebtAction(activeAccount.id, 'add', {
                      amount: numericAmount,
                      hours: Number(customHoursInput) || parseNum(defaultTermHours, 24, 1, 720),
                    })
                  }
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Tambah</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runDebtAction(activeAccount.id, 'reduce', { amount: numericAmount })
                  }
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MinusCircle className="w-4 h-4 shrink-0" />
                  <span>Kurangi</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runDebtAction(activeAccount.id, 'set', { amount: numericAmount })
                  }
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ReceiptText className="w-4 h-4 shrink-0" />
                  <span>Set Pasti</span>
                </button>
                <button
                  type="button"
                  onClick={() => runDebtAction(activeAccount.id, 'forgive')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Lunasi 0</span>
                </button>
              </div>

              {/* Aksi Waktu Kesepakatan & Cabut Banned Hutang */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Atur / Perpanjang Tenggat Waktu &amp; Cabut Auto-Ban Hutang</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[1, 6, 24, 72].map((hr) => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() =>
                        runDebtAction(activeAccount.id, 'extend_deadline', { hours: hr })
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-200 font-mono text-[11px] font-bold cursor-pointer"
                    >
                      +{hr === 72 ? '3 Hari' : `${hr} Jam`}
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        runDebtAction(activeAccount.id, 'set_deadline_minutes', {
                          minutes: Math.max(1, Number(customMinutesInput) || 5),
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Set Menit Ini
                    </button>
                  </div>
                </div>

                {(activeAccount.cardStatus === 'banned' || activeAccount.status === 'banned') && (
                  <button
                    type="button"
                    onClick={() =>
                      runDebtAction(activeAccount.id, 'lift_debt_ban', {
                        hours: parseNum(defaultTermHours, 24, 1, 720),
                      })
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldOff className="w-4 h-4" />
                    <span>Cabut Banned Hutang 1 Hari Sekarang (+Tenggat {defaultTermHours} Jam)</span>
                  </button>
                )}
              </div>

              {/* Riwayat Singkat Hutang Akun */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Log Hutang Akun Ini ({(activeAccount.debtHistory || []).length})</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {(activeAccount.debtHistory || []).slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-200 truncate">{entry.sourceLabel}</div>
                        <div className="text-slate-400 truncate">{entry.note}</div>
                      </div>
                      <span
                        className={`font-mono font-bold shrink-0 ${
                          entry.amount > 0
                            ? 'text-rose-400'
                            : entry.amount < 0
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {entry.amount > 0
                          ? `+${formatRupiah(entry.amount)}`
                          : entry.amount < 0
                          ? `-${formatRupiah(Math.abs(entry.amount))}`
                          : 'INFO'}
                      </span>
                    </div>
                  ))}
                  {(activeAccount.debtHistory || []).length === 0 && (
                    <div className="text-[11px] text-slate-500 italic">Belum ada riwayat hutang.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
