// frontend/src/Pages/OrganizerEventManage.jsx
"use client";

import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import Cropper from "react-easy-crop";
import {
  PencilLine,
  Save,
  X,
  Users as UsersIcon,
  FileCheck2,
  Image as ImageIcon,
  Info as InfoIcon,
  Ban,
  CheckCircle2,
  Upload,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------ API ------------------------------- */
// Adjust endpoints if yours differ.
async function apiJSON(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
async function uploadForm(path, form) {
  return apiJSON(path, { method: "POST", body: form });
}
async function patchJSON(path, body) {
  return apiJSON(path, { method: "PATCH", body: JSON.stringify(body) });
}
async function putJSON(path, body) {
  return apiJSON(path, { method: "PUT", body: JSON.stringify(body) });
}

/** ------------------------------------------------------------------
 * Page: OrganizerEventManage (view → edit)
 * - Loads event from backend
 * - Saves edits
 * - Uploads cropped banner only when changed
 * - Certificates tab: upload template + save mapping (PER EVENT)
 * ------------------------------------------------------------------*/
export default function OrganizerEventManage({ className }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation(); // maybe { event }
  const [event, setEvent] = React.useState(state?.event || null);
  const [loading, setLoading] = React.useState(!state?.event);
  const [err, setErr] = React.useState("");

  // Tabs: "overview" | "participants" | "certificates"
  const [tab, setTab] = React.useState("overview");

  // Edit mode state
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(() =>
    pickEditable(state?.event || {})
  );

  // Banner upload + crop
  const [bannerSrc, setBannerSrc] = React.useState("");
  const [croppedBannerURL, setCroppedBannerURL] = React.useState(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);

  React.useEffect(() => {
    let abort = false;
    if (state?.event) return; // already hydrated
    (async () => {
      try {
        setLoading(true);
        const data = await apiJSON(`/api/events/${id}`);
        if (!abort) {
          setEvent(data);
          setDraft(pickEditable(data));
        }
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to fetch event.");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [id, state?.event]);

  function startEdit() {
    setIsEditing(true);
    setDraft(pickEditable(event || {}));
    setBannerSrc("");
    setCroppedBannerURL(null);
    setErr("");
  }
  function cancelEdit() {
    setIsEditing(false);
    setDraft(pickEditable(event || {}));
    setBannerSrc("");
    setCroppedBannerURL(null);
    setErr("");
  }

  async function saveEdit() {
    try {
      // 1) Save core fields
      const updated = await putJSON(`/api/events/${id}`, {
        title: draft.title,
        date: draft.date,
        location: draft.location,
        description: draft.description,
      });

      // 2) If banner changed (user uploaded & cropped), upload separately
      if (croppedBannerURL) {
        const blob = await fetch(croppedBannerURL).then((r) => r.blob());
        const form = new FormData();
        form.append("banner", blob, "banner.jpg"); // server must enforce 16:9 & ≤10MB
        await uploadForm(`/api/events/${id}/banner`, form);
      }

      // 3) Refresh event
      const fresh = await apiJSON(`/api/events/${id}`);
      setEvent(fresh);
      setIsEditing(false);
      alert("Saved.");
    } catch (e) {
      alert(e.message || "Failed to save.");
    }
  }

  function handleDraftChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function handleBannerUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("Only image files allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErr("Max size 10 MB.");
      return;
    }
    setErr("");
    setBannerSrc(URL.createObjectURL(f));
    setCroppedBannerURL(null);
  }
  const onCropComplete = React.useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);
  async function confirmCrop() {
    try {
      const cropped = await getCroppedImg(bannerSrc, croppedAreaPixels);
      setCroppedBannerURL(cropped);
    } catch (e) {
      console.error(e);
      setErr("Failed to crop. Try another image.");
    }
  }

  // Participants selection (for quick actions inside this page if needed later)
  const [profile, setProfile] = React.useState(null);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAllParticipants() {
    const allIds = (event?.participants || []).map((p) => p.id);
    const allSelected = selectedIds.size === allIds.length && allIds.length > 0;
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }
  async function bulkParticipants(action) {
    if (!selectedIds.size) return;
    try {
      await apiJSON(`/api/events/${id}/participants/batch`, {
        method: "POST",
        body: JSON.stringify({ action, userIds: [...selectedIds] }),
      });
      // optional: refresh event if it carries participants on this payload
      const fresh = await apiJSON(`/api/events/${id}`);
      setEvent(fresh);
      setSelectedIds(new Set());
    } catch (e) {
      alert(e.message || "Failed to update participants.");
    }
  }

  // Delete event
  async function deleteEvent() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await apiJSON(`/api/events/${id}`, { method: "DELETE" });
      navigate("/organizers/myevents", { replace: true });
    } catch (e) {
      alert(e.message || "Failed to delete.");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-white/70">Loading…</div>
    );
  }
  if (err || !event) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-white/70">
        {err || "Event not found."}
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-6xl p-4 md:p-8 text-white", className)}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mr-3 rounded-lg bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/15"
          >
            ← Back
          </button>
          <h1 className="mt-2 text-2xl font-semibold">
            {isEditing ? "Edit Event" : "Event Manager"}
          </h1>
          <p className="text-sm text-white/60">
            {isEditing ? "Make changes and save." : "View details, participants and certificates."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
              >
                <PencilLine className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={deleteEvent}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
              >
                <Trash2 className="h-4 w-4" />
                Delete Event
              </button>
            </>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Banner / Cropper */}
      <div className="mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
        {!isEditing || (!bannerSrc && !croppedBannerURL) ? (
          <img
            src={event.banner}
            alt={event.title}
            className="h-[260px] w-full object-cover sm:h-[360px]"
          />
        ) : (
          <>
            {!croppedBannerURL ? (
              <div className="relative aspect-[16/9] w-full bg-black">
                <Cropper
                  image={bannerSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            ) : (
              <img
                src={croppedBannerURL}
                alt="Cropped Banner"
                className="h-[260px] w-full object-cover sm:h-[360px]"
              />
            )}
          </>
        )}
      </div>

      {/* Upload controls only in edit mode */}
      {isEditing && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
            <Upload className="h-4 w-4" />
            <span>Upload New Banner</span>
            <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </label>

          {bannerSrc && !croppedBannerURL && (
            <>
              <button
                onClick={confirmCrop}
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
              >
                Confirm Crop
              </button>
              <button
                onClick={() => {
                  setBannerSrc("");
                  setCroppedBannerURL(null);
                }}
                className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/30"
              >
                Cancel Upload
              </button>
            </>
          )}

          {err && <span className="text-sm text-red-400">{err}</span>}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          <ImageIcon className="h-4 w-4" /> Overview
        </TabButton>
        <TabButton active={tab === "participants"} onClick={() => setTab("participants")}>
          <UsersIcon className="h-4 w-4" /> Participants
        </TabButton>
        <TabButton active={tab === "certificates"} onClick={() => setTab("certificates")}>
          <FileCheck2 className="h-4 w-4" /> Certificates
        </TabButton>
      </div>

      {/* Panels */}
      {tab === "overview" && (
        <OverviewPanel isEditing={isEditing} draft={draft} onChange={handleDraftChange} event={event} />
      )}

      {tab === "participants" && (
        <ParticipantsPanel
          participants={event.participants || []}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleAll={toggleAllParticipants}
          bulkBan={() => bulkParticipants("ban")}
          bulkComplete={() => bulkParticipants("complete")}
          setProfile={setProfile}
        />
      )}

      {tab === "certificates" && (
        <CertificatesPanel
          eventId={id}
          existing={event.certificate || { templateSrc: "", mapping: {} }}
          onSaved={async () => {
            // refresh to reflect saved mapping/template
            const fresh = await apiJSON(`/api/events/${id}`);
            setEvent(fresh);
            alert("Certificate settings saved.");
          }}
          sampleData={{
            name: "John Doe",
            institution: "North South University",
            eventName: event.title,
            eventDate: new Date(event.date).toLocaleDateString(),
          }}
        />
      )}

      {/* Floating Profile Modal */}
      {profile && (
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <img src={profile.avatar} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
            <h3 className="text-lg font-semibold">{profile.name}</h3>
            <p className="text-sm text-white/60">@{profile.username}</p>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setProfile(null)}
              className="rounded-lg bg-white/10 px-4 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ---------------------------- Panels ----------------------------- */

function OverviewPanel({ isEditing, draft, onChange, event }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6"
    >
      {!isEditing ? (
        <>
          <h2 className="mb-3 text-lg font-semibold">Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Title" value={event.title} />
            <InfoBox label="Date & Time" value={formatDateTime(event.date)} />
            <InfoBox label="Location" value={event.location} />
            <InfoBox label "Status" value={event.status} />
          </div>
          <div className="mt-4">
            <h3 className="mb-1 text-sm font-semibold">Description</h3>
            <p className="whitespace-pre-line text-sm text-white/80">{event.description}</p>
          </div>
        </>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold">Edit Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                type="text"
                name="title"
                value={draft.title}
                onChange={onChange}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input
                type="datetime-local"
                name="date"
                value={draft.date}
                onChange={onChange}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Location</label>
              <input
                type="text"
                name="location"
                value={draft.location}
                onChange={onChange}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={draft.description}
                onChange={onChange}
                rows={5}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                required
              />
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}

function ParticipantsPanel({
  participants,
  selectedIds,
  toggleSelect,
  toggleAll,
  bulkBan,
  bulkComplete,
  setProfile,
}) {
  const allSelected = participants.length > 0 && selectedIds.size === participants.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Participants</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleAll}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/10 hover:bg-white/15"
          >
            {allSelected ? "Unselect All" : "Select All"}
          </button>
          <button
            onClick={bulkBan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
          >
            <Ban className="h-3.5 w-3.5" />
            Ban
          </button>
          <button
            onClick={bulkComplete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Completed
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {participants.length ? (
          participants.map((p) => {
            const checked = selectedIds.has(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-white"
                  checked={checked}
                  onChange={() => toggleSelect(p.id)}
                />
                <img src={p.avatar} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    {p.done && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-400/30">
                        Completed
                      </span>
                    )}
                    <InfoIcon
                      className="ml-1 h-4 w-4 cursor-pointer text-white/60 hover:text-white"
                      title="View profile"
                      onClick={() => setProfile(p)}
                    />
                  </div>
                  <div className="truncate text-xs text-white/60">@{p.username}</div>
                </div>
              </li>
            );
          })
        ) : (
          <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
            No participants yet.
          </li>
        )}
      </ul>
    </motion.section>
  );
}

/** ------------------------------------------------------------------
 * Certificates Panel (Upload template + map fields only)
 * Backed endpoints:
 *   POST   /api/events/:id/certificate-template   (FormData { template })
 *   PATCH  /api/events/:id/certificate-mapping   (JSON { mapping })
 * ------------------------------------------------------------------*/
function CertificatesPanel({ eventId, existing, onSaved, sampleData }) {
  const [templateSrc, setTemplateSrc] = React.useState(existing?.templateSrc || "");
  const [mapping, setMapping] = React.useState(
    existing?.mapping || {
      name:        { x: 50, y: 50, w: 40, font: 22, align: "center", visible: true },
      institution: { x: 50, y: 60, w: 40, font: 16, align: "center", visible: true },
      eventName:   { x: 50, y: 70, w: 40, font: 16, align: "center", visible: true },
      eventDate:   { x: 50, y: 78, w: 30, font: 14, align: "center", visible: true },
    }
  );
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function handleTemplateUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("Please upload an image (PNG/JPG).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErr("Max size 10 MB.");
      return;
    }
    setErr("");

    try {
      setBusy(true);
      const form = new FormData();
      form.append("template", f);
      const res = await uploadForm(`/api/events/${eventId}/certificate-template`, form);
      // EXPECTED: { url: "https://..." }
      const url = res?.url || URL.createObjectURL(f);
      setTemplateSrc(url);
    } catch (e2) {
      setErr(e2.message || "Failed to upload template.");
    } finally {
      setBusy(false);
    }
  }

  function setField(key, patch) {
    setMapping((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function saveMapping() {
    try {
      setBusy(true);
      await patchJSON(`/api/events/${eventId}/certificate-mapping`, { mapping });
      onSaved?.();
    } catch (e) {
      alert(e.message || "Failed to save mapping.");
    } finally {
      setBusy(false);
    }
  }

  const fields = [
    { key: "name", label: "Participant Name", sample: sampleData.name },
    { key: "institution", label: "Institution", sample: sampleData.institution },
    { key: "eventName", label: "Event Name", sample: sampleData.eventName },
    { key: "eventDate", label: "Event Date", sample: sampleData.eventDate },
  ];
  const [activeField, setActiveField] = React.useState("name");

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Certificate Template & Mapping</h2>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
            <Upload className="h-4 w-4" />
            <span>Upload Template</span>
            <input type="file" accept="image/*" onChange={handleTemplateUpload} className="hidden" />
          </label>

          <button
            onClick={saveMapping}
            disabled={busy}
            className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save Mapping"}
          </button>
        </div>
      </div>

      {err && <p className="mb-3 text-sm text-red-400">{err}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Preview */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-lg bg-neutral-900">
            {templateSrc ? (
              <img src={templateSrc} alt="Template" className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-white/50">
                No template uploaded
              </div>
            )}

            {/* overlays */}
            {templateSrc &&
              fields.map(({ key, label, sample }) => {
                const m = mapping[key];
                if (!m?.visible) return null;
                const style = {
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  width: `${m.w}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: `${m.font}px`,
                  textAlign: m.align,
                };
                return (
                  <div
                    key={key}
                    className="pointer-events-none absolute rounded-md px-1 py-0.5 ring-1 ring-white/20"
                    style={style}
                    title={label}
                  >
                    <span className="block w-full truncate">{sample}</span>
                  </div>
                );
              })}
          </div>
          <p className="mt-2 text-xs text-white/60">
            Overlays show sample text only. Certificates are generated on your server after organizers mark participants as completed.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-semibold">Fields</h3>

          <div className="mb-3 flex flex-wrap gap-2">
            {fields.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveField(f.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs ring-1",
                  activeField === f.key
                    ? "bg-white/15 text-white ring-white/20"
                    : "bg-white/10 text-white/80 ring-white/10 hover:bg-white/15"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <FieldControls
            value={mapping[activeField]}
            onChange={(patch) =>
              setMapping((prev) => ({ ...prev, [activeField]: { ...prev[activeField], ...patch } }))
            }
          />

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <label className="mb-1 block text-sm font-medium">Visibility</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mapping[activeField].visible}
                onChange={(e) =>
                  setMapping((prev) => ({
                    ...prev,
                    [activeField]: { ...prev[activeField], visible: e.target.checked },
                  }))
                }
              />
              <span className="text-sm">Show this field</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function FieldControls({ value, onChange }) {
  if (!value) return null;
  const num = (v) => (typeof v === "number" ? v : parseFloat(v) || 0);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <h4 className="mb-2 text-sm font-semibold">Position & Style</h4>

      <div className="grid grid-cols-2 gap-3">
        <LabeledRange label="X (%)" min={0} max={100} step={0.5} value={value.x} onChange={(x) => onChange({ x: num(x) })} />
        <LabeledRange label="Y (%)" min={0} max={100} step={0.5} value={value.y} onChange={(y) => onChange({ y: num(y) })} />
        <LabeledRange label="Width (%)" min={5} max={90} step={0.5} value={value.w} onChange={(w) => onChange({ w: num(w) })} />
        <LabeledRange label="Font (px)" min={10} max={64} step={1} value={value.font} onChange={(font) => onChange({ font: num(font) })} />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium">Align</label>
        <div className="flex gap-2">
          {["left", "center", "right"].map((a) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              className={cn(
                "rounded-md px-3 py-1 text-xs ring-1",
                value.align === a
                  ? "bg-white/15 text-white ring-white/20"
                  : "bg-white/10 text-white/80 ring-white/10 hover:bg-white/15"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LabeledRange({ label, value, onChange, min, max, step }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/70">
        {label}: <span className="font-mono text-white">{value}</span>
      </label>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* ------------------------- Small Components ------------------------ */

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ring-1",
        active
          ? "bg-white/15 text-white ring-white/20"
          : "bg-white/10 text-white/80 ring-white/10 hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      {typeof value === "string" ? (
        <div className="mt-1 text-sm text-white/90">{value}</div>
      ) : (
        <div className="mt-1">{value}</div>
      )}
    </div>
  );
}

/* ----------------------------- Utils ------------------------------- */

function pickEditable(e) {
  return {
    title: e?.title || "",
    date: e?.date || "",
    location: e?.location || "",
    description: e?.description || "",
  };
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Canvas crop helper — returns a blob URL JPEG */
async function getCroppedImg(imageSrc, cropPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    }, "image/jpeg", 0.92);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}
