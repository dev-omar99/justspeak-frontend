"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useI18n } from "../../../lib/i18n";
import Header from "../../../components/Header";
import Button from "../../../components/Button";
import Penguin3D from "../../../components/Penguin3D";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// WebRTC ICE configuration using high-reliability STUN servers
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

// Web Audio API Gentle Chimes & Reaction Sound
function playChime(type: "start" | "warning" | "pop" | "end") {
  try {
    if (typeof window !== "undefined" && localStorage.getItem("justspeak_sound_enabled") === "false") {
      return;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "start") {
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.45);
      });
    } else if (type === "warning") {
      [880, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.2 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.35);
      });
    } else if (type === "pop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch {}
}

interface ChatMessage {
  id: string;
  sender: "me" | "partner";
  senderName?: string;
  text: string;
  timestamp: string;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

function RoomContent() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomName = (params?.roomName as string) || searchParams.get("roomName") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const partnerId = searchParams.get("partnerId") || "";
  const partnerName = searchParams.get("partnerName") || "Speaking Partner";
  const partnerCountry = searchParams.get("partnerCountry") || "";
  const initialTopic = searchParams.get("topic") || "What is your favorite hobby or interest?";
  const rawQuestions = searchParams.get("questions");

  // Questions list for dynamic switcher
  const [questionsList, setQuestionsList] = useState<string[]>([initialTopic]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // 7-minute session countdown (420 seconds)
  const [timeLeft, setTimeLeft] = useState(420);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Media & WebRTC state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isPartnerConnected, setIsPartnerConnected] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState<{
    name: string;
    country: string;
    socketId?: string;
  }>({
    name: partnerName,
    country: partnerCountry,
  });

  // Floating live emoji reactions
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // In-Call Vocabulary Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Video element references
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC and Socket references
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const partnerSocketIdRef = useRef<string | null>(null);

  // Parse questions on mount
  useEffect(() => {
    if (rawQuestions) {
      try {
        const parsed = JSON.parse(rawQuestions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestionsList(parsed);
        }
      } catch {}
    }
  }, [rawQuestions]);

