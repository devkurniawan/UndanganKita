'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { format, intervalToDuration } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Users, 
  Music, 
  Volume2, 
  VolumeX, 
  ChevronDown,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ConfettiExplosion from 'react-confetti-explosion';

interface InvitationData {
  id: string;
  data: {
    title: string;
    date: string;
    location: string;
    mapsUrl?: string;
    description?: string;
    musicUrl?: string;
    gallery?: string[];
    story?: { year: string; content: string }[];
  };
  status: string;
}

interface RSVP {
  name: string;
  attendance: boolean;
  guestCount: number;
  message: string;
  createdAt: string;
}

interface Guestbook {
  name: string;
  message: string;
  createdAt: string;
}

export default function PublicInvitation() {
  const params = useParams();
  const searchParams = useSearchParams();
  const guestName = searchParams.get('to') || '';
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [guestbook, setGuestbook] = useState<Guestbook[]>([]);
  const [isExploding, setIsExploding] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP Form State
  const [rsvpForm, setRsvpForm] = useState({ name: guestName, attendance: true, guestCount: 1, message: '' });
  const [submittingRSVP, setSubmittingRSVP] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Guestbook Form State
  const [guestbookForm, setGuestbookForm] = useState({ name: guestName, message: '' });
  const [submittingGuestbook, setSubmittingGuestbook] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const q = query(collection(db, 'invitations'), where('slug', '==', params.slug), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setInvitation({ id: doc.id, ...doc.data() } as InvitationData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `invitations/slug/${params.slug}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [params.slug]);

  useEffect(() => {
    if (!invitation) return;

    // Listen to RSVP
    const rsvpQuery = query(collection(db, 'rsvp'), where('invitationId', '==', invitation.id), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeRSVP = onSnapshot(rsvpQuery, (snapshot) => {
      setRsvps(snapshot.docs.map(doc => doc.data() as RSVP));
    });

    // Listen to Guestbook
    const guestbookQuery = query(collection(db, 'guestbook'), where('invitationId', '==', invitation.id), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeGuestbook = onSnapshot(guestbookQuery, (snapshot) => {
      setGuestbook(snapshot.docs.map(doc => doc.data() as Guestbook));
    });

    // Countdown Timer
    const timer = setInterval(() => {
      const now = new Date();
      const eventDate = new Date(invitation.data.date);
      if (eventDate > now) {
        setTimeLeft(intervalToDuration({ start: now, end: eventDate }));
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => {
      unsubscribeRSVP();
      unsubscribeGuestbook();
      clearInterval(timer);
    };
  }, [invitation]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsPlaying(true);
    setIsExploding(true);
    if (audioRef.current) audioRef.current.play();
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const submitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setSubmittingRSVP(true);
    try {
      await addDoc(collection(db, 'rsvp'), {
        ...rsvpForm,
        invitationId: invitation.id,
        createdAt: new Date().toISOString()
      });
      setRsvpSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rsvp');
    } finally {
      setSubmittingRSVP(false);
    }
  };

  const submitGuestbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setSubmittingGuestbook(true);
    try {
      await addDoc(collection(db, 'guestbook'), {
        ...guestbookForm,
        invitationId: invitation.id,
        createdAt: new Date().toISOString()
      });
      setGuestbookForm({ ...guestbookForm, message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'guestbook');
    } finally {
      setSubmittingGuestbook(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!invitation) return <div className="min-h-screen bg-pink-50 flex items-center justify-center text-center p-4"><div><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h1 className="text-2xl font-bold">Undangan Tidak Ditemukan</h1><p className="text-gray-600">Undangan mungkin tidak aktif atau URL salah.</p></div></div>;

  return (
    <div className="min-h-screen bg-[#FFF9F9] font-sans selection:bg-pink-100 overflow-x-hidden">
      {/* Audio Element */}
      {invitation.data.musicUrl && (
        <audio ref={audioRef} src={invitation.data.musicUrl} loop />
      )}

      {/* Music Control */}
      {isOpen && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-pink-600 border border-pink-100 animate-pulse"
        >
          {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      )}

      {/* Opening Screen */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -1000 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cover bg-center text-white text-center p-6"
            style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${invitation.data.gallery?.[0] || 'https://picsum.photos/seed/wedding/1920/1080'})` }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Heart className="w-16 h-16 mx-auto mb-6 text-pink-400 fill-current" />
              <p className="text-lg uppercase tracking-[0.3em] mb-4 font-light">The Wedding of</p>
              <h1 className="text-5xl md:text-7xl font-serif italic mb-8 drop-shadow-lg">{invitation.data.title}</h1>
              
              {guestName && (
                <div className="mb-10 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                  <p className="text-sm uppercase tracking-widest mb-2 opacity-80">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                  <h2 className="text-2xl font-bold">{guestName}</h2>
                </div>
              )}

              <button
                onClick={handleOpen}
                className="bg-white text-pink-600 px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-pink-50 transition-all flex items-center gap-2 mx-auto active:scale-95"
              >
                <Calendar className="w-5 h-5" /> Buka Undangan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {isOpen && (
        <div className="relative">
          {isExploding && <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110]"><ConfettiExplosion /></div>}
          
          {/* Hero Section */}
          <section className="h-screen relative flex items-center justify-center text-center p-6 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${invitation.data.gallery?.[0] || 'https://picsum.photos/seed/wedding/1920/1080'})` }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-white"
            >
              <h2 className="text-6xl md:text-8xl font-serif italic mb-4">{invitation.data.title}</h2>
              <p className="text-xl md:text-2xl tracking-widest uppercase font-light">{format(new Date(invitation.data.date), 'dd . MM . yyyy')}</p>
              <div className="mt-20 animate-bounce">
                <ChevronDown className="w-8 h-8 mx-auto opacity-70" />
              </div>
            </motion.div>
          </section>

          {/* Countdown Section */}
          <section className="py-20 px-4 text-center bg-white">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-serif italic text-pink-600 mb-10">Menghitung Hari Bahagia</h3>
              {timeLeft ? (
                <div className="grid grid-cols-4 gap-4 md:gap-8">
                  {[
                    { label: 'Hari', value: timeLeft.days || 0 },
                    { label: 'Jam', value: timeLeft.hours || 0 },
                    { label: 'Menit', value: timeLeft.minutes || 0 },
                    { label: 'Detik', value: timeLeft.seconds || 0 },
                  ].map((t, i) => (
                    <div key={i} className="bg-pink-50 p-4 md:p-8 rounded-3xl border border-pink-100">
                      <div className="text-3xl md:text-5xl font-black text-pink-600 mb-1">{t.value}</div>
                      <div className="text-xs md:text-sm uppercase tracking-widest text-pink-400 font-bold">{t.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-3xl font-bold text-pink-600">Acara Sedang Berlangsung / Sudah Selesai</div>
              )}
            </div>
          </section>

          {/* Details Section */}
          <section className="py-20 px-4 bg-[#FFF9F9]">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-white p-10 rounded-[3rem] shadow-xl shadow-pink-100/50 text-center border border-pink-50"
              >
                <Calendar className="w-12 h-12 text-pink-500 mx-auto mb-6" />
                <h3 className="text-2xl font-serif italic mb-4">Waktu & Tanggal</h3>
                <p className="text-gray-600 mb-2 font-bold">{format(new Date(invitation.data.date), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
                <p className="text-gray-500 flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> {format(new Date(invitation.data.date), 'HH:mm')} WIB - Selesai</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-white p-10 rounded-[3rem] shadow-xl shadow-pink-100/50 text-center border border-pink-50"
              >
                <MapPin className="w-12 h-12 text-pink-500 mx-auto mb-6" />
                <h3 className="text-2xl font-serif italic mb-4">Lokasi Acara</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{invitation.data.location}</p>
                {invitation.data.mapsUrl && (
                  <a
                    href={invitation.data.mapsUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-700 transition-all"
                  >
                    Buka Google Maps
                  </a>
                )}
              </motion.div>
            </div>
          </section>

          {/* Story Section */}
          {invitation.data.story && invitation.data.story.length > 0 && (
            <section className="py-20 px-4 bg-white">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-3xl font-serif italic text-center text-pink-600 mb-16">Kisah Cinta Kami</h3>
                <div className="space-y-12 relative before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-pink-100 before:-translate-x-1/2">
                  {invitation.data.story.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-8 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className="flex-1 text-right">
                        {i % 2 === 0 && (
                          <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100">
                            <span className="text-pink-600 font-black text-xl block mb-2">{s.year}</span>
                            <p className="text-gray-600">{s.content}</p>
                          </div>
                        )}
                      </div>
                      <div className="w-4 h-4 bg-pink-500 rounded-full z-10 ring-8 ring-pink-50" />
                      <div className="flex-1 text-left">
                        {i % 2 !== 0 && (
                          <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100">
                            <span className="text-pink-600 font-black text-xl block mb-2">{s.year}</span>
                            <p className="text-gray-600">{s.content}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Gallery Section */}
          {invitation.data.gallery && invitation.data.gallery.length > 0 && (
            <section className="py-20 px-4 bg-[#FFF9F9]">
              <div className="max-w-6xl mx-auto">
                <h3 className="text-3xl font-serif italic text-center text-pink-600 mb-16">Galeri Momen Indah</h3>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                  {invitation.data.gallery.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      className="break-inside-avoid rounded-3xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      <img src={img} alt={`Gallery ${i}`} className="w-full h-auto" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* RSVP Section */}
          <section className="py-20 px-4 bg-white">
            <div className="max-w-2xl mx-auto bg-pink-50 p-10 rounded-[3rem] border border-pink-100 shadow-xl shadow-pink-100/50">
              <div className="text-center mb-10">
                <Users className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-3xl font-serif italic text-pink-600 mb-2">Konfirmasi Kehadiran</h3>
                <p className="text-gray-600">Mohon konfirmasi kehadiran Anda melalui form di bawah ini.</p>
              </div>

              {rsvpSuccess ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h4>
                  <p className="text-gray-600">Konfirmasi kehadiran Anda telah kami terima.</p>
                </div>
              ) : (
                <form onSubmit={submitRSVP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                    <input
                      required
                      value={rsvpForm.name}
                      onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Kehadiran</label>
                      <select
                        value={rsvpForm.attendance ? 'true' : 'false'}
                        onChange={e => setRsvpForm({ ...rsvpForm, attendance: e.target.value === 'true' })}
                        className="w-full px-6 py-4 rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                      >
                        <option value="true">Hadir</option>
                        <option value="false">Tidak Hadir</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Jumlah Tamu</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={rsvpForm.guestCount}
                        onChange={e => setRsvpForm({ ...rsvpForm, guestCount: parseInt(e.target.value) })}
                        className="w-full px-6 py-4 rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Pesan (Optional)</label>
                    <textarea
                      value={rsvpForm.message}
                      onChange={e => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                      rows={3}
                      className="w-full px-6 py-4 rounded-2xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingRSVP}
                    className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all disabled:opacity-50"
                  >
                    {submittingRSVP ? 'Mengirim...' : 'Kirim Konfirmasi'}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Guestbook Section */}
          <section className="py-20 px-4 bg-[#FFF9F9]">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16">
                <MessageSquare className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-3xl font-serif italic text-pink-600 mb-2">Buku Tamu & Ucapan</h3>
                <p className="text-gray-600">Berikan ucapan dan doa restu untuk kedua mempelai.</p>
              </div>

              <form onSubmit={submitGuestbook} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-pink-50 mb-12">
                <div className="space-y-4">
                  <input
                    required
                    placeholder="Nama Anda"
                    value={guestbookForm.name}
                    onChange={e => setGuestbookForm({ ...guestbookForm, name: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                  <textarea
                    required
                    placeholder="Tulis ucapan..."
                    rows={3}
                    value={guestbookForm.message}
                    onChange={e => setGuestbookForm({ ...guestbookForm, message: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={submittingGuestbook}
                    className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {submittingGuestbook ? 'Mengirim...' : 'Kirim Ucapan'}
                  </button>
                </div>
              </form>

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {guestbook.map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                        {g.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{g.name}</h4>
                        <p className="text-xs text-gray-400">{format(new Date(g.createdAt), 'd MMM yyyy, HH:mm')}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed italic">&quot;{g.message}&quot;</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-20 bg-white text-center">
            <Heart className="w-12 h-12 text-pink-500 fill-current mx-auto mb-6" />
            <h3 className="text-3xl font-serif italic text-gray-900 mb-4">Terima Kasih</h3>
            <p className="text-gray-500 max-w-md mx-auto px-6">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
            </p>
            <div className="mt-20 pt-10 border-t border-gray-50">
              <p className="text-sm text-gray-400">Powered by <span className="font-bold text-pink-600">UndanganKita</span></p>
            </div>
          </footer>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffe4e6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #fecdd3;
        }
      `}</style>
    </div>
  );
}
