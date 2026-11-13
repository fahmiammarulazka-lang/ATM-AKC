/**
 * Bank Nusantara PayChat — Perpesanan Antar Nomor Rekening & Telepon
 * Memungkinkan chatan langsung antara "Saya" dan "Teman Saya" (atau nomor lainnya)
 * Dilengkapi fitur transfer langsung di dalam chat dan minta uang (split bill)
 */
import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  PlusCircle,
  Search,
  DollarSign,
  ArrowRight,
  CheckCheck,
  User,
  Phone,
  CreditCard,
  Building,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { ChatMessage } from '../types/bank';
import { formatRupiah, formatIndoDate, playAtmSound } from '../utils/bankUtils';
import { PinPromptModal } from './PinPromptModal';

export const NusantaraChat: React.FC = () => {
  const { currentAccount, accounts, chats, sendChatMessage, transferMoney } = useBank();

  const [activeRecipientAccount, setActiveRecipientAccount] = useState<string>('5566778899'); // Farhan (Teman Saya)
  const [messageText, setMessageText] = useState<string>('');
  const [searchContact, setSearchContact] = useState<string>('');
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatInputNumber, setNewChatInputNumber] = useState<string>('');

  // In-chat transfer modal state
  const [showSendMoneyModal, setShowSendMoneyModal] = useState<boolean>(false);
  const [transferAmountInput, setTransferAmountInput] = useState<string>('');
  const [transferNoteInput, setTransferNoteInput] = useState<string>('');
  const [isRequestMoney, setIsRequestMoney] = useState<boolean>(false);

  // Secure PIN prompt for card-based transfer
  const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);

  if (!currentAccount) return null;

  // Get recipient account details
  const activeRecipient =
    accounts.find(
      (a) =>
        a.accountNumber === activeRecipientAccount ||
        a.phone === activeRecipientAccount
    ) || {
      id: 'custom',
      accountNumber: activeRecipientAccount,
      fullName: 'Farhan Pratama (Teman Saya)',
      phone: '081234567899',
      balance: 0,
      cardTier: 'gold' as const,
      cardNumber: '5392 7741 2290 8110',
      cvv: '512',
      expiryDate: '10/31',
      cardStatus: 'active' as const,
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: 0,
      createdAt: '',
      nik: '',
      address: '',
      pin: '',
    };

  // Filter messages between current user and active recipient
  const activeThread = chats.filter(
    (c) =>
      (c.senderAccount === currentAccount.accountNumber &&
        (c.recipientAccount === activeRecipientAccount ||
          c.recipientAccount === activeRecipient.accountNumber)) ||
      (c.recipientAccount === currentAccount.accountNumber &&
        (c.senderAccount === activeRecipientAccount ||
          c.senderAccount === activeRecipient.accountNumber))
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendChatMessage({
      recipientAccount: activeRecipient.accountNumber,
      recipientName: activeRecipient.fullName,
      text: messageText.trim(),
    });

    setMessageText('');
    playAtmSound('beep');
  };

  const handleStartInChatTransfer = (asRequest: boolean) => {
    setIsRequestMoney(asRequest);
    setTransferAmountInput('');
    setTransferNoteInput('');
    setShowSendMoneyModal(true);
  };

  const handleConfirmSendMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(transferAmountInput, 10);
    if (!amt || amt <= 0) return;

    if (isRequestMoney) {
      // Just post a money request bubble
      sendChatMessage({
        recipientAccount: activeRecipient.accountNumber,
        recipientName: activeRecipient.fullName,
        text: `Minta uang: ${formatRupiah(amt)} untuk "${transferNoteInput || 'Patungan'}"`,
        transferAttachment: {
          amount: amt,
          referenceNo: `REQ-${Date.now()}`,
          note: transferNoteInput || 'Permintaan uang patungan',
          isRequest: true,
          status: 'pending',
        },
      });
      setShowSendMoneyModal(false);
    } else {
      // Direct transfer requires PIN prompt!
      setShowSendMoneyModal(false);
      setShowPinPrompt(true);
    }
  };

  const executeTransferAfterPin = () => {
    setShowPinPrompt(false);
    const amt = parseInt(transferAmountInput, 10);
    const res = transferMoney({
      recipientAccount: activeRecipient.accountNumber,
      recipientBank: 'Bank Nusantara',
      amount: amt,
      note: transferNoteInput || 'Transfer lewat Nusantara Chat',
      pin: currentAccount.pin,
    });

    if (res.success && res.transaction) {
      sendChatMessage({
        recipientAccount: activeRecipient.accountNumber,
        recipientName: activeRecipient.fullName,
        text: `Telah mentransfer ${formatRupiah(amt)} melalui Nusantara Chat`,
        transferAttachment: {
          amount: amt,
          referenceNo: res.transaction.referenceNo,
          note: transferNoteInput || 'Transfer dana',
        },
      });
    } else {
      alert(res.message);
    }
  };

  // Contacts list
  const contactAccounts = accounts.filter((a) => a.id !== currentAccount.id);

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px]">
      {/* LEFT SIDEBAR: CONTACT LIST */}
      <div className="w-full md:w-80 border-r border-slate-800 flex flex-col justify-between bg-slate-950/70">
        <div>
          {/* User profile header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {currentAccount.fullName.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-white text-xs block truncate max-w-[140px]">
                  {currentAccount.fullName}
                </span>
                <span className="text-[10px] text-amber-300 font-mono block">
                  Rek. {currentAccount.accountNumber}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Chat Nomor Baru"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Search box */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nomor HP atau rekening..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contacts list */}
          <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto">
            {contactAccounts
              .filter(
                (c) =>
                  c.fullName.toLowerCase().includes(searchContact.toLowerCase()) ||
                  c.accountNumber.includes(searchContact) ||
                  c.phone.includes(searchContact)
              )
              .map((c) => {
                const isSelected =
                  activeRecipientAccount === c.accountNumber ||
                  activeRecipientAccount === c.phone;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveRecipientAccount(c.accountNumber)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-slate-700">
                      {c.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate max-w-[130px]">
                          {c.fullName}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-mono">Online</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        No. Rek: {c.accountNumber} • HP: {c.phone}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-3 bg-blue-950/40 border-t border-slate-800 text-[10px] text-blue-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Kirim pesan & transfer uang langsung antar nasabah Bank Nusantara.</span>
        </div>
      </div>

      {/* RIGHT CHAT WINDOW */}
      <div className="flex-1 flex flex-col justify-between bg-slate-900/60">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-bold flex items-center justify-center">
              {activeRecipient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{activeRecipient.fullName}</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full font-semibold">
                  Terverifikasi
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                No. Rek: <strong className="text-amber-300">{activeRecipient.accountNumber}</strong> • HP: {activeRecipient.phone}
              </span>
            </div>
          </div>

          {/* Action buttons inside header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartInChatTransfer(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Kirim Uang</span>
            </button>
            <button
              onClick={() => handleStartInChatTransfer(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              Minta Uang
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px]">
          {activeThread.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-1">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-white">Mulai percakapan dengan {activeRecipient.fullName}</p>
              <p>Anda bisa mengirim pesan, meminta uang patungan, atau mengirim uang langsung di sini.</p>
            </div>
          ) : (
            activeThread.map((msg) => {
              const isMine = msg.senderAccount === currentAccount.accountNumber;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-sm rounded-2xl p-3 text-xs shadow-md ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                    }`}
                  >
                    {/* Transfer Attachment Card inside bubble */}
                    {msg.transferAttachment && (
                      <div className="mb-2 p-2.5 rounded-xl bg-black/30 border border-white/20 text-xs space-y-1 font-sans">
                        <div className="flex items-center justify-between text-[10px] text-amber-300 font-semibold">
                          <span>
                            {msg.transferAttachment.isRequest
                              ? '📩 PERMINTAAN DANA (MINTA UANG)'
                              : '💸 TRANSFER DANA DI CHAT'}
                          </span>
                          <span className="font-mono">{msg.transferAttachment.referenceNo}</span>
                        </div>
                        <div className="font-mono text-base font-extrabold text-white">
                          {formatRupiah(msg.transferAttachment.amount)}
                        </div>
                        {msg.transferAttachment.note && (
                          <div className="text-[11px] text-slate-300 italic">
                            "{msg.transferAttachment.note}"
                          </div>
                        )}
                      </div>
                    )}

                    <p className="leading-relaxed">{msg.text}</p>

                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                      <span>{new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-sky-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Ketik pesan untuk ${activeRecipient.fullName.split(' ')[0]}...`}
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* MODAL KIRIM / MINTA UANG DI CHAT */}
      {showSendMoneyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmSendMoney}
            className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="text-center">
              <h3 className="font-bold text-base text-white">
                {isRequestMoney ? 'Minta Uang (Split Bill)' : 'Kirim Uang di Chat'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Kepada: <strong className="text-amber-300">{activeRecipient.fullName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  required
                  value={transferAmountInput}
                  onChange={(e) => setTransferAmountInput(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Catatan:</label>
                <input
                  type="text"
                  value={transferNoteInput}
                  onChange={(e) => setTransferNoteInput(e.target.value)}
                  placeholder="Contoh: Patungan makan siang"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className={`flex-1 py-3 font-bold rounded-xl text-xs cursor-pointer shadow-lg ${
                  isRequestMoney
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRequestMoney ? 'Kirim Permintaan' : 'Lanjut ke PIN Kartu ➔'}
              </button>
              <button
                type="button"
                onClick={() => setShowSendMoneyModal(false)}
                className="px-4 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECURE PIN PROMPT FOR CARD TRANSFER */}
      <PinPromptModal
        isOpen={showPinPrompt}
        title="Otorisasi PIN Kartu Debit"
        description={`Masukkan PIN kartu Anda untuk mentransfer ${formatRupiah(parseInt(transferAmountInput, 10) || 0)} ke ${activeRecipient.fullName}`}
        targetAccountName={currentAccount.fullName}
        cardNumberSnippet={currentAccount.cardNumber}
        expectedPin={currentAccount.pin}
        onSuccess={executeTransferAfterPin}
        onCancel={() => setShowPinPrompt(false)}
      />

      {/* MODAL MULAI CHAT NOMOR BARU */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-white">Mulai Chat dengan Nomor Baru</h3>
            <p className="text-slate-400 text-xs">
              Masukkan 10 digit nomor rekening atau nomor handphone nasabah Bank Nusantara tujuan.
            </p>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nomor Rekening / HP:</label>
              <input
                type="text"
                value={newChatInputNumber}
                onChange={(e) => setNewChatInputNumber(e.target.value)}
                placeholder="Contoh: 5566778899 atau 0812..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (!newChatInputNumber.trim()) return;
                  setActiveRecipientAccount(newChatInputNumber.trim());
                  setShowNewChatModal(false);
                  setNewChatInputNumber('');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl cursor-pointer"
              >
                Mulai Chat
              </button>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
