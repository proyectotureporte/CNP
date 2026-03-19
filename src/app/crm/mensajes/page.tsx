"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePusher } from "@/hooks/usePusher";
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  MapPin,
  FileText,
  UserPlus,
  Ban,
  ArrowLeft,
  Clock,
  Bot,
  User,
  Headset,
  Paperclip,
  Check,
  Copy,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { WhatsappLead, WhatsappMessage, LeadStatus } from "@/lib/types";
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from "@/lib/types";

type TabFilter = "CNP" | "Peritus" | "descartados";

interface LeadWithLastMessage extends Omit<WhatsappLead, 'convertedClient'> {
  lastMessage?: {
    content: string;
    direction: string;
    sender: string;
    timestamp: string;
  };
  convertedClient?: { _id: string; name: string; email: string };
}

interface LeadCounts {
  cnp: number;
  peritus: number;
  descartados: number;
}

export default function MensajesPage() {
  const [leads, setLeads] = useState<LeadWithLastMessage[]>([]);
  const [counts, setCounts] = useState<LeadCounts>({ cnp: 0, peritus: 0, descartados: 0 });
  const [selectedLead, setSelectedLead] = useState<LeadWithLastMessage | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("CNP");
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertEmail, setConvertEmail] = useState("");
  const [convertCompany, setConvertCompany] = useState("");
  const [convertPosition, setConvertPosition] = useState("");
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{
    password?: string;
    clientName?: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check disabled - route is public (will be protected by magic link in the future)

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const brand = activeTab === "descartados" ? "" : activeTab;
      const status = activeTab === "descartados" ? "descartado" : "";
      const sp = new URLSearchParams();
      if (search) sp.set("search", search);
      if (brand) sp.set("brand", brand);
      if (status) sp.set("status", status);

      const res = await fetch(`/api/whatsapp/leads?${sp}`);
      const data = await res.json();

      if (data.success) {
        setLeads(data.data);
        setCounts(data.counts);
      }
    } catch {
      console.error("Error fetching leads");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    setLoading(true);
    fetchLeads();
  }, [fetchLeads]);

  // Fetch messages for selected lead
  const fetchMessages = useCallback(async (leadId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/leads/${leadId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch {
      console.error("Error fetching messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Select lead
  const handleSelectLead = useCallback(
    async (lead: LeadWithLastMessage) => {
      setSelectedLead(lead);
      setMobileShowChat(true);
      await fetchMessages(lead._id);

      // Mark as read
      if (lead.unreadCount > 0) {
        fetch(`/api/whatsapp/leads/${lead._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unreadCount: 0 }),
        });
        setLeads((prev) =>
          prev.map((l) => (l._id === lead._id ? { ...l, unreadCount: 0 } : l))
        );
      }
    },
    [fetchMessages]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for new messages (relaxed interval since Pusher handles real-time)
  useEffect(() => {
    if (!selectedLead) return;

    pollingRef.current = setInterval(() => {
      fetchMessages(selectedLead._id);
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedLead, fetchMessages]);

  // Real-time: refresh on WhatsApp events
  usePusher(['whatsapp:message', 'whatsapp:lead'], () => {
    fetchLeads();
    if (selectedLead) fetchMessages(selectedLead._id);
  });

  // Send message
  async function handleSend() {
    if (!newMessage.trim() || !selectedLead || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/whatsapp/leads/${selectedLead._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        await fetchMessages(selectedLead._id);
        fetchLeads();
      } else {
        alert(data.error || "Error enviando mensaje");
      }
    } catch {
      alert("Error de conexion");
    } finally {
      setSending(false);
    }
  }

  // Discard lead
  async function handleDiscard() {
    if (!selectedLead) return;
    if (!confirm("¿Descartar esta conversacion?")) return;

    await fetch(`/api/whatsapp/leads/${selectedLead._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "descartado" }),
    });

    setSelectedLead(null);
    setMobileShowChat(false);
    fetchLeads();
  }

  // Convert lead to client
  async function handleConvert() {
    if (!selectedLead || converting) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/whatsapp/leads/${selectedLead._id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: convertEmail,
          company: convertCompany,
          position: convertPosition,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConvertResult({
          password: data.data.portalPassword,
          clientName: data.data.client.name,
        });
        setSelectedLead((prev) =>
          prev ? { ...prev, status: "convertido" as LeadStatus } : null
        );
        fetchLeads();
      } else {
        alert(data.error || "Error convirtiendo lead");
      }
    } catch {
      alert("Error de conexion");
    } finally {
      setConverting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return time;
    if (diffDays === 1) return `Ayer ${time}`;
    if (diffDays < 7)
      return `${d.toLocaleDateString("es-CO", { weekday: "short" })} ${time}`;
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  }

  const tabs: { key: TabFilter; label: string; countKey: keyof LeadCounts }[] = [
    { key: "CNP", label: "CNP", countKey: "cnp" },
    { key: "Peritus", label: "PERITUS", countKey: "peritus" },
    { key: "descartados", label: "DESCARTADOS", countKey: "descartados" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
          <MessageSquare className="h-5 w-5" style={{ color: "#2969b0" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1b5697" }}>
            Mensajes
          </h1>
          <p className="text-xs text-muted-foreground">Conversaciones WhatsApp</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Lead list */}
        <div
          className={cn(
            "flex w-full flex-col border-r md:w-[360px] lg:w-[400px]",
            mobileShowChat && "hidden md:flex"
          )}
        >
          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                  activeTab === tab.key
                    ? "border-b-2 border-[#2969b0] text-[#2969b0]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {counts[tab.countKey] > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                    {counts[tab.countKey]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o telefono..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Lead list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MessageSquare className="mb-2 h-8 w-8" />
                <p className="text-sm">Sin conversaciones</p>
              </div>
            ) : (
              <div className="space-y-0.5 p-1">
                {leads.map((lead) => (
                  <button
                    key={lead._id}
                    onClick={() => handleSelectLead(lead)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
                      selectedLead?._id === lead._id && "bg-accent"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                        lead.brand === "CNP" ? "bg-[#1b5697]" : "bg-emerald-600"
                      )}
                    >
                      {lead.name
                        ? lead.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {lead.name || lead.phone}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatTime(lead.lastMessageAt || lead._createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.lastMessage?.content || lead.motive || "Sin mensajes"}
                        </p>
                        {lead.unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#25D366] px-1 text-[10px] font-bold text-white">
                            {lead.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex gap-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1 py-0 text-[9px]",
                            LEAD_STATUS_COLORS[lead.status]?.bg,
                            LEAD_STATUS_COLORS[lead.status]?.text
                          )}
                        >
                          {LEAD_STATUS_LABELS[lead.status]}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Chat */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            !mobileShowChat && "hidden md:flex"
          )}
        >
          {selectedLead ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => {
                    setMobileShowChat(false);
                    setSelectedLead(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                    selectedLead.brand === "CNP" ? "bg-[#1b5697]" : "bg-emerald-600"
                  )}
                >
                  {selectedLead.name
                    ? selectedLead.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "?"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">
                      {selectedLead.name || "Sin nombre"}
                    </h2>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedLead.brand}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {selectedLead.phone && (
                      <span className="flex items-center gap-0.5">
                        <Phone className="h-2.5 w-2.5" />
                        {selectedLead.phone}
                      </span>
                    )}
                    {selectedLead.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {selectedLead.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {selectedLead.documents && selectedLead.documents.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" title="Documentos">
                      <Paperclip className="h-3 w-3" />
                      <span>{selectedLead.documents.length}</span>
                    </Button>
                  )}
                  {selectedLead.status !== "convertido" &&
                    selectedLead.status !== "descartado" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            setConvertEmail("");
                            setConvertCompany("");
                            setConvertPosition("");
                            setConvertResult(null);
                            setShowConvertDialog(true);
                          }}
                        >
                          <UserPlus className="h-3 w-3" />
                          Crear Cliente
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={handleDiscard}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                </div>
              </div>

              {/* Lead info bar */}
              {selectedLead.motive && (
                <div className="border-b bg-muted/30 px-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Motivo:</span> {selectedLead.motive}
                  </p>
                </div>
              )}

              {/* Documents bar */}
              {selectedLead.documents && selectedLead.documents.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b bg-muted/20 px-4 py-2">
                  {selectedLead.documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.fileUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs hover:bg-accent"
                    >
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="max-w-[120px] truncate">{doc.fileName}</span>
                      <Download className="h-2.5 w-2.5 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-4">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Sin mensajes aun</p>
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl space-y-1">
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex",
                          msg.direction === "outgoing" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "relative max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm",
                            msg.direction === "outgoing"
                              ? msg.sender === "ai"
                                ? "bg-[#e3f0d8]"
                                : "bg-[#d9fdd3]"
                              : "bg-white"
                          )}
                        >
                          {/* Sender label */}
                          {msg.sender === "ai" && (
                            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                              <Bot className="h-2.5 w-2.5" />
                              IA
                            </div>
                          )}
                          {msg.sender === "agent" && (
                            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-blue-600">
                              <Headset className="h-2.5 w-2.5" />
                              {msg.agentName || "Agente"}
                            </div>
                          )}
                          {msg.sender === "client" && msg.direction === "incoming" && (
                            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-gray-500">
                              <User className="h-2.5 w-2.5" />
                              Cliente
                            </div>
                          )}

                          {/* Content */}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                          {/* Timestamp */}
                          <div className="mt-0.5 flex items-center justify-end gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(msg.timestamp)}
                            </span>
                            {msg.direction === "outgoing" && (
                              <Check className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              {selectedLead.status !== "descartado" && (
                <div className="border-t bg-white p-3">
                  <div className="mx-auto flex max-w-2xl gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe un mensaje..."
                      className="min-h-[40px] max-h-[120px] resize-none text-sm"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <div className="rounded-full bg-muted p-6 mb-4">
                <MessageSquare className="h-12 w-12 opacity-30" />
              </div>
              <h3 className="text-lg font-medium mb-1">Mensajes WhatsApp</h3>
              <p className="text-sm">Selecciona una conversacion para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* Convert to Client Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Cliente</DialogTitle>
            <DialogDescription>
              Convertir lead a cliente del sistema. Se creara usuario portal y se enviara email con credenciales.
            </DialogDescription>
          </DialogHeader>

          {convertResult ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  Cliente creado exitosamente
                </p>
                <p className="text-sm text-green-700">{convertResult.clientName}</p>
              </div>

              {convertResult.password && (
                <div className="space-y-2">
                  <Label>Credenciales del Portal</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Usuario</p>
                      <p className="text-sm font-mono">{convertEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">Contraseña</p>
                      <p className="text-sm font-mono">{convertResult.password}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Usuario: ${convertEmail}\nContraseña: ${convertResult.password}`
                        );
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                    >
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setShowConvertDialog(false)}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Datos del lead</p>
                  <p className="text-sm font-medium">
                    {selectedLead?.name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLead?.phone} &middot; {selectedLead?.city}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="convert-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="convert-email"
                    value={convertEmail}
                    onChange={(e) => setConvertEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    type="email"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Se enviaran las credenciales del portal a este email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="convert-company">Empresa</Label>
                  <Input
                    id="convert-company"
                    value={convertCompany}
                    onChange={(e) => setConvertCompany(e.target.value)}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="convert-position">Cargo</Label>
                  <Input
                    id="convert-position"
                    value={convertPosition}
                    onChange={(e) => setConvertPosition(e.target.value)}
                    placeholder="Cargo del contacto"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConvertDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleConvert} disabled={!convertEmail || converting}>
                  {converting ? (
                    <>
                      <Clock className="mr-2 h-3 w-3 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-3 w-3" />
                      Crear Cliente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
