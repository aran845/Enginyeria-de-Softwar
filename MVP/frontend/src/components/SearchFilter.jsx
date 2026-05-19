import { useState, useMemo } from 'react';

export default function SearchFilter({ subscriptions, onFilter, onCategoryChange }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = useMemo(() => {
        const cats = new Set(subscriptions.map(s => s.category));
        return Array.from(cats).sort();
    }, [subscriptions]);

    const filtered = useMemo(() => {
        return subscriptions.filter(sub => {
            const matchesSearch = sub.service_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [subscriptions, searchTerm, selectedCategory]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        onFilter(filtered.filter(s => selectedCategory === 'all' || s.category === selectedCategory));
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        const newFiltered = subscriptions.filter(sub => {
            const matchesSearch = sub.service_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = category === 'all' || sub.category === category;
            return matchesSearch && matchesCategory;
        });
        onFilter(newFiltered);
        onCategoryChange?.(category);
    };

    return (
        <div className="search-filter" id="search-filter">
            <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Buscar suscripción..."
                    className="search-input"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    id="search-input"
                />
                {searchTerm && (
                    <button
                        className="clear-search"
                        onClick={() => {
                            setSearchTerm('');
                            onFilter(subscriptions.filter(s => selectedCategory === 'all' || s.category === selectedCategory));
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="category-filter" id="category-filter">
                <button
                    className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('all')}
                >
                    Todas ({subscriptions.length})
                </button>
                {categories.map(category => {
                    const count = subscriptions.filter(s => s.category === category).length;
                    return (
                        <button
                            key={category}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(category)}
                        >
                            {category} ({count})
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
