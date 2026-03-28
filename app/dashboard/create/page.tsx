'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Info, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  Music, 
  Settings, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const invitationSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  location: z.string().min(5, 'Lokasi minimal 5 karakter'),
  mapsUrl: z.string().url('URL Google Maps tidak valid').optional().or(z.literal('')),
  description: z.string().optional(),
  slug: z.string().min(3, 'Slug minimal 3 karakter').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  musicUrl: z.string().url('URL Musik tidak valid').optional().or(z.literal('')),
  story: z.array(z.object({
    year: z.string(),
    content: z.string()
  })).optional(),
  gallery: z.array(z.string().url('URL Foto tidak valid')).optional(),
});

type InvitationForm = z.infer<typeof invitationSchema>;

export default function InvitationEditor() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params.id;
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      title: '',
      date: '',
      location: '',
      mapsUrl: '',
      description: '',
      slug: '',
      musicUrl: '',
      story: [],
      gallery: []
    }
  });

  const { fields: storyFields, append: appendStory, remove: removeStory } = useFieldArray({
    control,
    name: 'story'
  });

  const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({
    control,
    name: 'gallery' as never
  });

  useEffect(() => {
    if (isEdit && user) {
      const fetchInvitation = async () => {
        try {
          const docRef = doc(db, 'invitations', params.id as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userId !== user.uid) {
              router.push('/dashboard');
              return;
            }
            // Populate form
            Object.entries(data.data).forEach(([key, value]) => {
              setValue(key as any, value);
            });
            setValue('slug', data.slug);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `invitations/${params.id}`);
        }
      };
      fetchInvitation();
    }
  }, [isEdit, params.id, user, setValue, router]);

  const checkSlugUnique = async (slug: string) => {
    const q = query(collection(db, 'invitations'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (isEdit) {
      return snapshot.docs.every(doc => doc.id === params.id);
    }
    return snapshot.empty;
  };

  const onSubmit = async (data: InvitationForm) => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const isUnique = await checkSlugUnique(data.slug);
      if (!isUnique) {
        setError('URL (Slug) sudah digunakan. Silakan pilih yang lain.');
        setSaving(false);
        return;
      }

      const invitationData = {
        userId: user.uid,
        slug: data.slug,
        templateId: 'default',
        status: isEdit ? 'active' : 'draft', // Auto-active for now, usually needs payment
        data: {
          title: data.title,
          date: data.date,
          location: data.location,
          mapsUrl: data.mapsUrl,
          description: data.description,
          musicUrl: data.musicUrl,
          story: data.story,
          gallery: data.gallery
        },
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'invitations', params.id as string), invitationData);
        router.push('/dashboard');
      } else {
        const docRef = await addDoc(collection(db, 'invitations'), {
          ...invitationData,
          status: 'draft', // New invitations start as draft
          createdAt: new Date().toISOString()
        });
        router.push(`/dashboard/payment?id=${docRef.id}`);
      }
    } catch (error) {
      handleFirestoreError(error, isEdit ? OperationType.UPDATE : OperationType.CREATE, 'invitations');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof InvitationForm)[] = [];
    if (step === 1) fieldsToValidate = ['title', 'date', 'location', 'mapsUrl'];
    if (step === 2) fieldsToValidate = ['description', 'story'];
    if (step === 3) fieldsToValidate = ['gallery', 'musicUrl'];
    if (step === 4) fieldsToValidate = ['slug'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep(s => s + 1);
  };

  const steps = [
    { id: 1, title: 'Informasi Dasar', icon: <Info className="w-5 h-5" /> },
    { id: 2, title: 'Konten & Cerita', icon: <Calendar className="w-5 h-5" /> },
    { id: 3, title: 'Media', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 4, title: 'Pengaturan URL', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Undangan' : 'Buat Undangan Baru'}</h1>
          <p className="text-gray-600">Lengkapi data di bawah ini untuk membuat undangan digital Anda.</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-12 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-4 shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.id}
              </div>
              <span className={`text-sm font-bold hidden sm:inline ${step >= s.id ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.title}
              </span>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Judul Acara</label>
                    <input
                      {...register('title')}
                      placeholder="Contoh: Pernikahan Edi & Dian"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Tanggal & Waktu</label>
                    <input
                      {...register('date')}
                      type="datetime-local"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Lokasi Acara (Text)</label>
                  <textarea
                    {...register('location')}
                    placeholder="Contoh: Gedung Serbaguna, Jl. Mawar No. 123, Jakarta"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Link Google Maps (Optional)</label>
                  <input
                    {...register('mapsUrl')}
                    placeholder="https://goo.gl/maps/..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                  {errors.mapsUrl && <p className="text-red-500 text-xs mt-1">{errors.mapsUrl.message}</p>}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Deskripsi Acara</label>
                  <textarea
                    {...register('description')}
                    placeholder="Tuliskan kata-kata pembuka atau deskripsi acara Anda..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Cerita Perjalanan (Timeline)</label>
                    <button
                      type="button"
                      onClick={() => appendStory({ year: '', content: '' })}
                      className="text-pink-600 text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Tambah Cerita
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {storyFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex-1 space-y-4">
                          <input
                            {...register(`story.${index}.year`)}
                            placeholder="Tahun / Waktu (Contoh: 2020)"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                          />
                          <textarea
                            {...register(`story.${index}.content`)}
                            placeholder="Isi cerita..."
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStory(index)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Galeri Foto (URL Gambar)</label>
                    <button
                      type="button"
                      onClick={() => appendGallery('' as never)}
                      className="text-pink-600 text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Tambah Foto
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {galleryFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-center">
                        <input
                          {...register(`gallery.${index}` as any)}
                          placeholder="https://picsum.photos/..."
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeGallery(index)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Link Musik Background (URL MP3/YouTube)</label>
                  <div className="flex items-center gap-3">
                    <Music className="w-6 h-6 text-gray-400" />
                    <input
                      {...register('musicUrl')}
                      placeholder="https://example.com/music.mp3"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100 mb-8">
                  <div className="flex gap-3 items-start">
                    <Settings className="w-6 h-6 text-pink-600 shrink-0" />
                    <div>
                      <h3 className="font-bold text-pink-900 mb-1">Alamat Undangan Anda</h3>
                      <p className="text-pink-700 text-sm">Tentukan URL unik untuk undangan Anda. Contoh: undangankita.com/edi-dian</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Custom URL (Slug)</label>
                  <div className="flex items-center">
                    <div className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 font-medium">
                      undangankita.com/
                    </div>
                    <input
                      {...register('slug')}
                      placeholder="edi-dian"
                      className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                  </div>
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                  {error && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all active:scale-95"
              >
                Lanjut <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan & Publikasikan
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
