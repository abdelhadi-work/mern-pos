// ============================================
// FILE: client/src/components/ShowProductModal.jsx
// ============================================
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Box,
  Layers,
  Barcode,
  Tag,
  DollarSign,
  Bell,
  Package,
} from "lucide-react";

const CDN = "http://localhost:5001"; // adjust if your API base changes

function resolveSrc(img) {
  if (!img) return "";
  return img.startsWith("http") ? img : `${CDN}${img}`;
}

export default function ShowProductModal({
  product,
  isOpen,
  onClose,
  currentUserRole, // 'main_admin' | 'finance_admin' | 'storekeeper' | etc.
}) {
  const [current, setCurrent] = useState(0);
  const [hover, setHover] = useState(false);
  const timerRef = useRef(null);
  const touchStartXRef = useRef(null);

  const images = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : []; // empty means no images

  const total = images.length;
  const canSeeCost =
    currentUserRole === "main_admin" || currentUserRole === "finance_admin";

  const price = Number(product?.price || 0);
  const costPrice = Number(product?.costPrice || 0);
  const stock = Number(product?.stock || 0);
  const profitPerItem = Math.max(price - costPrice, 0);
  const totalProfit = profitPerItem * stock;

  // auto slide every 3s (pause on hover, reset timer on click)
  useEffect(() => {
    if (!isOpen || total <= 1) return;
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, total]);

  useEffect(() => {
    if (hover) stop();
    else if (isOpen && total > 1) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover]);

  const start = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 3000);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const restart = () => {
    stop();
    start();
  };

  const next = () => {
    if (total <= 1) return;
    setCurrent((c) => (c + 1) % total);
    restart();
  };

  const prev = () => {
    if (total <= 1) return;
    setCurrent((c) => (c - 1 + total) % total);
    restart();
  };

  const onTouchStart = (e) => {
    touchStartXRef.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const startX = touchStartXRef.current;
    if (startX == null) return;
    const delta = endX - startX;
    const threshold = 40;
    if (Math.abs(delta) > threshold) {
      if (delta < 0) next();
      else prev();
    }
    touchStartXRef.current = null;
  };

  if (!isOpen || !product) return null;

  const stockLow = Number(product.stock) <= Number(product.minStock);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ backdropFilter: "blur(1px)" }}
    >
      <div
        className="modal modal-large"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 980 }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{product.name}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body p-0">
          {/* 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
            {/* LEFT: IMAGE CAROUSEL */}
            <div
              className="relative"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="relative rounded-xl bg-white border border-gray-200 overflow-hidden">
                {total > 0 ? (
                  <>
                    <img
                      key={current}
                      src={resolveSrc(images[current])}
                      alt={product.name}
                      className="w-full h-[340px] object-contain bg-white"
                    />
                    {/* Glass arrows */}
                    {total > 1 && (
                      <>
                        <button
                          type="button"
                          className="carousel-arrow left"
                          onClick={prev}
                          aria-label="Previous Image"
                          title="Previous"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          type="button"
                          className="carousel-arrow right"
                          onClick={next}
                          aria-label="Next Image"
                          title="Next"
                        >
                          <ChevronRight size={22} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-[340px] flex items-center justify-center bg-gray-50">
                    <Package size={48} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* dots */}
              {total > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`dot ${i === current ? "active" : ""}`}
                      onClick={() => {
                        setCurrent(i);
                        restart();
                      }}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: INFO CARDS (POS style) */}
            <div className="space-y-4">
              {/* Product Info */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Box size={18} />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-700">
                    Product Info
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={<Tag size={16} />} label="Brand" value={product.brand || "—"} />
                  <InfoRow icon={<Layers size={16} />} label="Category" value={product.category?.name || "—"} />
                  <InfoRow icon={<Barcode size={16} />} label="SKU" value={product.sku} />
                  {product.barcode && (
                    <InfoRow icon={<Barcode size={16} />} label="Barcode" value={product.barcode} />
                  )}
                </div>
                {product.description && (
                  <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                    {product.description}
                  </div>
                )}
              </div>

              {/* Pricing & Profit (role-based visibility) */}
              {(canSeeCost || price > 0) && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={18} />
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-700">
                      Pricing & Profit
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Price" value={`$${price.toFixed(2)}`} />
                    {canSeeCost && (
                      <InfoRow label="Cost" value={`$${costPrice.toFixed(2)}`} />
                    )}
                    {canSeeCost && (
                      <>
                        <InfoRow label="Profit / item" value={`$${profitPerItem.toFixed(2)}`} />
                        <InfoRow label="Total Profit (stock)" value={`$${totalProfit.toFixed(2)}`} />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Inventory */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={18} />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-700">
                    Inventory
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Stock" value={`${stock} ${product.unit || "pcs"}`} />
                  <InfoRow label="Min Stock" value={String(product.minStock ?? 0)} />
                  <InfoRow
                    label="Status"
                    value={
                      <span className={stockLow ? "stock-low" : "stock-good"}>
                        {stockLow ? "Low" : "Good"}
                      </span>
                    }
                  />
                  {product.isActive !== undefined && (
                    <InfoRow label="Active" value={product.isActive ? "Yes" : "No"} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Inline style helpers if you don't have Tailwind for these parts */}
      <style>{`
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          background: rgba(255, 255, 255, 0.35);
          box-shadow: 0 6px 24px rgba(0,0,0,0.15);
        }
        .carousel-arrow.left { left: 8px; }
        .carousel-arrow.right { right: 8px; }
        .dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #cfd2d4; border: none; cursor: pointer;
        }
        .dot.active { background: #2563eb; }
        .stock-low { color: #b91c1c; font-weight: 600; }
        .stock-good { color: #065f46; font-weight: 600; }
      `}</style>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      {icon ? <span className="text-gray-500">{icon}</span> : null}
      <span className="text-gray-500">{label}:</span>
      <span className="ml-auto font-medium text-gray-800">
        {value ?? "—"}
      </span>
    </div>
  );
}
