'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'motion/react';
import { Heart, Calendar, MapPin, Users, MessageSquare, Image as ImageIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { user, signInWithGoogle } = useAuth();

  const features = [
    { icon: <Calendar className="w-6 h-6" />, title: 'Countdown Acara', desc: 'Hitung mundur otomatis menuju hari bahagia Anda.' },
    { icon: <MapPin className="w-6 h-6" />, title: 'Integrasi Google Maps', desc: 'Tamu tidak akan tersesat dengan navigasi langsung.' },
    { icon: <Users className="w-6 h-6" />, title: 'Manajemen RSVP', desc: 'Pantau daftar kehadiran tamu secara real-time.' },
    { icon: <MessageSquare className="w-6 h-6" />, title: 'Buku Tamu Digital', desc: 'Terima ucapan dan doa dari teman serta keluarga.' },
    { icon: <ImageIcon className="w-6 h-6" />, title: 'Galeri Foto', desc: 'Bagikan momen indah Anda dalam galeri yang elegan.' },
    { icon: <CheckCircle2 className="w-6 h-6" />, title: 'Aktivasi Instan', desc: 'Bayar dan undangan Anda langsung aktif seketika.' },
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-pink-100">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold text-pink-600 bg-pink-50 rounded-full">
              #1 Platform Undangan Digital di Indonesia
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Bagikan Kebahagiaan Anda <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-500">
                Secara Digital & Elegan
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Buat undangan pernikahan atau acara spesial Anda hanya dalam hitungan menit. 
              Hemat biaya, ramah lingkungan, dan tetap berkesan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-pink-200 hover:bg-pink-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  Ke Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="w-full sm:w-auto px-8 py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-pink-200 hover:bg-pink-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  Mulai Buat Undangan <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
                Lihat Demo
              </button>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50 -z-10" />
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -z-10" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Fitur Lengkap Untuk Anda</h2>
            <p className="text-gray-600">Semua yang Anda butuhkan untuk undangan digital yang sempurna.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
              >
                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:scale-110 group-hover:bg-pink-600 group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Harga Terjangkau</h2>
            <p className="text-gray-600">Pilih paket yang sesuai dengan kebutuhan Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Basic', price: '25k', features: ['1 Template', 'RSVP', 'Maps', 'Aktif 3 Bulan'] },
              { name: 'Premium', price: '50k', features: ['Semua Template', 'Galeri Foto', 'Musik', 'Aktif 1 Tahun'], popular: true },
              { name: 'Exclusive', price: '100k', features: ['Custom Domain', 'Tanpa Watermark', 'VIP Support', 'Aktif Selamanya'] },
            ].map((p, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-3xl border-2 ${p.popular ? 'border-pink-600 bg-white shadow-2xl shadow-pink-100' : 'border-gray-100 bg-gray-50'} transition-all`}
              >
                {p.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-pink-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Paling Populer
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black">Rp {p.price}</span>
                  <span className="text-gray-500 text-sm">/undangan</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-2xl font-bold transition-all ${p.popular ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-100'}`}>
                  Pilih Paket
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
            <span className="text-xl font-bold">UndanganKita</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 UndanganKita. Dibuat dengan cinta untuk hari bahagia Anda.
          </p>
        </div>
      </footer>
    </div>
  );
}
