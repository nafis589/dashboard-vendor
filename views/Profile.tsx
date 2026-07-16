'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateVendorProfile, useVendorProfile } from '@/hooks/useVendorProfile';
import { fileToDataUrl } from '@/lib/images';
import type { VendorProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

const AVATAR_COLORS = ['#E8B4B8', '#B4C8E8', '#B4E8C8', '#E8D4B4', '#D4B4E8', '#C8E8B4'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function profileInitials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0] ?? '';
  const last = lastName.trim()[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-sm text-[#999]">{children}</p>;
}

function FieldValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm font-medium text-[#1A1A1A]', className)}>{children}</p>;
}

interface ProfileAvatarSectionProps {
  profile: VendorProfile;
  onAvatarChange: (file: File) => Promise<void>;
  uploading: boolean;
}

function ProfileAvatarSection({ profile, onAvatarChange, uploading }: ProfileAvatarSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = profileInitials(profile.first_name, profile.last_name);
  const color = avatarColor(`${profile.first_name}${profile.last_name}`);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith('image/')) return;
      await onAvatarChange(file);
    },
    [onAvatarChange],
  );

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="group relative size-24 overflow-hidden rounded-full disabled:cursor-wait disabled:opacity-70"
          aria-label="Changer la photo de profil"
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span
              className="flex size-full items-center justify-center text-2xl font-semibold text-[#1A1A1A]"
              style={{ backgroundColor: color }}
            >
              {initials}
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition-colors group-hover:bg-black/10" />
          <span className="pointer-events-none absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-white text-[#1A1A1A] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            <Pencil className="size-3.5" />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex items-center gap-10">
        <div className="text-center">
          <p className="text-[22px] font-bold leading-none text-[#1A1A1A]">
            {profile.followers_count ?? 0}
          </p>
          <p className="mt-1.5 text-sm text-[#999]">Abonnés</p>
        </div>
        <div className="text-center">
          <p className="text-[22px] font-bold leading-none text-[#1A1A1A]">
            {profile.following_count ?? 0}
          </p>
          <p className="mt-1.5 text-sm text-[#999]">Abonnements</p>
        </div>
      </div>
    </div>
  );
}

interface PersonalInfoForm {
  first_name: string;
  last_name: string;
  phone: string;
}

interface ShopForm {
  shop_name: string;
  shop_description: string;
}

