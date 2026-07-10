import React, { useState, useEffect } from 'react';
import { earningsAPI, Transaction } from '../services/api';

const Earnings = () => {
  const [report, setReport] = useState([]);
  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, groupBy]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await earningsAPI.getReport(dateFrom, dateTo, groupBy);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch earnings report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Period,Transactions,Gross Revenue,Commission,Provider Payout\n"
      + report.map(row => `${row.period},${row.transactions},${row.gross_revenue},${row.commission},${row.provider_payout}`).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `earnings_report_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalGross = report.reduce((sum, row) => sum + (parseFloat(row.gross_revenue) || 0), 0);
  const totalCommission = report.reduce((sum, row) => sum + (parseFloat(row.commission) || 0), 0);
  const totalPayout = report.reduce((sum, row) => sum + (parseFloat(row.provider_payout) || 0), 0);
  const totalTransactions = report.reduce((sum, row) => sum + (parseInt(row.transactions) || 0), 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Earnings & Finance</h1>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4 flex-wrap items-center">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ml-auto"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Gross Revenue</p>
          <p className="text-3xl font-bold">PKR {totalGross.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Platform Commission</p>
          <p className="text-3xl font-bold text-red-600">PKR {totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Provider Payouts</p>
          <p className="text-3xl font-bold text-green-600">PKR {totalPayout.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Transactions</p>
          <p className="text-3xl font-bold">{totalTransactions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Revenue vs Commission</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Revenue Chart - Recharts AreaChart]
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Revenue by Category</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Category Chart - Recharts BarChart]
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Earnings Report</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 font-medium">{row.period}</td>
                  <td className="px-6 py-4">{row.transactions}</td>
                  <td className="px-6 py-4">PKR {parseFloat(row.gross_revenue).toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-600">PKR {parseFloat(row.commission).toFixed(2)}</td>
                  <td className="px-6 py-4 text-green-600">PKR {parseFloat(row.provider_payout).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Earnings;
