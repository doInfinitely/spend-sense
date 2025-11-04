import React, { useEffect, useState } from 'react';
import CustomerCard from '../components/CustomerCard';

const PAGE_SIZE = 20;

const CustomerDashboard = () => {
  const [customers, setCustomers] = useState({ data: [], totalPages: 0 });
  const [filters, setFilters] = useState({
    minTransactions: '',
    minDaysWindow: '',
    minTotalSpend: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val !== '') params.append(key, val);
    }
    params.append('page', currentPage);
    params.append('pageSize', PAGE_SIZE);
    try {
      const res = await fetch(`http://localhost:8000/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers({ data: [], totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on filter
    fetchCustomers();
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Min Transactions</label>
          <input type="number" name="minTransactions" value={filters.minTransactions} onChange={handleChange} className="border rounded p-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Min Days Window</label>
          <input type="number" name="minDaysWindow" value={filters.minDaysWindow} onChange={handleChange} className="border rounded p-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Min Total Spend</label>
          <input type="number" name="minTotalSpend" value={filters.minTotalSpend} onChange={handleChange} className="border rounded p-1" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Apply Filters</button>
      </form>

      {loading ? (
        <p>Loading customers...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.data && customers.data.map(c => (
              <CustomerCard
                key={c.customerId}
                customerId={c.customerId}
                creditLimit={c.creditLimit}
                acqCountry={c.acqCountry}
                data={c.transactions}
              />
            ))}
          </div>

          <div className="flex justify-center items-center mt-6 gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {currentPage} of {customers.totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(customers.totalPages, p + 1))}
              disabled={currentPage >= customers.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerDashboard;

