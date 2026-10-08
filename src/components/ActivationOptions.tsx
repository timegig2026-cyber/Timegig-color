import React, { useState, useEffect } from 'react';
import { Building2, User, Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface SlideImage {
  url: string;
  title: string;
  caption: string;
}

const TENANT_SLIDES: SlideImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    title: 'Dedicated Enterprise Tenant',
    caption: 'Private cloud isolation & multi-seat management',
  },
  {
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    title: 'High-Security Cloud Infrastructure',
    caption: 'Dedicated server cluster with custom firewall security',
  },
  {
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    title: 'Centralized Administrative Controls',
    caption: 'Company-wide team provisioning & billing oversight',
  },
  {
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    title: 'Global High-Availability Network',
    caption: '99.99% SLA uptime across multi-region edge nodes',
  },
];

const USER_SLIDES: SlideImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    title: 'Personal Cloud Workspace',
    caption: 'Optimized individual subscription with instant activation',
  },
  {
    url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
    title: 'Cross-Device Synchronization',
    caption: 'Continuous sync across laptop, mobile, and tablet apps',
  },
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    title: 'Streamlined Productivity Suite',
    caption: 'Direct personal access without enterprise admin overhead',
  },
  {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    title: 'Flexible Monthly License Freedom',
    caption: 'Pause or cancel anytime with zero lock-in commitment',
  },
];

interface SlideshowProps {
  slides: SlideImage[];
  autoPlayInterval?: number;
}

const Slideshow: React.FC<SlideshowProps> = ({ slides, autoPlayInterval = 3800 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const current = slides[currentIndex];

  return (
    <div className="relative w-full flex-1 min-h-[90px] max-h-[170px] rounded-xl overflow-hidden bg-slate-900 group select-none">
      <img
        src={current.url}
        alt={current.title}
        className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

      {/* Caption overlay */}
      <div className="absolute bottom-2 left-2.5 right-2.5 text-white pointer-events-none">
        <p className="text-[11px] sm:text-xs font-semibold tracking-wide drop-shadow-md truncate">
          {current.title}
        </p>
        <p className="text-[10px] text-slate-200 truncate opacity-90 drop-shadow-sm">
          {current.caption}
        </p>
      </div>

      {/* Prev / Next controls */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100"
        aria-label="Next image"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded-full">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`h-1 rounded-full transition-all ${
              currentIndex === idx ? 'bg-white w-2.5' : 'bg-white/40 w-1'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

interface ActivationOptionsProps {
  onProceed: (option: 'tenant' | 'user') => void;
}

export const ActivationOptions: React.FC<ActivationOptionsProps> = ({ onProceed }) => {
  const [selectedOption, setSelectedOption] = useState<'tenant' | 'user' | null>(null);

  const handleSelect = (option: 'tenant' | 'user') => {
    setSelectedOption(option);
  };

  const handleActionClick = (option: 'tenant' | 'user') => {
    if (selectedOption === option) {
      onProceed(option);
    } else {
      setSelectedOption(option);
    }
  };

  return (
    <div className="w-full h-full max-w-5xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3 flex flex-col justify-between overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between shrink-0 mb-2 sm:mb-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-black tracking-tight leading-none">
            Activation Options
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-tight">
            Select 1 option to proceed with verification (user can only choose 1):
          </p>
        </div>
        {selectedOption && (
          <button
            type="button"
            onClick={() => onProceed(selectedOption)}
            className="text-[11px] font-bold text-white bg-black hover:bg-slate-800 px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Proceed to Verification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2 Options Side-by-Side (fits screen without vertical scrolling) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 flex-1 min-h-0">
        {/* Option 1: Become a Tenant */}
        <div
          onClick={() => handleSelect('tenant')}
          className={`cursor-pointer bg-white rounded-2xl p-3 sm:p-4 border-2 transition-all flex flex-col justify-between ${
            selectedOption === 'tenant'
              ? 'border-black shadow-lg ring-1 ring-black/10'
              : 'border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          {/* Top Bar of Card */}
          <div className="shrink-0 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-slate-100 text-black">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Organization
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedOption === 'tenant'
                  ? 'border-black bg-black'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedOption === 'tenant' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          {/* Title & Price */}
          <div className="shrink-0 flex items-baseline justify-between mb-1">
            <h2 className="text-sm sm:text-base font-bold text-black leading-tight">
              Become a Tenant
            </h2>
            <div className="text-right">
              <span className="text-sm sm:text-base font-bold text-black">R299,99</span>
              <span className="text-[10px] text-slate-500 font-normal">/mo</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mb-2 shrink-0">
            Dedicated private cloud tenant partition with multi-seat provisioning.
          </p>

          {/* Slideshow */}
          <Slideshow slides={TENANT_SLIDES} autoPlayInterval={4000} />

          {/* Features */}
          <ul className="space-y-1 my-2 shrink-0 text-[10px] sm:text-[11px] text-slate-700">
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Dedicated private cloud tenant partition</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Unlimited team seats & role provisioning</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Custom domain & corporate branding</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Enterprise SLA with 24/7 dedicated support</span>
            </li>
          </ul>

          {/* Action button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick('tenant');
            }}
            className={`w-full py-1.5 sm:py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center justify-center gap-1.5 ${
              selectedOption === 'tenant'
                ? 'bg-black text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-black'
            }`}
          >
            {selectedOption === 'tenant' ? (
              <>
                <span>Proceed with Tenant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              'Select Become a Tenant'
            )}
          </button>
        </div>

        {/* Option 2: User Subscription */}
        <div
          onClick={() => handleSelect('user')}
          className={`cursor-pointer bg-white rounded-2xl p-3 sm:p-4 border-2 transition-all flex flex-col justify-between ${
            selectedOption === 'user'
              ? 'border-black shadow-lg ring-1 ring-black/10'
              : 'border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          {/* Top Bar of Card */}
          <div className="shrink-0 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-slate-100 text-black">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Individual
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedOption === 'user'
                  ? 'border-black bg-black'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedOption === 'user' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          {/* Title & Price */}
          <div className="shrink-0 flex items-baseline justify-between mb-1">
            <h2 className="text-sm sm:text-base font-bold text-black leading-tight">
              User Subscription
            </h2>
            <div className="text-right">
              <span className="text-sm sm:text-base font-bold text-black">R29,99</span>
              <span className="text-[10px] text-slate-500 font-normal">/mo</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mb-2 shrink-0">
            Individual professional subscription for personal productivity and device sync.
          </p>

          {/* Slideshow */}
          <Slideshow slides={USER_SLIDES} autoPlayInterval={4500} />

          {/* Features */}
          <ul className="space-y-1 my-2 shrink-0 text-[10px] sm:text-[11px] text-slate-700">
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Single-user full feature personal access</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Sync across laptop, mobile, and tablet</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Unlimited personal cloud storage & history</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-black shrink-0" />
              <span className="truncate">Cancel or pause anytime with zero lock-in</span>
            </li>
          </ul>

          {/* Action button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleActionClick('user');
            }}
            className={`w-full py-1.5 sm:py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center justify-center gap-1.5 ${
              selectedOption === 'user'
                ? 'bg-black text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-black'
            }`}
          >
            {selectedOption === 'user' ? (
              <>
                <span>Proceed with Subscription</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              'Select User Subscription'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
