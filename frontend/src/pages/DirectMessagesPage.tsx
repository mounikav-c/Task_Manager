import { useEffect, useMemo, useRef, useState, type KeyboardEventHandler } from "react";
import { MessageCircleMore, Phone, Send, UserCircle2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type DirectMessage, type DirectMessageMember } from "@/lib/api";
import { useAuthUser } from "@/contexts/AuthUserContext";
import { toast } from "@/components/ui/sonner";

interface Props {
  members: DirectMessageMember[];
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DirectMessagesPage({ members }: Props) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user, selectedDepartmentId } = useAuthUser();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeChatKeyRef = useRef<string | null>(null);

  const selectedMember = useMemo(
    () => members.find((member) => String(member.id) === memberId) ?? null,
    [memberId, members],
  );
  const selectedMemberId = selectedMember?.id ?? null;

  const loadMessages = async (userId: number, departmentId?: number | null) => {
    const latestMessages = await api.getConversationMessages(userId, departmentId);
    setMessages((currentMessages) => {
      if (JSON.stringify(currentMessages) === JSON.stringify(latestMessages)) {
        return currentMessages;
      }

      return latestMessages;
    });
  };

  useEffect(() => {
    if (!selectedMember || !selectedMemberId) {
      setMessages([]);
      activeChatKeyRef.current = null;
      return;
    }

    let isCancelled = false;
    const chatKey = `${selectedDepartmentId ?? "none"}:${selectedMemberId}`;

    const loadCurrentMessages = async () => {
      setIsLoadingMessages(activeChatKeyRef.current !== chatKey);

      try {
        const currentMessages = await api.getConversationMessages(selectedMemberId, selectedDepartmentId);
        if (!isCancelled) {
          activeChatKeyRef.current = chatKey;
          setMessages(currentMessages);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load messages", error);
          toast.error(error instanceof Error ? error.message : "Could not load messages");
          setMessages([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    void loadCurrentMessages();
    return () => {
      isCancelled = true;
    };
  }, [selectedDepartmentId, selectedMemberId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedMemberId || !user?.id || !draft.trim()) {
      return;
    }

    const trimmedDraft = draft.trim();
    setDraft("");

    const optimisticMessage: DirectMessage = {
      id: Date.now(),
      sender_conversation: trimmedDraft,
      receiver_conversation: trimmedDraft,
      sender_id: user.id,
      receiver_id: selectedMemberId,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setIsSending(true);

    try {
      const savedMessage = await api.sendMessage(user.id, selectedMemberId, trimmedDraft, selectedDepartmentId);
      setMessages((currentMessages) => [
        ...currentMessages.filter((message) => message.id !== optimisticMessage.id),
        savedMessage,
      ]);
      await loadMessages(selectedMemberId, selectedDepartmentId);
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== optimisticMessage.id));
      setDraft(trimmedDraft);
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (!selectedMember) {
    return (
      <div className="flex h-full flex-col">
        <TopNav title="Direct Messages" />
        <div className="flex-1 overflow-auto p-5 md:p-6">
          <div className="rounded-[1.75rem] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.84),rgba(243,244,255,0.58))] p-6 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.22)]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4338ca_0%,#7c3aed_100%)] text-white shadow-[0_20px_40px_-28px_rgba(79,70,229,0.6)]">
                <MessageCircleMore className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Direct Messages</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select any department member below. Your own profile is included, so you can also message yourself.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => {
                const isSelf = member.id === user?.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => navigate(`/messages/${member.id}`)}
                    className="flex items-center gap-3 rounded-2xl border border-white/65 bg-white/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-200/60 hover:shadow-[0_20px_50px_-36px_rgba(79,70,229,0.28)]"
                  >
                    <Avatar className="h-12 w-12 ring-1 ring-white/70">
                      <AvatarFallback className="text-sm font-semibold text-white" style={{ backgroundColor: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.name}
                        {isSelf ? " (You)" : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email || member.username}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasMessages = messages.length > 0;
  const isSelfConversation = selectedMember.id === user?.id;

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Direct Messages" />
      <div className="flex min-h-0 flex-1 flex-col p-5 md:p-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(240,244,255,0.6))] shadow-[0_30px_90px_-58px_rgba(15,23,42,0.24)]">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-1 ring-white/70">
                <AvatarFallback className="text-sm font-semibold text-white" style={{ backgroundColor: selectedMember.color }}>
                  {selectedMember.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {selectedMember.name}
                  {isSelfConversation ? " (You)" : ""}
                </h2>
                <p className="text-xs text-muted-foreground">{selectedMember.email || selectedMember.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl border-slate-200 bg-white/70" onClick={() => navigate("/members")}>
                <UserCircle2 className="mr-2 h-4 w-4" />
                View Profile
              </Button>
              <Button variant="outline" className="rounded-xl border-slate-200 bg-white/70" type="button">
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {isLoadingMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading messages...</div>
            ) : !hasMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="w-full max-w-xl text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[radial-gradient(circle_at_top,#818cf8_0%,#4f46e5_58%,#312e81_100%)] text-white shadow-[0_24px_50px_-30px_rgba(79,70,229,0.62)]">
                    <MessageCircleMore className="h-9 w-9" />
                  </div>
                  <p className="mt-6 text-xl font-extrabold tracking-tight text-foreground">
                    Chat with {selectedMember.name}
                    {isSelfConversation ? " (You)" : ""}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Start conversation</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const messageText = isOwnMessage ? message.sender_conversation : message.receiver_conversation;

                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-[1.35rem] px-4 py-3 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.24)] ${
                          isOwnMessage
                            ? "bg-[linear-gradient(135deg,#5b21b6_0%,#7c3aed_100%)] text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{messageText}</p>
                        <p className={`mt-2 text-[11px] ${isOwnMessage ? "text-white/80" : "text-slate-500"}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/70 px-4 py-4 md:px-6">
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white/85 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedMember.name}${isSelfConversation ? " (You)" : ""}`}
                className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                onClick={() => void handleSend()}
                disabled={!selectedMemberId || !draft.trim() || isSending}
                className="h-11 rounded-xl bg-[linear-gradient(135deg,#4338ca_0%,#6d28d9_100%)] px-5 text-white shadow-[0_18px_30px_-22px_rgba(79,70,229,0.62)] hover:brightness-105"
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
