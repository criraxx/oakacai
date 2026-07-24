import { useState, useEffect } from "react";

interface CategoryTabsProps {
  categories: string[];
  onSelect?: (category: string) => void;
  initialCategory?: string | null;
}

const CategoryTabs = ({ categories, onSelect, initialCategory }: CategoryTabsProps) => {
  const [active, setActive] = useState(initialCategory || categories[0]);

  // Sincronizar cuando initialCategory cambie o al montar
  useEffect(() => {
    if (initialCategory && categories.includes(initialCategory)) {
      setActive(initialCategory);
      onSelect?.(initialCategory);
    } else if (!initialCategory && categories[0]) {
      setActive(categories[0]);
      onSelect?.(categories[0]);
    }
  }, [initialCategory]);

  const handleSelect = (category: string) => {
    setActive(category);
    onSelect?.(category);
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide border-b border-border">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleSelect(category)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === category
              ? "bg-card text-card-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
