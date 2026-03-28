'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Users, CheckCircle2, XCircle, MessageSquare, ArrowLeft, Calendar, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface RSVP {
  id: string;
  name: string;
  attendance: boolean;
  guestCount: number;
  message: string;
  createdAt: string;
}

export default function RSVPManagement() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchInvitation = async () => {
      const docRef = doc(db, 'invitations', params.id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setInvitation(docSnap.data());
      } else {
        router.push('/dashboard');
      }
    };
    fetchInvitation();

    const q = query(
      collection(db, 'rsvp'),
      where('invitationId', '==', params.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRsvps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RSVP[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rsvp');
    });

    return () => unsubscribe();
  }, [user, params.id, router]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;

  const totalGuests = rsvps.filter(r => r.attendance).reduce((acc, curr) => acc + curr.guestCount, 0);
  const totalAttending = rsvps.filter(r => r.attendance).length;
  const totalNotAttending = rsvps.filter(r => !r.attendance).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Kembali ke Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen RSVP</h1>
            <p className="text-gray-600">Daftar konfirmasi kehadiran tamu untuk: <span className="font-bold text-pink-600">{invitation?.data?.title}</span></p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-gray-900">{totalGuests}</div>
            <div className="text-sm text-gray-500 font-medium">Total Estimasi Tamu</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-gray-900">{totalAttending}</div>
            <div className="text-sm text-gray-500 font-medium">Hadir</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-gray-900">{totalNotAttending}</div>
            <div className="text-sm text-gray-500 font-medium">Tidak Hadir</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-gray-900">{rsvps.length}</div>
            <div className="text-sm text-gray-500 font-medium">Total Respon</div>
          </div>
        </div>

        {/* RSVP Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Nama Tamu</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Kehadiran</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Pesan</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rsvps.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{r.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        r.attendance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.attendance ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {r.attendance ? 'Hadir' : 'Tidak Hadir'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{r.guestCount} Orang</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500 text-sm max-w-xs truncate" title={r.message}>
                        {r.message || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {format(new Date(r.createdAt), 'd MMM yyyy, HH:mm')}
                    </td>
                  </tr>
                ))}
                {rsvps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                      Belum ada respon RSVP untuk undangan ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
