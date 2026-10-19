import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, X, Search, LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  showCount?: boolean;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  showCount = true,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isSelected = value !== 'All' && value !== '';
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = isSelected ? (selectedOption?.label || value) : label;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('All');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            'group relative inline-flex items-center gap-2 h-11 sm:h-12 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border outline-none select-none cursor-pointer',
            isSelected
              ? 'bg-primary/10 border-primary/40 text-primary shadow-sm shadow-primary/10 hover:bg-primary/15'
              : 'bg-background dark:bg-background/80 border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/40',
            open && 'ring-2 ring-primary/30 border-primary/50',
            className
          )}
        >
          <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
          
          <span className="truncate max-w-[120px] sm:max-w-[150px]">
            {isSelected ? (
              <span className="font-semibold text-foreground">
                <span className="text-muted-foreground font-normal hidden sm:inline">{label}: </span>
                {displayLabel}
              </span>
            ) : (
              <span>{label}</span>
            )}
          </span>

          {/* If count is available for selected item */}
          {isSelected && showCount && selectedOption?.count !== undefined && (
            <span className="hidden sm:inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
              {selectedOption.count}
            </span>
          )}

          {/* Quick Clear or Chevron */}
          {isSelected ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              title={`Clear ${label} filter`}
              className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          ) : (
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180 text-foreground'
              )}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 sm:w-72 max-w-[calc(100vw-2rem)] p-2 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl z-50 text-popover-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-primary" />
            Filter by {label}
          </span>
          {isSelected && (
            <button
              onClick={() => handleSelect('All')}
              className="text-xs text-primary hover:underline font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* Search inside dropdown if more than 5 options */}
        {options.length > 5 && (
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-7 bg-secondary/50 dark:bg-secondary/30 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded-full"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Options list */}
        <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No {label.toLowerCase()}s found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left group',
                    active
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'hover:bg-secondary text-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all',
                        active
                          ? 'border-primary-foreground bg-primary-foreground/20'
                          : 'border-border/80 group-hover:border-primary/50'
                      )}
                    >
                      {active ? (
                        <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-primary/40" />
                      )}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {showCount && opt.count !== undefined && (
                    <span
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-full shrink-0 font-mono transition-colors',
                        active
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-secondary/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                      )}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterDropdown;
