"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { getToken, getUser, clearAuth } from "../../../lib/auth";
import { getPartnerMemo, savePartnerMemo } from "../../../lib/memos";
import { recoverTicket } from "../../../services/api";
import Button from "../../../components/Button";
import Penguin3D from "../../../components/Penguin3D";
import BrandWatermark from "../../../components/BrandWatermark";

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (
    configured &&
    !configured.includes("localhost") &&
    !configured.includes("127.0.0.1")
  ) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol || "http:";
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
      return `${protocol}//${hostname}:4000`;
    }
    if (configured) {
      return configured.replace(/\/$/, "");
    }
    return `${protocol}//${hostname}:4000`;
  }
  return configured || "http://localhost:4000";
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return "🇮🇳";
  const normalized = countryName.toLowerCase().trim();
  const flags: Record<string, string> = {
    egypt: "🇪🇬",
    "saudi arabia": "🇸🇦",
    uae: "🇦🇪",
    uk: "🇬🇧",
    usa: "🇺🇸",
    morocco: "🇲🇦",
    algeria: "🇩🇿",
    tunisia: "🇹🇳",
    jordan: "🇯🇴",
    lebanon: "🇱🇧",
    kuwait: "🇰🇼",
    qatar: "🇶🇦",
    germany: "🇩🇪",
    france: "🇫🇷",
    spain: "🇪🇸",
    italy: "🇮🇹",
    turkey: "🇹🇷",
    brazil: "🇧🇷",
    japan: "🇯🇵",
    korea: "🇰🇷",
    india: "🇮🇳",
    indonesia: "🇮🇩",
    pakistan: "🇵🇰",
    colombia: "🇨🇴",
    mexico: "🇲🇽",
    canada: "🇨🇦",
    australia: "🇦🇺",
  };
  return flags[normalized] || "🌍";
}

