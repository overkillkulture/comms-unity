'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * VideoRoom — Jitsi Meet embedded video conferencing.
 * Each room gets a unique Jitsi room name based on the room/conversation ID.
 * Uses meet.jit.si (free, no account needed).
 */

interface VideoRoomProps {
  /** Unique room identifier — used to generate a stable Jitsi room name */
  roomId: string;
  /** Display name shown in the Jitsi call */
  displayName?: string;
  /** Called when the user hangs up or closes the video */
  onClose: () => void;
}

export function VideoRoom({ roomId, displayName, onClose }: VideoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate a deterministic but unique room name
  const jitsiRoomName = `CaseBuilderHQ_${roomId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const initJitsi = useCallback(() => {
    if (!containerRef.current || apiRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: jitsiRoomName,
      parentNode: containerRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'chat', 'raisehand', 'tileview', 'hangup',
          'participants-pane', 'toggle-camera',
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        DEFAULT_BACKGROUND: '#080c10',
      },
      userInfo: {
        displayName: displayName || 'Builder',
      },
    };

    // @ts-expect-error JitsiMeetExternalAPI loaded via script
    const api = new window.JitsiMeetExternalAPI(domain, options);
    apiRef.current = api;

    api.addEventListener('videoConferenceJoined', () => {
      setLoading(false);
    });

    api.addEventListener('readyToClose', () => {
      onClose();
    });
  }, [jitsiRoomName, displayName, onClose]);

  useEffect(() => {
    // Load the Jitsi external API script
    const existingScript = document.getElementById('jitsi-api-script');
    if (existingScript) {
      initJitsi();
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-api-script';
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => initJitsi();
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [initJitsi]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080c10]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 bg-[#0e161c] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📹</span>
          <span className="text-sm font-semibold text-emerald-400">Video Room</span>
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse">Connecting...</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/30"
        >
          Leave
        </button>
      </div>

      {/* Jitsi container */}
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}

/**
 * VideoRoomButton — A button that launches a VideoRoom overlay.
 * Drop this anywhere you want a "Start Video" button.
 */
export function VideoRoomButton({
  roomId,
  displayName,
  className,
  label,
}: {
  roomId: string;
  displayName?: string;
  className?: string;
  label?: string;
}) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowVideo(true)}
        className={className || 'flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/25'}
      >
        <span>📹</span>
        <span>{label || 'Video'}</span>
      </button>
      {showVideo && (
        <VideoRoom
          roomId={roomId}
          displayName={displayName}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
}
