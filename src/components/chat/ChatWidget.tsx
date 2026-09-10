"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  MessageCircle,
  X,
  Send,
  Users,
  Minus,
  Maximize2,
  Bell,
  BellOff,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import type { AuthUserProfile } from "@/components/auth/authData";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export type ChatMessageItem = {
  id: string;
  content: string;
  imageUrl?: string | null;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarGradient(role: string): string {
  if (role === "ADMIN") return "from-amber-400 to-amber-600";
  if (role === "ACCOUNTANT") return "from-sky-400 to-sky-600";
  return "from-emerald-400 to-emerald-600";
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "Admin",
    ACCOUNTANT: "Kế toán",
    FLEET: "Fleet",
    DEALER: "Đại lý",
    SALES: "Sales",
  };
  return map[role] ?? role;
}

function getRoleBadge(role: string): string {
  if (role === "ADMIN") return "bg-amber-500 text-slate-950";
  if (role === "ACCOUNTANT") return "bg-sky-400 text-slate-950";
  return "bg-emerald-400 text-slate-950";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

/** Play a soft notification chime using Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext not available (SSR or blocked)
  }
}

/** Request + fire Browser Notification */
async function fireBrowserNotification(
  title: string,
  body: string,
  onNotificationClick?: () => void
) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "denied") return;
  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
  }
  const n = new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "chat-group",
  });
  if (onNotificationClick) n.onclick = onNotificationClick;
}

const POLL_INTERVAL_MS = 2500; // 2.5s — near-realtime

// ─────────────────────────────────────────────────────────
// ChatWidget
// ─────────────────────────────────────────────────────────
interface ChatWidgetProps {
  sessionUser: AuthUserProfile;
}

