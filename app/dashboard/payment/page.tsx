'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { CreditCard, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('id');
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!invitationId || !user) return;
    const fetchInvitation = async () => {
      try {
        const docRef = doc(db, 'invitations', invitationId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInvitation(docSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `invitations/${invitationId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [invitationId, user]);

  const handlePayment = async () => {
    if (!invitationId) return;
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'invitations', invitationId), {
          status: 'active',
          updatedAt: new Date().toISOString()
        });
        router.push('/dashboard?payment=success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `invitations/${invitationId}`);
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 pt-32 pb-12">
        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/50 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
            <CreditCard className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Selesaikan Pembayaran</h1>
          <p className="text-gray-600 mb-8">Aktifkan undangan digital Anda untuk mulai membagikannya kepada tamu.</p>
          
          <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-left border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Paket Premium</span>
              <span className="text-gray-900 font-bold">Rp 50.000</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-gray-900 font-bold">Total Bayar</span>
              <span className="text-2xl font-black text-pink-600">Rp 50.000</span>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-3 text-sm text-gray-600 justify-center">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Pembayaran Aman & Terenkripsi</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Aktivasi Instan Setelah Pembayaran</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-pink-200 hover:bg-pink-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {processing ? 'Memproses Pembayaran...' : (
              <>
                Bayar Sekarang <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button 
            onClick={() => router.back()}
            className="mt-6 text-gray-500 font-medium hover:text-gray-900 transition-colors"
          >
            Kembali
          </button>
        </div>
      </main>
    </div>
  );
}