function playChime(type: "start" | "warning" | "pop" | "end") {
  try {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("justspeak_sound_enabled") === "false"
    ) {
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
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.15 + 0.4
        );
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
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.2 + 0.3
        );
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
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomName =
    (params?.roomName as string) || searchParams.get("roomName") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const partnerId = searchParams.get("partnerId") || "";
  const partnerName = searchParams.get("partnerName") || "Speaking Partner";
  const partnerCountry = searchParams.get("partnerCountry") || "India";
  const initialTopic =
    searchParams.get("topic") ||
    "Has anything made you want to work harder to earn more?";
  const rawQuestions = searchParams.get("questions");

  const [myDisplayName, setMyDisplayName] = useState("Learner");
  const [questionsList, setQuestionsList] = useState<string[]>([initialTopic]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // 7-minute session countdown (420 seconds)
  const [timeLeft, setTimeLeft] = useState(420);

  // Stage presentation mode:
  // - "conversation": Screenshot #3 (Full partner video + top-left PIP + bottom-left partner card + top-right TOPIC pill)
  // - "topic_card": Screenshot #17 (Dual top-left PIPs + center white illustrated topic card)
  // - "host_guide": Screenshot #4 (Dual top-left PIPs + center host intro presentation)
  const [stageMode, setStageMode] = useState<
    "conversation" | "topic_card" | "host_guide"
  >("conversation");

  // Screenshot #3: "Scheduled to leave after this conversation"
  const [scheduledToLeave, setScheduledToLeave] = useState(false);
  const [showScheduleInfoModal, setShowScheduleInfoModal] = useState(false);

  // Screenshot #2: "Disconnected - Your ticket has been recovered"
  const [showDisconnectedModal, setShowDisconnectedModal] = useState(false);

  // Modals & Drawers
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Media & WebRTC state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [isAudioBlockedByBrowser, setIsAudioBlockedByBrowser] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [isPartnerConnected, setIsPartnerConnected] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [partnerDetails, setPartnerDetails] = useState<{
    name: string;
    country: string;
    socketId?: string;
  }>({
    name: partnerName,
    country: partnerCountry,
  });

  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const partnerSocketIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasRecoveredTicketRef = useRef<boolean>(false);

  // Parse questions & load existing partner memo
  useEffect(() => {
    if (rawQuestions) {
      try {
        const parsed = JSON.parse(rawQuestions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestionsList(parsed);
        }
      } catch {}
    }
    const currentUser = getUser();
    if (currentUser) {
      const name =
        currentUser.name ||
        (currentUser.email ? currentUser.email.split("@")[0] : "Learner");
      setMyDisplayName(name);
    }
    if (partnerId) {
      setMemoText(getPartnerMemo(currentUser?.id, partnerId));
    }
  }, [rawQuestions, partnerId]);

  // Trigger backend ticket recovery whenever Disconnected modal opens (Screenshot #2)
  async function triggerTicketRecovery() {
    setShowDisconnectedModal(true);
    if (hasRecoveredTicketRef.current || !sessionId) return;
    hasRecoveredTicketRef.current = true;
    const token = getToken();
    if (token) {
      try {
        await recoverTicket(token, sessionId);
      } catch {}
    }
  }

  // Setup WebRTC and WebSocket Signaling
  useEffect(() => {
    if (!roomName) return;

    let isMounted = true;
    let localMediaStream: MediaStream | null = null;

    async function startMedia() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setIsVideoMuted(true);
        setMediaNotice(
          "Camera/Mic requires HTTPS on mobile browsers. Connected in Live Room Mode."
        );
        initSocket(null);
        return;
      }

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
      } catch {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          if (!isMounted) return;
          localMediaStream = audioStream;
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsVideoMuted(true);
          setMediaNotice("Audio-only mode active (camera unavailable).");
          initSocket(audioStream);
        } catch {
          setIsVideoMuted(true);
          setMediaNotice("Connected without camera/microphone permissions.");
          initSocket(null);
        }
      }
    }

    async function flushPendingIceCandidates(pc: RTCPeerConnection) {
      if (!pc.remoteDescription || pendingCandidatesRef.current.length === 0) {
        return;
      }
      const queued = [...pendingCandidatesRef.current];
      pendingCandidatesRef.current = [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      }
    }

    function createPeerConnection(
      targetSocketId: string,
      stream: MediaStream | null
    ) {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch {}
      }
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;
      partnerSocketIdRef.current = targetSocketId;

      const hasAudioTrack = !!stream && stream.getAudioTracks().length > 0;
      const hasVideoTrack = !!stream && stream.getVideoTracks().length > 0;

      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      try {
        if (!hasAudioTrack) {
          pc.addTransceiver("audio", { direction: "recvonly" });
        }
        if (!hasVideoTrack) {
          pc.addTransceiver("video", { direction: "recvonly" });
        }
      } catch {}

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            toSocketId: targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const inboundStream =
          event.streams && event.streams[0]
            ? event.streams[0]
            : new MediaStream([event.track]);
        setRemoteStream(inboundStream);
        setIsPartnerConnected(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = inboundStream;
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = inboundStream;
          remoteAudioRef.current.play().catch(() => {
            setIsAudioBlockedByBrowser(true);
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setIsPartnerConnected(true);
          setShowDisconnectedModal(false);
          playChime("start");
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setIsPartnerConnected(false);
          triggerTicketRecovery();
        }
      };

      return pc;
    }

    function initSocket(stream: MediaStream | null) {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }
      const socket = io(getApiBaseUrl(), {
        transports: ["websocket", "polling"],
        auth: {
          token: `Bearer ${token}`,
        },
        query: {
          token,
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", {
          roomName,
        });
      });

      socket.on("auth-error", (err: { message?: string }) => {
        const currentToken = getToken();
        if (!currentToken) {
          clearAuth();
          router.push("/login");
          return;
        }
        setRoomError(
          err?.message ||
            "Session authentication check failed. Please return to the dashboard and rejoin."
        );
      });

      socket.on("room-error", (err: { message?: string }) => {
        setRoomError(err?.message || "Unable to join this practice room.");
      });

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

          const pc = createPeerConnection(
            partner.socketId,
            stream || localStreamRef.current
          );
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", {
              toSocketId: partner.socketId,
              offer,
            });
          } catch {}
        }
      });

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

      socket.on("offer", async (data: { fromSocketId: string; offer: any }) => {
        const pc = createPeerConnection(
          data.fromSocketId,
          stream || localStreamRef.current
        );
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await flushPendingIceCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", {
            toSocketId: data.fromSocketId,
            answer,
          });
        } catch {}
      });

      socket.on(
        "answer",
        async (data: { fromSocketId: string; answer: any }) => {
          const pc = peerConnectionRef.current;
          if (pc) {
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              await flushPendingIceCandidates(pc);
            } catch {}
          }
        }
      );

      socket.on(
        "ice-candidate",
        async (data: { fromSocketId: string; candidate: any }) => {
          if (!data?.candidate) return;
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch {}
          } else {
            pendingCandidatesRef.current.push(data.candidate);
          }
        }
      );

      socket.on(
        "reaction-received",
        (data: { emoji: string; fromSocketId: string }) => {
          if (data.fromSocketId === socket.id) return;
          renderFloatingEmoji(data.emoji);
        }
      );

      socket.on(
        "topic-switched",
        (data: { questionIndex: number; fromSocketId?: string }) => {
          if (data.fromSocketId === socket.id) return;
          setCurrentQIndex(data.questionIndex);
          playChime("pop");
        }
      );

      socket.on("chat-message-received", (data: any) => {
        if (data.fromSocketId === socket.id) return;
        const newMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: "partner",
          senderName: data.senderName,
          text: data.text,
          timestamp:
            data.timestamp ||
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        };
        setChatMessages((prev) => [...prev, newMsg]);
        playChime("pop");
        setUnreadChatCount((prev) => prev + 1);
      });

      // Partner Left -> Show Screenshot #2 Disconnected Ticket Recovery Modal
      socket.on("user-left", () => {
        setIsPartnerConnected(false);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setRemoteStream(null);
        triggerTicketRecovery();
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

  // Re-attach video streams when stageMode changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, stageMode]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {
        setIsAudioBlockedByBrowser(true);
      });
    }
  }, [remoteStream, stageMode]);

  function handleUnlockBrowserAudio() {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(() => {});
    }
    setIsAudioBlockedByBrowser(false);
  }

  async function flipCamera() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      !localStreamRef.current
    ) {
      return;
    }
    const nextFacing = cameraFacingMode === "user" ? "environment" : "user";
    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: nextFacing },
        },
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const oldVideoTracks = localStreamRef.current.getVideoTracks();
      oldVideoTracks.forEach((t) => {
        localStreamRef.current?.removeTrack(t);
        t.stop();
      });
      localStreamRef.current.addTrack(newVideoTrack);

      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      setCameraFacingMode(nextFacing);
      setIsVideoMuted(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch {}
  }

  // 7-Minute Call Timer Countdown (persisted across page refreshes via sessionStorage)
  useEffect(() => {
    if (!roomName || typeof window === "undefined") return;

    const storageKey = `justspeak_room_start_${roomName}`;
    let startMs = Number(sessionStorage.getItem(storageKey));
    if (!Number.isFinite(startMs) || startMs <= 0) {
      startMs = Date.now();
      try {
        sessionStorage.setItem(storageKey, String(startMs));
      } catch {}
    }

    const computeRemainingSeconds = () => {
      const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
      return Math.max(0, 420 - elapsedSeconds);
    };

    const initialRemaining = computeRemainingSeconds();
    setTimeLeft(initialRemaining);
    if (initialRemaining <= 0) {
      handleEndCall();
      return;
    }

    let warningPlayed = initialRemaining < 60;
    const timer = setInterval(() => {
      const remaining = computeRemainingSeconds();
      if (remaining <= 60 && !warningPlayed && remaining > 0) {
        warningPlayed = true;
        playChime("warning");
      }
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        handleEndCall();
        return;
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [roomName, sessionId, partnerId, scheduledToLeave]);

  // Scroll chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChatDrawer]);

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

  function handleNextQuestion() {
    const nextIdx = (currentQIndex + 1) % questionsList.length;
    setCurrentQIndex(nextIdx);
    if (socketRef.current) {
      socketRef.current.emit("switch-topic", {
        roomName,
        questionIndex: nextIdx,
      });
    }
  }

  function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const myMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: "me",
      senderName: myDisplayName,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages((prev) => [...prev, myMsg]);

    if (socketRef.current) {
      socketRef.current.emit("chat-message", {
        roomName,
        text,
      });
    }

    setInputText("");
  }

  function handleSavePartnerMemo() {
    if (!partnerId) {
      setShowMemoModal(false);
      return;
    }
    savePartnerMemo(getUser()?.id, partnerId, memoText);
    setShowMemoModal(false);
  }

  function cleanupCallMedia() {
    if (typeof window !== "undefined" && roomName) {
      try {
        sessionStorage.removeItem(`justspeak_room_start_${roomName}`);
      } catch {}
    }
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
  }

  function handleEndCall() {
    cleanupCallMedia();
    const params = new URLSearchParams({
      sessionId,
      partnerId,
      partnerName: partnerDetails.name || partnerName,
      partnerCountry: partnerDetails.country || partnerCountry,
      scheduledLeave: scheduledToLeave ? "1" : "0",
    });
    router.push(`/feedback?${params.toString()}`);
  }

  function handleMeetNewPartnerAfterDisconnect() {
    cleanupCallMedia();
    router.push("/queue?step=waiting_room");
  }

  function handleLeaveAfterDisconnect() {
    cleanupCallMedia();
    router.push("/queue?step=exit");
  }

  const QUICK_PHRASES = [
    "How do you spell that? ✍️",
    "Could you repeat please? 👂",
    "What does that mean? 💡",
    "Great conversation! 👍",
  ];

  const currentTopic = questionsList[currentQIndex] || initialTopic;
  const partnerFlag = getCountryFlag(partnerDetails.country);

  return (
    <main className="min-h-screen w-full flex flex-col bg-[#0E0F12] text-white overflow-hidden relative select-none">
      {/* Dedicated Remote Audio Element for reliable cross-device WebRTC voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <BrandWatermark opacity={0.045} size="xl" />

      {/* Browser Autoplay Audio Unlocker Banner */}
      {isAudioBlockedByBrowser && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-center gap-3 z-50 shadow-lg">
          <span className="text-xs sm:text-sm font-black">
            🔊 Partner audio is ready! Tap to enable speaker sound:
          </span>
          <button
            type="button"
            onClick={handleUnlockBrowserAudio}
            className="bg-slate-950 text-white font-black text-xs px-4 py-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            Enable Sound Now
          </button>
        </div>
      )}

      {/* Media Notice Banner (e.g. HTTP Mobile LAN voice fallback) */}
      {mediaNotice && !roomError && (
        <div className="bg-[#0B1F3A]/95 text-slate-200 px-4 py-2 flex items-center justify-between gap-3 z-40 border-b border-white/10 text-xs">
          <span>ℹ️ {mediaNotice}</span>
          <button
            type="button"
            onClick={() => setMediaNotice(null)}
            className="text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Room Error Banner */}
      {roomError && (
        <div className="bg-rose-600/95 text-white px-4 py-3 flex items-center justify-between gap-4 z-50 border-b border-white/20">
          <span className="text-xs sm:text-sm font-semibold">{roomError}</span>
          <button
            onClick={() => {
              cleanupCallMedia();
              router.push("/");
            }}
            className="bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs px-3 py-1.5 rounded-xl transition-all shrink-0"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* SCREENSHOT #3: Top "Scheduled to leave after this conversation" Bar */}
      {/* =================================================================== */}
      {scheduledToLeave && (
        <div className="h-10 bg-black/95 border-b border-white/10 px-4 flex items-center justify-center gap-2 z-30 animate-in fade-in duration-200">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22C55E"
            strokeWidth="3"
          >
            <polyline
              points="20 6 9 17 4 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-white">
            Scheduled to leave after this conversation
          </span>
          <button
            type="button"
            onClick={() => setShowScheduleInfoModal(true)}
            className="w-4 h-4 rounded-full border border-slate-400 text-slate-400 text-[10px] font-bold flex items-center justify-center hover:text-white"
          >
            ?
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* MAIN ROOM VIEWPORT */}
      {/* =================================================================== */}
      <div className="flex-1 flex w-full relative overflow-hidden">
        <div className="flex-1 relative w-full h-screen flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
          {/* =============================================================== */}
          {/* MODE A: FULL 1-ON-1 CONVERSATION VIEW (Screenshot #3) */}
          {/* =============================================================== */}
          {stageMode === "conversation" && (
            <>
              {/* Center Full Partner Video Feed */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`h-full max-w-full object-cover transition-opacity duration-300 ${
                    isPartnerConnected ? "opacity-100" : "opacity-0"
                  }`}
                />

                {!isPartnerConnected && (
                  <div className="flex flex-col items-center justify-center gap-4 text-center px-6 max-w-sm pointer-events-auto">
                    <Penguin3D variant="headphones" size="lg" withLink={false} />
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-white">
                        Waiting for {partnerDetails.name}...
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Your 7-minute English session is ready. Tap{" "}
                        <strong>TOPIC</strong> on the right to preview the prompt card!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={triggerTicketRecovery}
                      className="text-xs text-slate-400 hover:text-white underline mt-1"
                    >
                      Partner didn&apos;t join? Recover ticket
                    </button>
                  </div>
                )}
              </div>

              {/* Top Row: Local PIP (Top-Left) + TOPIC Pill (Top-Right) */}
              <div className="relative z-20 flex items-start justify-between pr-16 sm:pr-20">
                {/* Top-Left Local Camera PIP (Screenshot #3) */}
                <div className="relative w-44 h-28 sm:w-60 sm:h-36 rounded-2xl overflow-hidden bg-slate-800 shadow-2xl border border-white/10">
                  {!isVideoMuted ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      Camera Off
                    </div>
                  )}

                  {isMicMuted && (
                    <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-md">
                      🔇
                    </div>
                  )}

                  {/* Gear Icon at Top-Right of Local PIP */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-all"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>

                  {/* Bottom Name Label on Local PIP */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-1.5">
                    <span className="text-[11px] font-medium text-white truncate block">
                      {myDisplayName}
                    </span>
                  </div>
                </div>

                {/* Top-Right TOPIC Pill Button (Screenshot #3) */}
                <button
                  type="button"
                  onClick={() => setStageMode("topic_card")}
                  className="bg-[#18191D]/90 hover:bg-[#25272E] border border-white/10 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transition-all"
                >
                  <span className="w-5 h-5 rounded-full bg-white text-[#0E0F12] text-[11px] font-black flex items-center justify-center">
                    ★
                  </span>
                  <span className="text-xs font-extrabold tracking-wide uppercase">
                    TOPIC
                  </span>
                </button>
              </div>

              {/* Bottom Row: Partner Flag + Memo Card (Bottom-Left) + Timer & Signal Pill (Bottom-Right) */}
              <div className="relative z-20 flex items-end justify-between pr-16 sm:pr-20">
                {/* Bottom-Left Partner Info + Memo Button Card (Screenshot #3) */}
                <div className="bg-[#141519]/90 backdrop-blur-md border border-white/5 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 min-w-[210px] sm:min-w-[250px] shadow-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{partnerFlag}</span>
                    <span className="text-sm sm:text-base font-extrabold text-white truncate">
                      {partnerDetails.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#E8C5C8] text-[#9F5860] font-extrabold text-xs flex items-center justify-center">
                      N
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMemoModal(true)}
                      className="inline-flex items-center gap-1.5 bg-[#0D2B64] hover:bg-[#153B82] text-blue-100 font-bold text-xs px-3.5 py-2 rounded-full transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7" />
                        <path d="M14 2v6h6" />
                        <path d="M18 15v6M15 18h6" />
                      </svg>
                      <span>Memo</span>
                    </button>
                  </div>
                </div>

                {/* Bottom-Right Timer & Signal Quality Pill (Screenshot #3 & #2) */}
                <div className="bg-[#141519]/90 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-2xl">
                  <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                  {showDisconnectedModal ? (
                    <span className="text-rose-500 text-xs font-extrabold">
                      ✕
                    </span>
                  ) : (
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-1 h-1.5 bg-[#22C55E] rounded-xs" />
                      <span className="w-1 h-2 bg-[#22C55E] rounded-xs" />
                      <span className="w-1 h-2.5 bg-[#22C55E] rounded-xs" />
                      <span className="w-1 h-3.5 bg-[#22C55E] rounded-xs" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* =============================================================== */}
          {/* MODE B: DUAL-PIP + TOPIC CARD / HOST GUIDE STAGE (Screenshots #4 & #17) */}
          {/* =============================================================== */}
          {stageMode !== "conversation" && (
            <div className="flex-1 flex flex-col gap-4 pr-16 sm:pr-20 z-20">
              {/* Top-Left Dual PIP Row (Screenshots #4 & #17) */}
              <div className="flex items-center gap-3">
                {/* Tile 1: Local User */}
                <div className="relative w-44 h-28 sm:w-52 sm:h-32 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shadow-lg">
                  {!isVideoMuted ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      Camera Off
                    </div>
                  )}
                  {isMicMuted && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#E04F3E] text-white flex items-center justify-center text-[10px]">
                      🔇
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center text-xs"
                  >
                    ⚙️
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white truncate">
                    {myDisplayName}
                  </div>
                </div>

                {/* Tile 2: Partner Video with "New" Badge */}
                <div className="relative w-44 h-28 sm:w-52 sm:h-32 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg flex items-center justify-center">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${
                      isPartnerConnected ? "opacity-100" : "opacity-0 absolute"
                    }`}
                  />
                  {!isPartnerConnected && (
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-lg">
                      {partnerDetails.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#E04F3E] text-white flex items-center justify-center text-[10px]">
                    🔇
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-medium text-white truncate">
                    <span className="truncate">{partnerDetails.name}</span>
                    <span className="text-[#FACC15] font-extrabold text-[10px] shrink-0">
                      New
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Wide 16:9 Stage (Screenshot #17 Topic Card or Screenshot #4 Host Guide) */}
              <div className="flex-1 bg-black rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden border border-white/5">
                {stageMode === "topic_card" ? (
                  /* SCREENSHOT #17: White Illustrated Topic Card */
                  <div className="bg-white text-slate-900 rounded-[28px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center">
                          ∞
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          JustSpeak
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="text-[11px] font-bold text-purple-600 hover:underline"
                      >
                        Next Prompt 🔄
                      </button>
                    </div>

                    {/* Purple Globe in Hand Illustration (Screenshot #17) */}
                    <div className="py-1">
                      <svg viewBox="0 0 140 110" className="w-32 h-24">
                        <circle cx="70" cy="42" r="28" fill="#8B5CF6" />
                        <ellipse
                          cx="70"
                          cy="42"
                          rx="14"
                          ry="28"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <line
                          x1="42"
                          y1="42"
                          x2="98"
                          y2="42"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <path
                          d="M46 28 Q70 34 94 28"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M46 56 Q70 50 94 56"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.8"
                        />
                        {/* Sparkle dots */}
                        <circle cx="34" cy="24" r="2.5" fill="#A78BFA" />
                        <circle cx="106" cy="28" r="2" fill="#7C3AED" />
                        <circle cx="102" cy="58" r="2.5" fill="#8B5CF6" />
                        {/* Hand below globe */}
                        <path
                          d="M48 76 C56 72, 74 74, 92 84 L86 96 C70 88, 56 84, 44 82 Z"
                          fill="#F6AD97"
                        />
                      </svg>
                    </div>

                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                      {currentTopic}
                    </h2>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStageMode("host_guide")}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200"
                      >
                        🎬 Host Intro
                      </button>
                      <button
                        type="button"
                        onClick={() => setStageMode("conversation")}
                        className="text-xs font-extrabold text-white bg-[#0B2559] hover:bg-[#143375] px-5 py-2 rounded-xl shadow-sm"
                      >
                        Back to Full Video
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SCREENSHOT #4: Host Welcome / Icebreaker Stage */
                  <div className="bg-gradient-to-b from-[#CBD5E1] to-[#94A3B8] text-slate-900 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in duration-200">
                    <div className="w-20 h-20 rounded-full bg-amber-400 border-4 border-white shadow-md flex items-center justify-center text-4xl">
                      👋
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Welcome to your 7-Minute Session!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 max-w-md leading-relaxed">
                      Say hello to <strong>{partnerDetails.name}</strong>, share your thoughts on today&apos;s topic, and enjoy natural English practice!
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStageMode("topic_card")}
                        className="text-xs font-bold bg-white text-slate-800 px-4 py-2 rounded-xl shadow-xs"
                      >
                        View Topic Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setStageMode("conversation")}
                        className="text-xs font-extrabold bg-[#0B2559] text-white px-5 py-2 rounded-xl shadow-sm"
                      >
                        Start Speaking →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* RIGHT VERTICAL 5-BUTTON CONTROL RAIL (Screenshots #3, #4, #17) */}
          {/* =============================================================== */}
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3.5">
            {/* 1. Partner Info / Profile Button */}
            <button
              type="button"
              onClick={() => setShowPartnerModal(true)}
              title="Partner info & quick reaction"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#18191D]/90 hover:bg-[#25272E] text-white flex items-center justify-center shadow-xl border border-white/5 transition-all"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6H5z" />
              </svg>
            </button>

            {/* 2. Stage / Participants Mode Toggle (Switches between Screenshot #3 and #17/#4) */}
            <button
              type="button"
              onClick={() =>
                setStageMode((prev) =>
                  prev === "conversation" ? "topic_card" : "conversation"
                )
              }
              title="Toggle Topic Stage / Full Video"
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${
                stageMode !== "conversation"
                  ? "bg-[#0B2559] text-white border-blue-400/40"
                  : "bg-[#18191D]/90 hover:bg-[#25272E] text-white border-white/5"
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <circle cx="9" cy="7" r="3" />
                <circle cx="16" cy="7" r="3" />
                <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5H3z" />
                <path d="M15 14c2.8 0 5 1.8 5 5h-4" />
              </svg>
            </button>

            {/* 3. In-Call Chat Drawer Button */}
            <button
              type="button"
              onClick={() => setShowChatDrawer((prev) => !prev)}
              title="Open in-call chat"
              className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${
                showChatDrawer
                  ? "bg-[#0B2559] text-white border-blue-400/40"
                  : "bg-[#18191D]/90 hover:bg-[#25272E] text-white border-white/5"
              }`}
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              {unreadChatCount > 0 && !showChatDrawer && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* 4. Microphone Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleMic}
              title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl border transition-all ${
                isMicMuted
                  ? "bg-rose-600 text-white border-rose-400"
                  : "bg-[#18191D]/90 hover:bg-[#25272E] text-white border-white/5"
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* 5. Schedule Leave / Exit Button (Screenshot #3 highlighted state) */}
            <button
              type="button"
              onClick={() => {
                if (!scheduledToLeave) {
                  setScheduledToLeave(true);
                } else {
                  setShowLeaveConfirmModal(true);
                }
              }}
              title={
                scheduledToLeave
                  ? "Scheduled to leave (Tap again to leave now)"
                  : "Schedule to leave after this conversation"
              }
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all ${
                scheduledToLeave
                  ? "bg-white text-[#D92D20] border-[#D92D20]"
                  : "bg-[#18191D]/90 hover:bg-[#25272E] text-white border-white/5"
              }`}
            >
              {scheduledToLeave ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D92D20"
                  strokeWidth="2.1"
                >
                  <circle cx="9" cy="9" r="5" />
                  <polyline points="9 6.5 9 9 10.8 10" />
                  <path d="M9 17v2a2 2 0 0 0 2 2h7" />
                  <polyline points="17 13 21 17 17 21" />
                  <line x1="21" y1="17" x2="13" y2="17" />
                </svg>
              ) : (
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
            </button>
          </div>

          {/* Floating Emoji Reactions */}
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
        </div>

        {/* ================================================================= */}
        {/* IN-CALL CHAT SIDE DRAWER */}
        {/* ================================================================= */}
        {showChatDrawer && (
          <aside className="w-80 sm:w-96 bg-white text-ink border-l border-border/80 flex flex-col h-screen z-40 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    In-Call Chat & Expressions
                  </h3>
                  <p className="text-[10px] text-ink-soft">
                    Share words or reactions with {partnerDetails.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                className="text-ink-soft hover:text-ink text-xs font-bold p-1.5"
              >
                ✕
              </button>
            </div>

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

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-ink-soft px-4 gap-2">
                  <span className="text-2xl">💡</span>
                  <p className="font-semibold text-ink">
                    Type words or notes here
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    Help your partner with vocabulary or spelling during your conversation.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "me" ? "items-end" : "items-start"
                    }`}
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
                    <span className="text-[9px] text-ink-soft mt-0.5 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

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
                placeholder="Type a message..."
                maxLength={140}
                className="flex-1 text-xs border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 text-ink"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-[#0B2559] hover:bg-[#143375] disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Send
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* =================================================================== */}
      {/* SCREENSHOT #2: "Disconnected — Your ticket has been recovered." Modal */}
      {/* =================================================================== */}
      {showDisconnectedModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-4">
          {/* Top-right Waiting Room indicator from Screenshot #2 */}
          <div className="fixed top-6 right-8 flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm font-medium">
            <span>⏳</span>
            <span>Waiting Room</span>
          </div>

          <div className="bg-white text-slate-900 rounded-[28px] p-7 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-5 animate-in zoom-in-95 duration-200">
            {/* Pink Circle with Red Wi-Fi Slash Icon (Screenshot #2) */}
            <div className="w-16 h-16 rounded-full bg-[#FDE8E8] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#EC6B63] flex items-center justify-center relative">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EC6B63"
                  strokeWidth="2.2"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
                <div className="w-8 h-0.5 bg-[#EC6B63] -rotate-45 absolute" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Disconnected
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Your ticket has been recovered.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={handleMeetNewPartnerAfterDisconnect}
                className="w-full py-4 rounded-2xl bg-[#0B2559] hover:bg-[#143375] text-white font-bold text-sm sm:text-base transition-colors shadow-md"
              >
                Meet new partner
              </button>

              <button
                type="button"
                onClick={handleLeaveAfterDisconnect}
                className="w-full py-4 rounded-2xl bg-[#EAECEF] hover:bg-slate-300/80 text-slate-600 font-bold text-sm sm:text-base transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Memo Modal (Triggered by bottom-left "📄+ Memo" pill in Screenshot #3) */}
      {showMemoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowMemoModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{partnerFlag}</span>
                <div>
                  <h3 className="text-base font-extrabold">
                    Memo for {partnerDetails.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Private note • Only visible to you
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMemoModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              rows={4}
              maxLength={400}
              placeholder="Write notes about your partner (e.g. hobbies, city, favorite books)..."
              className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 resize-none"
            />

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowMemoModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSavePartnerMemo}>
                Save Memo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Info & Quick Reactions Modal */}
      {showPartnerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPartnerModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">Partner & Reactions</h3>
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-100">
              <span className="text-2xl">{partnerFlag}</span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {partnerDetails.name}
                </p>
                <p className="text-xs text-slate-500">
                  {partnerDetails.country || "Global Learner"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">
                Send Live Reaction
              </p>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
                {["👏", "👍", "❤️", "💡", "🔥", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      sendReaction(emoji);
                      setShowPartnerModal(false);
                    }}
                    className="text-2xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPartnerModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Leave / Schedule Leave Modal */}
      {showLeaveConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLeaveConfirmModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold">Leave Conversation?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are currently scheduled to leave after this conversation finishes. Would you like to cancel scheduled leave or end the call now?
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setScheduledToLeave(false);
                  setShowLeaveConfirmModal(false);
                }}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Stay for next session (Cancel scheduled leave)
              </button>
              <button
                type="button"
                onClick={handleEndCall}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                End Call & Go to Survey Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled to Leave Info Modal */}
      {showScheduleInfoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowScheduleInfoModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-extrabold">
              Scheduled to Leave After Conversation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When this option is enabled, you will complete your current 7-minute conversation and post-call survey, and then see your daily summary instead of automatically entering the next waiting room.
            </p>
            <button
              type="button"
              onClick={() => setShowScheduleInfoModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Device Settings Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-extrabold">Call Settings</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                <span className="font-semibold">Camera</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={flipCamera}
                    className="font-bold text-slate-700 hover:text-slate-950 underline"
                  >
                    🔄 Flip Camera
                  </button>
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className="font-bold text-[#0B2559] underline"
                  >
                    {isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                <span className="font-semibold">Microphone</span>
                <button
                  type="button"
                  onClick={toggleMic}
                  className="font-bold text-[#0B2559] underline"
                >
                  {isMicMuted ? "Unmute Mic" : "Mute Mic"}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                <span className="font-semibold">Partner Connection</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    triggerTicketRecovery();
                  }}
                  className="font-bold text-rose-600 underline"
                >
                  Report Disconnect
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0B2559] text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E0F12]" />}>
      <RoomContent />
    </Suspense>
  );
}