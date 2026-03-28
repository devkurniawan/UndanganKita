'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Plus, ExternalLink, Edit2, Trash2, Calendar, Clock, AlertCircle, CheckCircle2, MoreVertical, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Invitation {
  id: string;
  slug: string;
  status: 'draft' | 'pending' | 'active' | 'expired';
  data: {
    title: string;
    date: string;
  };
  createdAt: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'invitations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
      setInvitations(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invitations');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus undangan ini?')) return;
    try {
      await deleteDoc(doc(db, 'invitations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invitations/${id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Silakan login terlebih dahulu untuk mengakses dashboard.</p>
          <Link href="/" className="bg-pink-600 text-white px-6 py-2 rounded-full font-bold">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Undangan</h1>
            <p className="text-gray-600">Kelola semua undangan digital Anda di sini.</p>
          </div>
          <Link
            href="/dashboard/create"
            className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Undangan Baru</span>
          </Link>
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mx-auto mb-6">
              <Plus className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Undangan</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Anda belum membuat undangan apapun. Mulai buat undangan pertama Anda sekarang juga!
            </p>
            <Link
              href="/dashboard/create"
              className="inline-block bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-all"
            >
              Buat Undangan Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      inv.status === 'active' ? 'bg-green-100 text-green-700' :
                      inv.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {inv.status}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(inv.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-1">{inv.data.title || 'Tanpa Judul'}</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{inv.data.date ? format(new Date(inv.data.date), 'EEEE, d MMMM yyyy', { locale: id }) : 'Tanggal belum diatur'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Dibuat: {format(new Date(inv.createdAt), 'd MMM yyyy')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                    <Link
                      href={`/dashboard/rsvp/${inv.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-all"
                    >
                      <Users className="w-4 h-4" />
                      RSVP
                    </Link>
                    <Link
                      href={`/dashboard/edit/${inv.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Link>
                    <Link
                      href={`/${inv.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 py-2.5 rounded-xl font-bold hover:bg-pink-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Lihat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
