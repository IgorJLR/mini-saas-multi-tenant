import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Product } from '../types';
import ProductModal from '../components/ProductModal';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    api.get<Product[]>('/products')
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category))).sort()];

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleSave = async (data: Partial<Product>) => {
    if (editing) {
      const { data: updated } = await api.put<Product>(`/products/${editing._id}`, data);
      setProducts((prev) => prev.map((p) => (p._id === editing._id ? updated : p)));
    } else {
      const { data: created } = await api.post<Product>('/products', data);
      setProducts((prev) => [created, ...prev]);
    }
    closeModal();
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${products.length} items in catalog`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-14 h-14 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-400 text-sm">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 group">
              <div className="relative h-44 bg-gray-50 overflow-hidden">
                <img
                  src={product.imageUrl || `https://placehold.co/400x300/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/400x300/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}`;
                  }}
                />
                <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                  {product.category}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-indigo-700 font-bold">${product.price.toFixed(2)}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <ProductModal product={editing} onSave={handleSave} onClose={closeModal} />}
    </div>
  );
}
