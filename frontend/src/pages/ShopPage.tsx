import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ShoppingBag, Coins, CreditCard, History, CheckCircle2, ArrowRight } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: string;
  description: string;
}

interface Transaction {
  id: number;
  product_name: string;
  amount: number;
  tokens: number;
  created_at: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'shop') {
        const res = await api.get('/products');
        setProducts(res.data.data);
      } else {
        const res = await api.get('/products/transactions');
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (productId: number) => {
    setIsPurchasing(productId);
    try {
      const res = await api.post('/products/purchase', { product_id: productId });
      if (res.data.payment_url) {
        window.open(res.data.payment_url, '_blank');
      }
    } catch (err) {
      alert('Failed to initiate purchase. Please try again.');
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-orange-500" />
            Kilas Shop
          </h1>
          <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs">
            Refill your tokens and unlock premium features
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'shop' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Coins className="w-5 h-5" />
            Tokens
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <History className="w-5 h-5" />
            History
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-gray-100 rounded-3xl">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest">Loading items...</p>
        </div>
      ) : activeTab === 'shop' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all group flex flex-col"
            >
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Coins className="w-8 h-8 text-orange-500" />
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-2xl font-black text-gray-800 leading-tight">
                  {product.name}
                </h3>
                <p className="text-gray-400 font-bold text-sm line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Price</span>
                  <span className="text-2xl font-black text-gray-800">
                    Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                  </span>
                </div>

                <button
                  onClick={() => handlePurchase(product.id)}
                  disabled={isPurchasing === product.id}
                  className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPurchasing === product.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      PURCHASE NOW
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto" />
              <p className="text-xl font-bold text-gray-400">No products available at the moment.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b-2 border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800">Your Transactions</h2>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Last 50 Purchases
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b-2 border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                          <Coins className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="font-bold text-gray-700">{t.product_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-gray-700">Rp {new Intl.NumberFormat('id-ID').format(t.amount)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-green-500 font-black text-xs uppercase tracking-tight bg-green-50 px-3 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <History className="w-16 h-16 text-gray-100 mx-auto" />
              <p className="text-xl font-bold text-gray-400">No purchase history yet.</p>
              <button
                onClick={() => setActiveTab('shop')}
                className="text-orange-500 font-black uppercase text-sm hover:underline flex items-center gap-2 mx-auto"
              >
                Go to shop <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
