import React from 'react';

export function Card({ children, className = '', title, subtitle, action, variant = 'default' }) {
  const bgClass = variant === 'tint' ? 'bg-[#FBEFE7]' : 'bg-white';
  return (
    <div className={`${bgClass} border border-[#F2CCB7] hover:border-[#D9A98E] rounded-2xl p-5 shadow-ct-sm hover:shadow-ct-md transition-all duration-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#FBEFE7]">
          <div>
            {title && <h3 className="text-base font-bold text-[#3B2A22]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#7A6257] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, change, trend = 'neutral', subtitle }) {
  return (
    <div className="bg-white border border-[#F2CCB7] hover:border-[#D9A98E] rounded-2xl p-5 shadow-ct-sm hover:shadow-ct-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A6257]">{label}</p>
          <div className="mt-2 text-2xl font-extrabold text-[#3B2A22] tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-[#7A6257] mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#FBEFE7] border border-[#F2CCB7] flex items-center justify-center text-[#3B2A22] flex-shrink-0">
            <Icon className="w-5 h-5 text-[#3B2A22]" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 pt-2 border-t border-[#FBEFE7] flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend === 'up'
                ? 'text-[#C0392B]'
                : trend === 'down'
                ? 'text-[#3E9B6B]'
                : 'text-[#7A6257]'
            }`}
          >
            {change}
          </span>
          <span className="text-[#7A6257]">vs previous period</span>
        </div>
      )}
    </div>
  );
}
