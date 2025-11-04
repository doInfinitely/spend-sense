import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow rounded-xl p-4 ${className}`}>{children}</div>
);

const colorForUtilization = (util) => {
  if (util >= 0.8) return 'bg-red-500';
  if (util >= 0.5) return 'bg-orange-400';
  if (util >= 0.3) return 'bg-yellow-300';
  return 'bg-green-300';
};

const CustomerCard = ({ customerId, creditLimit, data, acqCountry }) => {
  const utilizationTimeline = data.map((txn) => {
    const used = creditLimit - txn.availableMoney;
    const util = used / creditLimit;
    return {
      date: txn.transactionDateTime,
      availableMoney: txn.availableMoney,
      utilization: util,
    };
  });

  return (
    <Card>
      <div className="font-semibold text-lg mb-1">Customer {customerId}</div>
      <div className="text-sm mb-1">Credit Limit: ${creditLimit.toFixed(2)}</div>
      <div className="text-sm mb-4">Acquiring Country: {acqCountry}</div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={utilizationTimeline}>
          <XAxis dataKey="date" hide />
          <YAxis domain={[0, creditLimit]} hide />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Line type="monotone" dataKey="availableMoney" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex mt-2 space-x-[1px]">
        {utilizationTimeline.map((point, idx) => (
          <div
            key={idx}
            className={`${colorForUtilization(point.utilization)} h-2 flex-1`}
            title={`${(point.utilization * 100).toFixed(1)}% on ${point.date}`}
          ></div>
        ))}
      </div>
    </Card>
  );
};

export default CustomerCard;

