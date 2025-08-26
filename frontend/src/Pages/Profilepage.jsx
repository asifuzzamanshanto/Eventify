// frontend/src/navbar/Pages/Profilepage.jsx
"use client";

import React from "react";
import { motion } from "motion/react";
import Cropper from "react-easy-crop";
import { cn } from "@/lib/utils";

/* ------------------------ image utils ------------------------ */
/** convert a Canvas to a File */
async function canvasToFile(canvas, fileName = "crop.jpg", mime = "image/jpeg", quality = 0.9) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], fileName, { type: mime, lastModified: Date.now() })),
      mime,
      quality
    );
  });
}

/** load an image to HTMLImageElement */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Create a cropped square File using the given crop area in pixels (from react-easy-crop).
 * We keep it high-res by exporting at targetSize (avatar workflow will be resized on server).
 */
async function getCroppedSquareFile(imageSrc, cropPixels, fileName, targetSize = 1200) {
  const image = await loadImage(imageSrc);

  // Create canvas for the crop (square)
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");

  // Draw the cropped area scaled into targetSize x targetSize
  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return canvasToFile(canvas, fileName, "image/jpeg", 0.9);
}

/* ------------------------ crop modal ------------------------ */
function SquareCropModal({ file, visible, onCancel, onCropped, title = "Crop Image" }) {
  const [imageUrl, setImageUrl] = React.useState("");
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);
  const [working, setWorking] = React.useState(false);

  React.useEffect(() => {
    if (!file) {
      setImageUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = React.useCallback((_croppedArea, croppedPx) => {
    setCroppedAreaPixels(croppedPx);
  }, []);

  async function handleConfirm() {
    if (!imageUrl || !croppedAreaPixels) return;
    setWorking(true);
    try {
      // Export a square JPEG ~1200px; backend will still square+resize
      const croppedFile = await getCroppedSquareFile(
        imageUrl,
        croppedAreaPixels,
        file?.name?.replace(/\.\w+$/, "") + "_square.jpg",
        1200
      );
      onCropped(croppedFile);
    } catch (e) {
      console.error(e);
      alert("Failed to crop the image.");
    } finally {
      setWorking(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            Cancel
          </button>
        </div>

        <div className="relative h-[60vh] w-full bg-black">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              zoomWithScroll
              restrictPosition={true}
              showGrid={false}
              objectFit="contain"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/70">Zoom</label>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 w-48 accent-white/80"
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={working}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
          >
            {working ? "Cropping…" : "Use This Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------ main page ------------------------ */
export default function ProfilePage({ className }) {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const [user, setUser] = React.useState({
    name: "Loading…",
    username: "",
    email: "",
    university: "",
    role: "",
    avatarUrl: "",
    clubLogoUrl: "",
    bio: "",
    _id: "",
    // organizer-only (view)
    clubName: "",
    clubPosition: "",
    clubWebsite: "",
    // student-only (view)
    department: "",
    academicYear: "",
    studentId: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Edit modal
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(user);

  // Crop modals
  const [avatarFile, setAvatarFile] = React.useState(null);
  const [logoFile, setLogoFile] = React.useState(null);
  const [showAvatarCrop, setShowAvatarCrop] = React.useState(false);
  const [showLogoCrop, setShowLogoCrop] = React.useState(false);

  const onChange = (k) => (v) =>
    setDraft((d) => ({
      ...d,
      [k]: typeof v === "string" ? v : v.target.value,
    }));

  // Load current user
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setError("");
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Auth check failed (${res.status})`);
        const me = await res.json();

        if (ignore) return;
        const normalized = {
          name: me.fullName ?? me.name ?? "",
          username: me.username ?? "",
          email: me.email ?? "",
          university: me.university ?? "",
          role: me.role ?? "",
          avatarUrl: me.avatarUrl || "",
          clubLogoUrl: me.clubLogoUrl || "",
          bio: me.bio ?? "",
          _id: me._id ?? "",
          // organizer
          clubName: me.clubName ?? "",
          clubPosition: me.clubPosition ?? "",
          clubWebsite: me.clubWebsite ?? "",
          // student
          department: me.department ?? "",
          academicYear: me.academicYear ?? "",
          studentId: me.studentId ?? "",
        };
        setUser(normalized);
        setDraft(normalized);
      } catch (e) {
        setError(e.message || "Failed to load profile.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  /* ------------------------ save profile text ------------------------ */
  async function saveProfile() {
    try {
      setError("");
      const body = {
        fullName: draft.name,
        username: draft.username,
        university: draft.university,
        bio: draft.bio,
      };

      if (user.role === "Organizer") {
        body.clubName = draft.clubName ?? "";
        body.clubPosition = draft.clubPosition ?? "";
        body.clubWebsite = draft.clubWebsite ?? "";
      }

      if (user.role === "Student") {
        body.department = draft.department ?? "";
        body.academicYear = draft.academicYear ?? "";
        body.studentId = draft.studentId ?? "";
      }

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Profile update failed (${res.status}): ${t}`);
      }
      const updated = await res.json();

      const normalized = {
        ...user,
        name: updated.fullName ?? updated.name ?? draft.name,
        username: updated.username ?? draft.username,
        university: updated.university ?? draft.university,
        bio: updated.bio ?? draft.bio,
        // organizer
        clubName:
          updated.clubName ?? (user.role === "Organizer" ? draft.clubName : ""),
        clubPosition:
          updated.clubPosition ??
          (user.role === "Organizer" ? draft.clubPosition : ""),
        clubWebsite:
          updated.clubWebsite ??
          (user.role === "Organizer" ? draft.clubWebsite : ""),
        // student
        department:
          updated.department ??
          (user.role === "Student" ? draft.department : ""),
        academicYear:
          updated.academicYear ??
          (user.role === "Student" ? draft.academicYear : ""),
        studentId:
          updated.studentId ?? (user.role === "Student" ? draft.studentId : ""),
      };
      setUser(normalized);
      setOpen(false);
    } catch (e) {
      setError(e.message || "Profile update failed");
      console.error(e);
      alert("Profile update failed. See console for details.");
    }
  }

  /* ------------------------ avatar flow ------------------------ */
  function pickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Avatar must be ≤ 5 MB.");
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setShowAvatarCrop(true);
    e.target.value = ""; // allow re-pick same file if canceled
  }

  async function uploadCroppedAvatar(croppedFile) {
    const formData = new FormData();
    formData.append("avatar", croppedFile);
    try {
      setError("");
      const res = await fetch("/api/users/me/avatar", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Avatar upload failed (${res.status}): ${t}`);
      }
      const data = await res.json();
      setUser((u) => ({ ...u, avatarUrl: data.avatarUrl }));
    } catch (err) {
      setError(err.message || "Failed to upload avatar");
      alert("Failed to upload avatar. See console.");
      console.error(err);
    } finally {
      setShowAvatarCrop(false);
      setAvatarFile(null);
    }
  }

  /* ------------------------ logo flow (organizer only) ------------------------ */
  function pickLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Club logo must be ≤ 5 MB.");
      e.target.value = "";
      return;
    }
    setLogoFile(file);
    setShowLogoCrop(true);
    e.target.value = "";
  }

  async function uploadCroppedLogo(croppedFile) {
    const formData = new FormData();
    formData.append("logo", croppedFile);
    try {
      setError("");
      const res = await fetch(`/api/users/${user._id}/club-logo`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Club logo upload failed (${res.status}): ${t}`);
      }
      const data = await res.json();
      setUser((u) => ({ ...u, clubLogoUrl: data.clubLogoUrl }));
    } catch (err) {
      setError(err.message || "Failed to upload club logo");
      alert("Failed to upload club logo. See console.");
      console.error(err);
    } finally {
      setShowLogoCrop(false);
      setLogoFile(null);
    }
  }

  return (
    <div
      className={cn(
        "dark relative z-10 mx-auto w-full max-w-5xl p-4 md:p-8",
        className
      )}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
          <p className="text-sm text-white/60">
            {loading
              ? "Loading your details…"
              : "View and edit your profile information."}
          </p>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>

        {/* Compact identity chip */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 pr-4">
          <img
            src={
              user.avatarUrl ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
            }
            alt={user.name}
            className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
          />
          <div className="leading-tight">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-white/60">@{user.username}</div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <motion.section
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
      >
        <div className="relative h-28 w-full bg-gradient-to-tr from-[#7d9dd2]/30 to-[#5fc3b1]/30" />
        <div className="-mt-8 px-5 pb-6">
          <img
            src={
              user.avatarUrl ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
            }
            alt={user.name}
            className="h-16 w-16 rounded-xl object-cover ring-2 ring-white/10"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{user.name}</h3>
            {user.role && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white ring-1 ring-white/10">
                {user.role}
              </span>
            )}
          </div>

          <dl className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
            <div>
              <dt className="text-white/60">Username</dt>
              <dd>@{user.username || "—"}</dd>
            </div>
            <div>
              <dt className="text-white/60">Email</dt>
              <dd>{user.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-white/60">University</dt>
              <dd>{user.university || "—"}</dd>
            </div>

            {/* Organizer-only details (view) */}
            {user.role === "Organizer" && (
              <>
                <div>
                  <dt className="text-white/60">Club Name</dt>
                  <dd>{user.clubName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Club Position</dt>
                  <dd>{user.clubPosition || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-white/60">Club Website</dt>
                  <dd>
                    {user.clubWebsite ? (
                      <a
                        href={user.clubWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 text-white/90 hover:text-white break-all"
                      >
                        {user.clubWebsite}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </>
            )}

            {/* Student-only details (view) */}
            {user.role === "Student" && (
              <>
                <div>
                  <dt className="text-white/60">Department</dt>
                  <dd>{user.department || "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Academic Year</dt>
                  <dd>{user.academicYear || "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/60">Student ID</dt>
                  <dd>{user.studentId || "—"}</dd>
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <dt className="text-white/60">Bio</dt>
              <dd className="whitespace-pre-wrap">{user.bio || "—"}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
              onClick={() => {
                setDraft(user);
                setOpen(true);
              }}
            >
              Edit Profile
            </button>

            {/* Avatar upload (opens crop modal) */}
            <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15">
              Change Avatar
              <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </label>

            {/* Organizer-only: Club logo upload (opens crop modal) */}
            {user.role === "Organizer" && (
              <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15">
                Upload Club Logo
                <input type="file" accept="image/*" onChange={pickLogo} className="hidden" />
              </label>
            )}
          </div>

          {/* Tiny hint */}
          <p className="mt-2 text-[11px] text-white/50">
            Max file size 5&nbsp;MB. You can crop a square before upload. Images are also processed
            server-side for optimal size.
          </p>

          {/* Organizer club logo preview */}
          {user.role === "Organizer" && user.clubLogoUrl && (
            <div className="mt-4">
              <p className="mb-1 text-xs text-white/60">Club Logo:</p>
              <img
                src={user.clubLogoUrl}
                alt="Club Logo"
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/10"
              />
            </div>
          )}
        </div>
      </motion.section>

      {/* Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-xl">
            <h4 className="mb-3 text-base font-semibold text-white">Edit Profile</h4>

            <Field label="Full Name">
              <input
                value={draft.name}
                onChange={onChange("name")}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
              />
            </Field>

            <Field label="Username">
              <input
                value={draft.username}
                onChange={onChange("username")}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
              />
            </Field>

            <Field label="University">
              <input
                value={draft.university}
                onChange={onChange("university")}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
              />
            </Field>

            {/* Organizer-only fields in modal */}
            {user.role === "Organizer" && (
              <>
                <Field label="Club Name">
                  <input
                    value={draft.clubName}
                    onChange={onChange("clubName")}
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
                  />
                </Field>

                <Field label="Club Position">
                  <input
                    value={draft.clubPosition}
                    onChange={onChange("clubPosition")}
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
                  />
                </Field>

                <Field label="Club Website">
                  <input
                    value={draft.clubWebsite}
                    onChange={onChange("clubWebsite")}
                    placeholder="https://your-club.example"
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
                  />
                </Field>
              </>
            )}

            {/* Student-only fields in modal */}
            {user.role === "Student" && (
              <>
                <Field label="Department">
                  <input
                    value={draft.department}
                    onChange={onChange("department")}
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
                  />
                </Field>

                <Field label="Academic Year">
                  <input
                    value={draft.academicYear}
                    onChange={onChange("academicYear")}
                    placeholder="e.g., 2nd Year"
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
                  />
                </Field>

                <Field label="Student ID">
                  <input
                    value={draft.studentId}
                    onChange={onChange("studentId")}
                    className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
                  />
                </Field>
              </>
            )}

            <Field label="Bio">
              <textarea
                rows={3}
                value={draft.bio}
                onChange={onChange("bio")}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#7d9dd2]/40"
              />
            </Field>

            <div className="mt-2 flex gap-2">
              <button
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
                onClick={saveProfile}
              >
                Save
              </button>
              <button
                className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar crop modal */}
      <SquareCropModal
        file={avatarFile}
        visible={showAvatarCrop}
        onCancel={() => {
          setShowAvatarCrop(false);
          setAvatarFile(null);
        }}
        onCropped={uploadCroppedAvatar}
        title="Crop Avatar"
      />

      {/* Club logo crop modal (organizer only) */}
      <SquareCropModal
        file={logoFile}
        visible={showLogoCrop}
        onCancel={() => {
          setShowLogoCrop(false);
          setLogoFile(null);
        }}
        onCropped={uploadCroppedLogo}
        title="Crop Club Logo"
      />
    </div>
  );
}

/* ---------- helper ---------- */
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-white/80">{label}</label>
      {children}
    </div>
  );
}
