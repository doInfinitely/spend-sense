import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow rounded-xl p-4 ${className}`}>{children}</div>
);

// Inline hex colors (Tailwind equivalents) so they never get purged.
const colorForUtilHex = (u) => {
  if (u >= 0.8) return '#ef4444';   // red-500
  if (u >= 0.5) return '#fb923c';   // orange-400
  if (u >= 0.3) return '#fde047';   // yellow-300
  return '#4ade80';                 // green-400
};

function makeBuckets(points, maxBuckets = 120) {
  if (!points || points.length === 0) return [];
  const n = Math.min(maxBuckets, points.length);
  const size = Math.ceil(points.length / n);
  const buckets = [];
  for (let i = 0; i < points.length; i += size) {
    const slice = points.slice(i, i + size);
    let maxU = 0;
    let any = null;
    for (const p of slice) {
      if (p && typeof p.utilization === 'number') {
        if (p.utilization > maxU) maxU = p.utilization;
        any = p;
      }
    }
    if (any) buckets.push({ utilization: maxU, date: any.date });
  }
  return buckets;
}

const CustomerCard = ({ customerId, creditLimit, data = [], acqCountry }) => {
  const timeline = Array.isArray(data)
    ? data
        .filter(
          (t) =>
            t &&
            typeof t.availableMoney === 'number' &&
            (typeof t.transactionDateTime === 'string' ||
              t.transactionDateTime instanceof Date)
        )
        .map((t) => {
          const used = creditLimit - t.availableMoney;
          const u = creditLimit > 0 ? used / creditLimit : 0;
          return {
            date:
              typeof t.transactionDateTime === 'string'
                ? t.transactionDateTime
                : t.transactionDateTime.toISOString(),
            availableMoney: t.availableMoney,
            utilization: Number.isFinite(u) ? Math.max(0, u) : 0,
          };
        })
    : [];

  const hasData = timeline.length > 0;
  const buckets = makeBuckets(timeline, 120);

  return (
    <Card>
      <div className="font-semibold text-lg mb-1">Customer {customerId}</div>
      <div className="text-sm mb-1">Credit Limit: ${creditLimit.toFixed(2)}</div>
      <div className="text-sm mb-4">Acquiring Country: {acqCountry}</div>

      {hasData ? (
        <div className="w-full min-w-0">
          {/* Chart (explicit height so ResponsiveContainer has real size) */}
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, creditLimit]} hide />
                <Tooltip
                  formatter={(val) =>
                    typeof val === 'number' ? `$${val.toFixed(2)}` : val
                  }
                />
                <Line
                  type="monotone"
                  dataKey="availableMoney"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bucketed utilization timeline */}
          <div className="mt-2 w-full min-w-0">
            <div
              className="rounded"
              style={{
                display: 'grid',
                // ensure each bucket has a visible min width
                gridTemplateColumns: `repeat(${Math.max(
                  buckets.length,
                  1
                )}, minmax(2px, 1fr))`,
                height: 8,
                minHeight: 8,
                background: '#e5e7eb', // gray-200 backdrop so gaps are obvious
                overflow: 'hidden',
              }}
            >
              {buckets.map((b, i) => (
                <div
                  key={i}
                  title={`${(b.utilization * 100).toFixed(1)}% on ${new Date(
                    b.date
                  ).toLocaleDateString()}`}
                  style={{
                    backgroundColor: colorForUtilHex(b.utilization),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </Card>
  );
};

export default CustomerCard;