  // Setup WebRTC and WebSocket Signaling
  useEffect(() => {
    if (!roomName) return;

    let isMounted = true;
    let localMediaStream: MediaStream | null = null;

    // Get current logged-in user profile
    let currentUserName = "Learner";
    let currentUserCountry = "";
    let currentUserId = "";
    try {
      const userStr = localStorage.getItem("justspeak_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        currentUserName = u.name || u.email?.split("@")[0] || "Learner";
        currentUserCountry = u.country || "";
        currentUserId = u.id || "";
      }
    } catch {}

    // Initialize Local Media Stream
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localMediaStream = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        initSocket(stream);
      } catch (err: any) {
        console.warn("Could not access camera/mic with full constraints, trying audio only:", err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isMounted) return;
          localMediaStream = audioStream;
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsVideoMuted(true);
          initSocket(audioStream);
        } catch (audioErr) {
          console.error("Camera and Microphone access denied:", audioErr);
          initSocket(null);
        }
      }
    }

    // Helper: Create RTCPeerConnection and bind event handlers
    function createPeerConnection(targetSocketId: string, stream: MediaStream | null) {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;
      partnerSocketIdRef.current = targetSocketId;

      // Add local stream tracks to PeerConnection
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            toSocketId: targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote incoming media tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setIsPartnerConnected(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setIsPartnerConnected(true);
          playChime("start");
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setIsPartnerConnected(false);
        }
      };

      return pc;
    }

    // Initialize Socket.io Connection
    function initSocket(stream: MediaStream | null) {
      const socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        // Join the room with user metadata
        socket.emit("join-room", {
          roomName,
          userId: currentUserId,
          userName: currentUserName,
          userCountry: currentUserCountry,
        });
      });

      // When existing participants are present, we (the newcomer) create the offer
      socket.on("existing-participants", async (participants: any[]) => {
        if (participants && participants.length > 0) {
          const partner = participants[0];
          partnerSocketIdRef.current = partner.socketId;
          if (partner.userName) {
            setPartnerDetails({
              name: partner.userName,
              country: partner.userCountry || partnerCountry,
              socketId: partner.socketId,
            });
          }

          const pc = createPeerConnection(partner.socketId, stream || localStreamRef.current);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", {
              toSocketId: partner.socketId,
              offer,
            });
          } catch (err) {
            console.error("Error creating WebRTC offer:", err);
          }
        }
      });

      // When someone joins after us, update their details
      socket.on("user-joined", (participant: any) => {
        partnerSocketIdRef.current = participant.socketId;
        if (participant.userName) {
          setPartnerDetails({
            name: participant.userName,
            country: participant.userCountry || partnerCountry,
            socketId: participant.socketId,
          });
        }
      });

      // Handle incoming Offer
      socket.on("offer", async (data: { fromSocketId: string; offer: any }) => {
        const pc = createPeerConnection(data.fromSocketId, stream || localStreamRef.current);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", {
            toSocketId: data.fromSocketId,
            answer,
          });
        } catch (err) {
          console.error("Error handling incoming WebRTC offer:", err);
        }
      });

      // Handle incoming Answer
      socket.on("answer", async (data: { fromSocketId: string; answer: any }) => {
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (err) {
            console.error("Error setting remote description from answer:", err);
          }
        }
      });

      // Handle incoming ICE Candidate
      socket.on("ice-candidate", async (data: { fromSocketId: string; candidate: any }) => {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("Error adding received ICE candidate:", err);
          }
        }
      });

      // Realtime In-Call Reaction Received
      socket.on("reaction-received", (data: { emoji: string; fromSocketId: string }) => {
        renderFloatingEmoji(data.emoji);
      });

      // Realtime Dynamic Topic Synchronized
      socket.on("topic-switched", (data: { questionIndex: number }) => {
        setCurrentQIndex(data.questionIndex);
        playChime("pop");
      });

      // Realtime In-Call Chat Message Received
      socket.on("chat-message-received", (data: any) => {
        const isFromMe = data.fromSocketId === socket.id;
        const newMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: isFromMe ? "me" : "partner",
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, newMsg]);
        if (!isFromMe) {
          playChime("pop");
          setUnreadChatCount((prev) => prev + 1);
        }
      });

      // Partner Left
      socket.on("user-left", () => {
        setIsPartnerConnected(false);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setRemoteStream(null);
      });
    }

    startMedia();

    return () => {
      isMounted = false;
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomName });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomName]);

  // Keep local video attached if stream updates
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Keep remote video attached if stream updates
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 7-Minute Call Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 61) {
          playChime("warning");
        }
        if (prev <= 1) {
          clearInterval(timer);
          handleEndCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, partnerId]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        sendReaction("👏");
      } else if (e.key === "n" || e.key === "N") {
        handleNextQuestion();
      } else if (e.key === "c" || e.key === "C") {
        setShowChatDrawer((prev) => !prev);
      } else if (e.key === "m" || e.key === "M") {
        toggleMic();
      } else if (e.key === "v" || e.key === "V") {
        toggleVideo();
      } else if (e.key === "t" || e.key === "T") {
        setShowTopicModal((prev) => !prev);
      } else if (e.key === "?") {
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [questionsList, currentQIndex]);

  // Scroll chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChatDrawer]);

  // Reset unread count when chat opened
  useEffect(() => {
    if (showChatDrawer) {
      setUnreadChatCount(0);
    }
  }, [showChatDrawer]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Media Controls: Mic Mute / Unmute
  function toggleMic() {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks[0].enabled = nextState;
        setIsMicMuted(!nextState);
      }
    }
  }

  // Media Controls: Video Camera On / Off
  function toggleVideo() {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks[0].enabled = nextState;
        setIsVideoMuted(!nextState);
      }
    }
  }

  // Reaction Animation & Sound
  function renderFloatingEmoji(emoji: string) {
    playChime("pop");
    const newEmoji: FloatingEmoji = {
      id: Math.random().toString(36).substring(7),
      emoji,
      left: Math.floor(Math.random() * 50) + 25,
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 2200);
  }

  function sendReaction(emoji: string) {
    renderFloatingEmoji(emoji);
    if (socketRef.current) {
      socketRef.current.emit("send-reaction", { roomName, emoji });
    }
  }

  // Dynamic Question Switcher
  function handleNextQuestion() {
    const nextIdx = (currentQIndex + 1) % questionsList.length;
    setCurrentQIndex(nextIdx);
    if (socketRef.current) {
      socketRef.current.emit("switch-topic", { roomName, questionIndex: nextIdx });
    }
  }

  // In-Call Chat Sender
  function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    let senderName = "Me";
    try {
      const userStr = localStorage.getItem("justspeak_user");
      if (userStr) {
        senderName = JSON.parse(userStr).name || "Me";
      }
    } catch {}

    if (socketRef.current) {
      socketRef.current.emit("chat-message", {
        roomName,
        text,
        senderName,
      });
    }

    setInputText("");
  }

  // End Call & Redirect to Feedback
  function handleEndCall() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.emit("leave-room", { roomName });
      socketRef.current.disconnect();
    }

    const params = new URLSearchParams({
      sessionId,
      partnerId,
      partnerName: partnerDetails.name || partnerName,
      partnerCountry: partnerDetails.country || partnerCountry,
    });
    router.push(`/feedback?${params.toString()}`);
  }

  const QUICK_PHRASES = [
    "How do you spell that? ✍️",
    "Could you repeat please? 👂",
    "What does that mean? 💡",
    "Great conversation! 👍",
  ];

  const REACTION_EMOJIS = ["👏", "👍", "❤️", "💡", "🐧", "🔥", "🎉"];
  const isLowTime = timeLeft <= 60;
  const currentTopic = questionsList[currentQIndex] || initialTopic;

  return (
    <main className="min-h-screen flex flex-col bg-[#0B132B] text-white overflow-hidden relative select-none">
      
      {/* 1. TOP BAR: TOPIC + 7-MIN TIMER + CONTROLS */}
      <header className="h-14 bg-[#0B132B]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30">
        
        {/* Left: Topic & Question Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowTopicModal(!showTopicModal)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border border-white/15 active:scale-95"
            title="Click to view full topic or press 'T'"
          >
            <span>💬 Topic</span>
            <span className="text-[10px] bg-primary text-white font-bold rounded-full px-1.5 py-0.2">
              {currentQIndex + 1}/{questionsList.length}
            </span>
          </button>

          <button
            onClick={handleNextQuestion}
            className="hidden sm:flex items-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary-light border border-primary/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
            title="Switch to next icebreaker question (Press 'N')"
          >
            <span>🔄</span>
            <span>Next Question</span>
          </button>

          <span className="hidden md:inline-block text-xs text-white/70">
            with <strong className="text-white">{partnerDetails.name}</strong>
            {partnerDetails.country ? ` (${partnerDetails.country})` : ""}
          </span>
        </div>

        {/* Center: Live 7-Minute Timer Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl font-mono text-xs font-extrabold transition-all shadow-md ${
              isLowTime
                ? "bg-danger text-white ring-4 ring-danger/30 animate-pulse"
                : "bg-white/10 text-white border border-white/15"
            }`}
          >
            <span className="text-sm">⏱️</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Right: Shortcuts + Chat Drawer Toggle + End Call */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="hidden lg:flex items-center gap-1 text-[11px] text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all"
            title="Keyboard Shortcuts"
          >
            <span>⌨️ Keys</span>
          </button>

          <button
            onClick={() => setShowChatDrawer(!showChatDrawer)}
            className={`relative flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all border ${
              showChatDrawer
                ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                : "bg-white/10 hover:bg-white/20 text-white border-white/15"
            }`}
            title="Toggle Vocabulary Chat (Press 'C')"
          >
            <span>📝</span>
            <span className="hidden sm:inline">Vocabulary Chat</span>
            {unreadChatCount > 0 && !showChatDrawer && (
              <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={handleEndCall}
            className="bg-danger hover:bg-danger/90 active:scale-95 transition-all text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-lg shadow-danger/30 flex items-center gap-1.5"
          >
            <span>📞 End Call</span>
          </button>
        </div>
      </header>

      {/* 2. TOPIC MODAL / CAROUSEL */}
      {showTopicModal && (
        <div className="absolute top-16 left-4 z-40 max-w-md w-full bg-white text-ink p-5 rounded-3xl shadow-2xl border border-border animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                Conversation Starter • Question {currentQIndex + 1} of {questionsList.length}
              </span>
              <p className="text-sm font-bold text-ink mt-2 leading-relaxed">
                &ldquo;{currentTopic}&rdquo;
              </p>
            </div>
            <button
              onClick={() => setShowTopicModal(false)}
              className="text-ink-soft hover:text-ink text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] text-ink-soft">Finished this topic? (Press &apos;N&apos;)</span>
            <button
              onClick={handleNextQuestion}
              className="text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
            >
              🔄 Next Question
            </button>
          </div>
        </div>
      )}

      {/* 3. KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-ink rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⌨️</span>
                <h3 className="text-sm font-bold text-ink">In-Call Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-ink-soft hover:text-ink font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-border/60 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-soft">Toggle Mic Mute</span>
                <kbd className="bg-surface border border-border px-2.5 py-1 rounded-lg font-mono font-bold text-ink">M</kbd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-soft">Toggle Camera</span>
                <kbd className="bg-surface border border-border px-2.5 py-1 rounded-lg font-mono font-bold text-ink">V</kbd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-soft">Send Clap Reaction 👏</span>
                <kbd className="bg-surface border border-border px-2.5 py-1 rounded-lg font-mono font-bold text-ink">Space</kbd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-soft">Next Topic Question</span>
                <kbd className="bg-surface border border-border px-2.5 py-1 rounded-lg font-mono font-bold text-ink">N</kbd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-soft">Toggle Vocabulary Chat</span>
                <kbd className="bg-surface border border-border px-2.5 py-1 rounded-lg font-mono font-bold text-ink">C</kbd>
              </div>
            </div>

            <Button variant="secondary" onClick={() => setShowShortcutsModal(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* 4. MAIN STAGE: NATIVE WEBRTC VIDEO VIEWS */}
      <div className="flex-1 flex w-full relative overflow-hidden bg-gradient-to-b from-[#0B132B] via-[#111C3D] to-[#070D1E]">
        
        {/* Full Viewport: Partner Video or Waiting Radar */}
        <div className="flex-1 relative w-full h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
          
          {/* Active Partner Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isPartnerConnected ? "opacity-100" : "opacity-0 absolute"
            }`}
          />

          {/* Waiting Beacon / Radar Screen (Shown when partner is connecting) */}
          {!isPartnerConnected && (
            <div className="flex flex-col items-center justify-center gap-6 px-6 text-center z-10 max-w-md animate-in fade-in duration-500">
              {/* Concentric Glowing Radar Rings */}
              <div className="relative flex items-center justify-center w-36 h-36">
                <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping duration-1000" />
                <div className="absolute inset-3 rounded-full bg-primary/20 animate-pulse duration-700" />
                <div className="relative z-10 p-2">
                  <Penguin3D variant="headphones" size="lg" withLink={false} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Direct P2P Room Ready
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Connecting to {partnerDetails.name || "Partner"}...
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  Both microphones and cameras will link directly and securely with zero friction.
                </p>
              </div>

              {/* In-Call Starter Prompt Badge */}
              <div className="bg-white/5 border border-white/15 rounded-2xl p-4 text-left w-full backdrop-blur-md">
                <span className="text-[10px] uppercase font-black text-primary-light tracking-wider">
                  Today&apos;s Topic:
                </span>
                <p className="text-xs font-bold text-white mt-1 leading-relaxed">
                  &ldquo;{currentTopic}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Partner Info Badge (Overlay on video when connected) */}
          {isPartnerConnected && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#0B132B]/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                {partnerDetails.name}
              </span>
              {partnerDetails.country && (
                <span className="text-[11px] text-white/70">
                  • {partnerDetails.country}
                </span>
              )}
            </div>
          )}

          {/* Picture-in-Picture (Local Camera Feed) */}
          <div className="absolute bottom-24 right-4 sm:bottom-24 sm:right-6 z-20 w-32 h-44 sm:w-44 sm:h-56 bg-[#16203D] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl backdrop-blur-lg flex items-center justify-center group transition-all hover:scale-105">
            {isVideoMuted ? (
              <div className="flex flex-col items-center justify-center text-center p-3 gap-1">
                <span className="text-2xl">🙈</span>
                <span className="text-[11px] font-bold text-white/80">Camera Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Local Badge */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/60 backdrop-blur-sm px-2 py-1 rounded-xl text-[10px] font-bold">
              <span>You</span>
              <span>{isMicMuted ? "🔇 Muted" : "🎙️ On"}</span>
            </div>
          </div>

          {/* Floating Live Reactions Container */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {floatingEmojis.map((item) => (
              <div
                key={item.id}
                className="absolute bottom-20 text-5xl animate-float-up pointer-events-none"
                style={{ left: `${item.left}%` }}
              >
                {item.emoji}
              </div>
            ))}
          </div>

          {/* Bottom Floating Control Dock */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-[#0B132B]/85 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full shadow-2xl">
            
            {/* Mic Button */}
            <button
              onClick={toggleMic}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all active:scale-90 ${
                isMicMuted
                  ? "bg-danger text-white shadow-md shadow-danger/30"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
              title={isMicMuted ? "Unmute Mic (M)" : "Mute Mic (M)"}
            >
              {isMicMuted ? "🔇" : "🎙️"}
            </button>

            {/* Video Camera Button */}
            <button
              onClick={toggleVideo}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all active:scale-90 ${
                isVideoMuted
                  ? "bg-danger text-white shadow-md shadow-danger/30"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
              title={isVideoMuted ? "Turn Video On (V)" : "Turn Video Off (V)"}
            >
              {isVideoMuted ? "📷" : "📹"}
            </button>

            <div className="w-[1px] h-6 bg-white/20 mx-1 hidden sm:block" />

            {/* Emojis Reactions */}
            <div className="hidden sm:flex items-center gap-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-9 h-9 rounded-full hover:bg-white/20 active:scale-125 transition-all text-xl flex items-center justify-center hover:scale-110"
                  title={`Send ${emoji} reaction`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="w-[1px] h-6 bg-white/20 mx-1" />

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="bg-danger hover:bg-danger/90 active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-full shadow-lg shadow-danger/40 flex items-center gap-1.5 transition-all"
            >
              <span>📞</span>
              <span className="hidden sm:inline">Leave</span>
            </button>

          </div>

        </div>

        {/* 5. IN-CALL VOCABULARY & NOTES CHAT SIDE DRAWER */}
        {showChatDrawer && (
          <aside className="w-80 sm:w-96 bg-white text-ink border-l border-border/80 flex flex-col h-[calc(100vh-3.5rem)] z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <div>
                  <h3 className="text-xs font-bold text-ink">Vocabulary & Notes Chat</h3>
                  <p className="text-[10px] text-ink-soft">Share difficult words & spelling in real-time</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                className="text-ink-soft hover:text-ink text-xs font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Quick Helper Phrases */}
            <div className="p-3 bg-surface/50 border-b border-border/40 flex flex-wrap gap-1.5">
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleSendMessage(phrase)}
                  className="text-[11px] font-medium bg-white hover:bg-primary-light hover:text-primary text-ink-soft border border-border/70 px-2.5 py-1 rounded-full transition-all shadow-2xs"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-ink-soft px-4 gap-2">
                  <span className="text-2xl">💡</span>
                  <p className="font-semibold text-ink">Type words or notes here</p>
                  <p className="text-[11px] text-ink-soft">
                    Use this space to help your partner with vocabulary, spelling, or tips during your call!
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                        msg.sender === "me"
                          ? "bg-primary text-white rounded-br-xs"
                          : "bg-surface border border-border text-ink rounded-bl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-ink-soft mt-0.5 px-1">{msg.timestamp}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-border bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a word or note..."
                maxLength={140}
                className="flex-1 text-xs border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Send
              </button>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B132B]" />}>
      <RoomContent />
    </Suspense>
  );
}