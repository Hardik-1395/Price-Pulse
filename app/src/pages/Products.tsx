import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/layout/Header';
import ProductCard from '../components/products/ProductCard';
import ProductSearch from '../components/products/ProductSearch';
import { ProductCardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState, ErrorState } from '../components/common/EmptyState';
import { getProducts, searchProducts } from '../api/products';
import { getDashboard } from '../api/dashboard';
import type { ProductSummary, DashboardRow } from '../types';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [trackedMap, setTrackedMap] = useState<Record<number, DashboardRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load: fetch products catalog and tracked status from dashboard
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [productList, dashboardRows] = await Promise.all([
        getProducts(),
        getDashboard().catch(() => [] as DashboardRow[]),
      ]);

      setProducts(productList);

      const map: Record<number, DashboardRow> = {};
      dashboardRows.forEach((row) => {
        map[row.product_id] = row;
      });
      setTrackedMap(map);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to PricePulse API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle debounced search query
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadInitialData();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const searchResults = await searchProducts(query);
      setProducts(searchResults);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error executing search.');
    } finally {
      setIsSearching(false);
    }
  }, [loadInitialData]);

  // Extract unique categories from current products list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Client-side category filtering on the loaded search/catalog results
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All Categories') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex flex-col font-sans">
      <Header theme="light" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Editorial Heading */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-['Playfair_Display'] font-bold text-[#171717] tracking-tight mb-2">
            All products
          </h1>
          <p className="text-base text-[#666660] max-w-2xl font-normal">
            Browse the catalog and choose products to monitor their price and stock over time.
          </p>
        </div>

        {/* Search and Filters */}
        <ProductSearch
          value={searchQuery}
          onChange={handleSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          isSearching={isSearching}
        />

        {/* Error Handling */}
        {error && (
          <div className="mb-8">
            <ErrorState message={error} onRetry={loadInitialData} theme="light" />
          </div>
        )}

        {/* Product Grid / Loading / Empty States */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} theme="light" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No products found."
            description={
              searchQuery
                ? `No products matched "${searchQuery}". Try a different product name.`
                : 'No products are currently available in the catalog.'
            }
            actionText={searchQuery ? 'Clear Search' : undefined}
            onActionClick={searchQuery ? () => handleSearch('') : undefined}
            theme="light"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                trackedRow={trackedMap[product.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
