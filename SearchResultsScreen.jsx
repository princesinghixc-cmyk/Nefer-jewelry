/* ============================================================
   SearchResultsScreen.jsx — Full-page search results for NEFER
   Searches products by name, category, description & keywords.
   ============================================================ */
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import ProductCard from './ProductCard.jsx';
import { SearchIcon } from './Icons.jsx';
import { searchProducts } from '../utils/search.js';
import { categoryNames } from '../routes/paths.js';
import './SearchResultsScreen.css';

const POPULAR_SEARCHES = [
  'Solitaire Rings',
  'Diamond Pendants',
  'Gold Bangles',
  'Tennis Bracelets',
  'Jewellery Sets',
  'Earrings',
  'Wedding Edit',
  'Daily Wear'
];

export default function SearchResultsScreen() {
  const { state } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const trimmedQuery = query.trim();

  // Local state for on-page search box refinement
  const [pageQuery, setPageQuery] = useState(query);

  // Sync pageQuery when URL search parameter changes
  React.useEffect(() => {
    setPageQuery(query);
  }, [query]);

  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    return searchProducts(state.products, trimmedQuery);
  }, [state.products, trimmedQuery]);

  const isEmpty = !trimmedQuery;
  const isLoading = state.loading;
  const hasError = Boolean(state.catalogError);
  const noResults = !isEmpty && !isLoading && !hasError && results.length === 0;

  const handlePageSearchSubmit = (e) => {
    e.preventDefault();
    const clean = pageQuery.trim();
    if (clean) {
      setSearchParams({ q: clean });
    } else {
      setSearchParams({});
    }
  };

  const handleChipClick = (term) => {
    setPageQuery(term);
    setSearchParams({ q: term });
  };

  return (
    <div className="search-results-page">
      {/* ── Page Header & Inline Search Bar ── */}
      <section className="search-results-header">
        <div className="search-header-content">
          <h1>
            {isEmpty
              ? 'Search Our Collections'
              : `Results for "${trimmedQuery}"`}
          </h1>
          {!isEmpty && !isLoading && !hasError && (
            <p className="search-results-count">
              {results.length === 0
                ? 'No matching products'
                : `${results.length} product${results.length === 1 ? '' : 's'} found`}
            </p>
          )}
        </div>

        {/* Refinement search bar right on page */}
        <form className="search-page-input-wrap" role="search" onSubmit={handlePageSearchSubmit}>
          <button type="submit" className="search-page-submit" aria-label="Search">
            <SearchIcon size={20} />
          </button>
          <input
            type="text"
            className="search-page-input"
            value={pageQuery}
            onChange={(e) => setPageQuery(e.target.value)}
            placeholder="Search by name, category, metal, or style..."
            aria-label="Refine search"
          />
          {pageQuery && (
            <button
              type="button"
              className="search-page-clear"
              aria-label="Clear text"
              onClick={() => {
                setPageQuery('');
                setSearchParams({});
              }}
            >
              ✕
            </button>
          )}
        </form>
      </section>

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="search-loading-state" role="status" aria-live="polite">
          <div className="search-spinner" />
          <p>Searching jewellery collections…</p>
        </div>
      )}

      {/* ── Error State ── */}
      {!isLoading && hasError && (
        <div className="search-empty-state" role="alert">
          <div className="search-empty-icon">⚠️</div>
          <h2>Unable to load products</h2>
          <p>{state.catalogError || 'Something went wrong while retrieving the catalogue. Please check your connection and try again.'}</p>
          <button
            type="button"
            className="n-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty Search State (User visited /search with no query) ── */}
      {!isLoading && !hasError && isEmpty && (
        <div className="search-empty-state">
          <div className="search-empty-icon">
            <SearchIcon size={46} />
          </div>
          <h2>What are you looking for?</h2>
          <p>
            Explore handcrafted diamond and fine gold jewellery by entering a name, category, or keyword above.
          </p>

          {/* Popular searches suggestions */}
          <div className="search-popular-section">
            <span className="search-popular-label">Popular Searches:</span>
            <div className="search-chips-list">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="search-chip"
                  onClick={() => handleChipClick(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Categories */}
          <div className="search-categories-section">
            <span className="search-popular-label">Or browse by category:</span>
            <div className="search-chips-list">
              {categoryNames.map((cat) => (
                <Link
                  key={cat}
                  to={`/categories?category=${encodeURIComponent(cat)}`}
                  className="search-chip search-chip-category"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── No Results State ── */}
      {noResults && (
        <div className="search-empty-state" role="status">
          <div className="search-empty-icon">
            <SearchIcon size={46} />
          </div>
          <h2>No products found</h2>
          <p>
            We couldn't find any products matching "<strong>{trimmedQuery}</strong>". Try checking for spelling errors, using more general terms, or exploring our categories below.
          </p>

          {/* Quick category recovery links */}
          <div className="search-popular-section">
            <span className="search-popular-label">Explore our categories:</span>
            <div className="search-chips-list">
              {categoryNames.map((cat) => (
                <Link
                  key={cat}
                  to={`/categories?category=${encodeURIComponent(cat)}`}
                  className="search-chip search-chip-category"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <Link className="n-button" to="/categories">
            Browse All Jewellery
          </Link>
        </div>
      )}

      {/* ── Results Grid ── */}
      {!isLoading && !hasError && results.length > 0 && (
        <section className="search-results-grid-section" aria-label="Search results">
          <div className="n-product-grid">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