export default function ChatWidget({ sessionUser }: ChatWidgetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track latest message timestamp for incremental polling
  const lastTimestampRef = useRef<string | null>(null);
  // Track last read time (for unread counting)
  const lastReadAtRef = useRef<string>(new Date(0).toISOString());
  // Track whether window is focused / chat is open
  const isOpenRef = useRef(false);
  isOpenRef.current = isOpen && !isMinimized;

  // ── Request Notification Permission on mount ──────────
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      setNotifEnabled(true);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === "granted");
  };

  // ── Fetch messages (incremental) ──────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const since = lastTimestampRef.current;
      const url = since
        ? `/api/chat/messages?since=${encodeURIComponent(since)}`
        : "/api/chat/messages";

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setApiError(`API error ${res.status}`);
        return;
      }
      setApiError(null);

      const data = await res.json();
      const incoming: ChatMessageItem[] = data.messages ?? [];
      if (incoming.length === 0) return;

      // Update messages
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = incoming.filter((m) => !existingIds.has(m.id));
        if (newOnes.length === 0) return prev;
        return [...prev, ...newOnes];
      });

      // Update last timestamp pointer
      const latestMsg = incoming[incoming.length - 1];
      if (latestMsg) {
        lastTimestampRef.current = latestMsg.createdAt;
      }

      // Notifications for messages from other users
      if (since !== null) {
        // Only notify for incremental (not initial load)
        const fromOthers = incoming.filter((m) => m.senderId !== sessionUser.id);
        if (fromOthers.length > 0) {
          playNotificationSound();

          // Browser push notification if chat is NOT open
          if (!isOpenRef.current) {
            const lastMsg = fromOthers[fromOthers.length - 1];
            const senderName = lastMsg.sender.name || lastMsg.sender.email.split("@")[0];
            const msgBody = lastMsg.content
              ? (lastMsg.content.length > 80 ? lastMsg.content.slice(0, 80) + "…" : lastMsg.content)
              : "📷 Đã gửi một hình ảnh";
            fireBrowserNotification(
              `💬 Chat nội bộ — ${senderName}`,
              msgBody,
              () => {
                window.focus();
                setIsOpen(true);
                setIsMinimized(false);
              }
            );
          }

          // Increment unread count if chat not visible
          if (!isOpenRef.current) {
            setUnreadCount((c) => c + fromOthers.length);
          }
        }
      }
    } catch (err) {
      setApiError("Không thể kết nối server");
      console.error("[Chat] fetch error", err);
    }
  }, [sessionUser.id]);

  // ── Start / stop polling ──────────────────────────────
  useEffect(() => {
    fetchMessages(); // initial load (no since → gets all)
    pollingRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages]);

  // ── Scroll to bottom when new messages arrive & chat visible ──
  useEffect(() => {
    if (isOpen && !isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // ── Mark read ─────────────────────────────────────────
  const markRead = useCallback(() => {
    lastReadAtRef.current = new Date().toISOString();
    setUnreadCount(0);
    fetch("/api/chat/read", { method: "POST" }).catch(() => {});
  }, []);

  // ── Open / Close ──────────────────────────────────────
  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    markRead();
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      inputRef.current?.focus();
    }, 60);
  }, [markRead]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    markRead();
  }, [markRead]);

  // ── Image Handling ────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa là 10MB");
      return;
    }
    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Clipboard paste support (e.g. screenshot paste)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileSelect(file);
          break;
        }
      }
    }
  };

  // ── Send message ──────────────────────────────────────
  const sendMessage = async () => {
    const content = inputText.trim();
    if ((!content && !selectedImage) || isSending) return;

    setIsSending(true);
    const fileToUpload = selectedImage;
    const currentPreview = imagePreview;

    // Reset input and clear preview
    setInputText("");
    clearSelectedImage();

    // Optimistic update — instant UI
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: optimisticId,
      content,
      imageUrl: currentPreview,
      senderId: sessionUser.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role === "director" ? "ADMIN" : sessionUser.role === "accountant" ? "ACCOUNTANT" : "SALES",
      },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      let uploadedUrl: string | null = null;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error("Tải ảnh thất bại");
        }
        const uploadData = await uploadRes.json();
        uploadedUrl = uploadData.url;
      }

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl: uploadedUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        const realMsg: ChatMessageItem = data.message;
        // Replace optimistic with real
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? realMsg : m))
        );
        lastTimestampRef.current = realMsg.createdAt;
        markRead();
      } else {
        // Rollback optimistic on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setInputText(content);
      }
    } catch (err) {
      console.error("[Chat send error]", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  const myInitials = getInitials(sessionUser.name, sessionUser.email);
  const myRoleKey = sessionUser.role === "director" ? "ADMIN" : sessionUser.role === "accountant" ? "ACCOUNTANT" : "SALES";

  return (
    <>
      {/* ── Floating Bubble ─────────────────────────── */}
      {!isOpen && (
        <button
          id="chat-bubble-btn"
          type="button"
          onClick={openChat}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-amber-300/30 dark:ring-amber-800/40"
          title={t("chatTitle")}
        >
          <MessageCircle className="h-6 w-6 text-slate-950" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900 animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Chat Panel ─────────────────────────────── */}
      {isOpen && (
        <div
          id="chat-panel"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-all duration-200"
          style={{ height: isMinimized ? "auto" : "540px" }}
        >
          {/* ── Header (Click anywhere to expand when minimized) ── */}
          <div
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
                markRead();
              }
            }}
            title={isMinimized ? "Nhấn để mở rộng chat" : undefined}
            className={`flex shrink-0 items-center justify-between gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 transition-colors ${
              isMinimized
                ? "cursor-pointer select-none hover:bg-slate-800/90 active:scale-[0.99]"
                : ""
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/40">
                <Users className="h-4 w-4 text-amber-400" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white leading-tight truncate">
                    {t("chatTitle")}
                  </p>
                  {isMinimized && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {messages.length} {t("chatMessages")}
                  {isMinimized && " · Nhấn để mở"}
                  {apiError && <span className="text-rose-400 ml-1">· {apiError}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Notification toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  notifEnabled ? setNotifEnabled(false) : requestNotifPermission();
                }}
                title={notifEnabled ? "Tắt thông báo" : "Bật thông báo"}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {notifEnabled ? <Bell className="h-3.5 w-3.5 text-amber-400" /> : <BellOff className="h-3.5 w-3.5" />}
              </button>

              {/* Minimize / Expand Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized((v) => !v);
                }}
                title={isMinimized ? "Mở rộng chat" : "Thu nhỏ"}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5 text-amber-400" /> : <Minus className="h-4 w-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat();
                }}
                title="Đóng chat"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-rose-600 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Body (hidden when minimized) ────────── */}
          {!isMinimized && (
            <>
              {/* Messages list */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50 dark:bg-slate-950/40 scroll-smooth">
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-600">
                    <MessageCircle className="h-12 w-12 opacity-30" />
                    <p className="text-xs font-medium text-center px-4">{t("chatNoMessages")}</p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isMine = msg.senderId === sessionUser.id;
                  const isFirst =
                    idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                  const isOptimistic = msg.id.startsWith("optimistic-");
                  const displayName = msg.sender.name || msg.sender.email.split("@")[0];
                  const initials = getInitials(msg.sender.name, msg.sender.email);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`shrink-0 h-7 w-7 rounded-full bg-gradient-to-br ${getAvatarGradient(msg.sender.role)} flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-sm transition-opacity ${isFirst ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                      >
                        {initials}
                      </div>

                      <div className={`flex flex-col gap-0.5 max-w-[78%] ${isMine ? "items-end" : "items-start"}`}>
                        {/* Sender label */}
                        {isFirst && !isMine && (
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                              {displayName}
                            </span>
                            <span className={`shrink-0 rounded-full px-1.5 text-[9px] font-bold leading-4 ${getRoleBadge(msg.sender.role)}`}>
                              {getRoleLabel(msg.sender.role)}
                            </span>
                          </div>
                        )}

                        {/* Bubble Container */}
                        <div
                          className={`rounded-2xl p-2.5 text-sm shadow-sm transition-opacity ${isOptimistic ? "opacity-70" : "opacity-100"} ${
                            isMine
                              ? "bg-amber-500 text-slate-950 rounded-br-none"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                          }`}
                        >
                          {/* Image Attachment (if any) */}
                          {msg.imageUrl && (
                            <div className={`${msg.content ? "mb-2" : ""} overflow-hidden rounded-xl bg-black/10`}>
                              <img
                                src={msg.imageUrl}
                                alt="Ảnh đính kèm"
                                onClick={() => setPreviewModalImg(msg.imageUrl || null)}
                                className="max-h-60 w-auto rounded-xl object-cover cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Text content */}
                          {msg.content && (
                            <p className="leading-relaxed break-words whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
                          {formatTime(msg.createdAt)}
                          {isOptimistic && " · đang gửi…"}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* ── Image Preview Bar before sending ── */}
              {imagePreview && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 dark:bg-slate-800/80 border-t border-amber-200/60 dark:border-slate-700">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={imagePreview}
                      alt="Xem trước ảnh"
                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-amber-300 dark:border-slate-600 shadow-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {selectedImage?.name ?? "Ảnh đính kèm"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : "Ảnh"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    title="Xoá ảnh"
                    className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* ── Input Box ── */}
              <div className="shrink-0 border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`shrink-0 h-7 w-7 rounded-full bg-gradient-to-br ${getAvatarGradient(myRoleKey)} flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-sm`}
                  >
                    {myInitials}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {/* Choose Image Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Gửi ảnh (hoặc Ctrl+V dán ảnh)"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>

                  <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={handlePaste}
                    placeholder={selectedImage ? "Nhập chú thích ảnh..." : t("chatTypeMessage")}
                    maxLength={2000}
                    autoComplete="off"
                    className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 transition-all"
                  />

                  <button
                    id="chat-send-btn"
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || (!inputText.trim() && !selectedImage)}
                    className="shrink-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-600">
                  {t("chatGroupHint")} · Hỗ trợ chụp màn hình & dán ảnh (Ctrl+V)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Image Fullscreen Lightbox Modal ── */}
      {previewModalImg && (
        <div
          onClick={() => setPreviewModalImg(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-slate-800"
          >
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <a
                href={previewModalImg}
                target="_blank"
                rel="noreferrer"
                title="Mở ảnh gốc trong tab mới"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors backdrop-blur-xs"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                title="Đóng"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-rose-600 transition-colors backdrop-blur-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={previewModalImg}
              alt="Ảnh phóng to"
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