interface EditableCardProps {
  title: string;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

function EditableCard({
  title,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  children,
}: EditableCardProps) {
  return (
    <section className="rounded-xl border border-[#E8E8E8] bg-white p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-[#1A1A1A]">{title}</h2>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={onSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Save changes'}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            ✏️ Edit
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Profile() {
  const { data: profile, isLoading, isError } = useVendorProfile();
  const updateMutation = useUpdateVendorProfile();

  const [personalEditing, setPersonalEditing] = useState(false);
  const [shopEditing, setShopEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingSection, setSavingSection] = useState<'personal' | 'shop' | null>(null);

  const [personalForm, setPersonalForm] = useState<PersonalInfoForm>({
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [shopForm, setShopForm] = useState<ShopForm>({
    shop_name: '',
    shop_description: '',
  });

  useEffect(() => {
    if (!profile) return;
    setPersonalForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? '',
    });
    setShopForm({
      shop_name: profile.shop_name,
      shop_description: profile.shop_description ?? '',
    });
  }, [profile]);

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await updateMutation.mutateAsync({ avatar_url: dataUrl });
      toast.success('Photo mise à jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
    } finally {
      setAvatarUploading(false);
    }
  };

  const savePersonalInfo = async () => {
    setSavingSection('personal');
    try {
      await updateMutation.mutateAsync({
        first_name: personalForm.first_name.trim(),
        last_name: personalForm.last_name.trim(),
        phone: personalForm.phone.trim() || null,
      });
      toast.success('Informations mises à jour');
      setPersonalEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingSection(null);
    }
  };

  const saveShopInfo = async () => {
    setSavingSection('shop');
    try {
      await updateMutation.mutateAsync({
        shop_name: shopForm.shop_name.trim(),
        shop_description: shopForm.shop_description.trim() || null,
      });
      toast.success('Informations mises à jour');
      setShopEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingSection(null);
    }
  };

  const cancelPersonalEdit = () => {
    if (!profile) return;
    setPersonalForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? '',
    });
    setPersonalEditing(false);
  };

  const cancelShopEdit = () => {
    if (!profile) return;
    setShopForm({
      shop_name: profile.shop_name,
      shop_description: profile.shop_description ?? '',
    });
    setShopEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-8">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex gap-10">
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return <p className="text-destructive">Impossible de charger le profil.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Profil</h1>

      <ProfileAvatarSection
        profile={profile}
        onAvatarChange={handleAvatarUpload}
        uploading={avatarUploading}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <EditableCard
          title="Personal Info"
          editing={personalEditing}
          saving={savingSection === 'personal'}
          onEdit={() => setPersonalEditing(true)}
          onCancel={cancelPersonalEdit}
          onSave={() => void savePersonalInfo()}
        >
          <div className="grid grid-cols-1 gap-6 transition-all duration-200 sm:grid-cols-2">
            <div>
              <FieldLabel>Prénom</FieldLabel>
              {personalEditing ? (
                <Input
                  value={personalForm.first_name}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  placeholder="Prénom"
                  className="transition-all duration-200"
                />
              ) : (
                <FieldValue>{profile.first_name || '—'}</FieldValue>
              )}
            </div>

            <div>
              <FieldLabel>Nom</FieldLabel>
              {personalEditing ? (
                <Input
                  value={personalForm.last_name}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  placeholder="Nom"
                  className="transition-all duration-200"
                />
              ) : (
                <FieldValue>{profile.last_name || '—'}</FieldValue>
              )}
            </div>

            <div>
              <FieldLabel>Email</FieldLabel>
              {personalEditing ? (
                <Input
                  type="email"
                  value={profile.email}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-[#F5F5F5] text-[#999] transition-all duration-200"
                />
              ) : (
                <FieldValue>{profile.email}</FieldValue>
              )}
            </div>

            <div>
              <FieldLabel>Téléphone</FieldLabel>
              {personalEditing ? (
                <Input
                  type="tel"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Téléphone"
                  className="transition-all duration-200"
                />
              ) : (
                <FieldValue>{profile.phone || '—'}</FieldValue>
              )}
            </div>
          </div>
        </EditableCard>

        <EditableCard
          title="Boutique"
          editing={shopEditing}
          saving={savingSection === 'shop'}
          onEdit={() => setShopEditing(true)}
          onCancel={cancelShopEdit}
          onSave={() => void saveShopInfo()}
        >
          <div className="grid grid-cols-1 gap-6">
            <div>
              <FieldLabel>Nom de la boutique</FieldLabel>
              {shopEditing ? (
                <Input
                  value={shopForm.shop_name}
                  onChange={(e) => setShopForm((prev) => ({ ...prev, shop_name: e.target.value }))}
                  placeholder="Nom de la boutique"
                  className="transition-all duration-200"
                />
              ) : (
                <FieldValue>{profile.shop_name || '—'}</FieldValue>
              )}
            </div>

            <div>
              <FieldLabel>Description de la boutique</FieldLabel>
              {shopEditing ? (
                <Textarea
                  value={shopForm.shop_description}
                  onChange={(e) =>
                    setShopForm((prev) => ({ ...prev, shop_description: e.target.value }))
                  }
                  placeholder="Description de la boutique"
                  rows={4}
                  className="transition-all duration-200"
                />
              ) : (
                <FieldValue className="whitespace-pre-wrap">
                  {profile.shop_description || '—'}
                </FieldValue>
              )}
            </div>
          </div>
        </EditableCard>
      </div>
    </div>
  );
}
