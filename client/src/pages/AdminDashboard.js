import React, { useState, useEffect } from 'react';
import { FaUsers, FaChartBar, FaCog } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  const [qrCount, setQrCount] = useState(1);
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    const savedCodes = localStorage.getItem('admin_qr_codes');
    if (savedCodes) {
      setCodes(JSON.parse(savedCodes));
    }
  }, []);

  const saveCodes = (codesArr) => {
    localStorage.setItem('admin_qr_codes', JSON.stringify(codesArr));
  };

  // Helper to generate a 16-digit unique code
  const generateUniqueCode = () => {
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  };

  const handleGenerate = () => {
    const newCodes = [];
    for (let i = 0; i < qrCount; i++) {
      newCodes.push(generateUniqueCode());
    }
    const updatedCodes = [...codes, ...newCodes];
    setCodes(updatedCodes);
    saveCodes(updatedCodes);
  };

  const handleDelete = (idx) => {
    const updatedCodes = codes.filter((_, i) => i !== idx);
    setCodes(updatedCodes);
    saveCodes(updatedCodes);
  };

  // Download QR as image
  const downloadQR = (code, idx) => {
    const canvas = document.getElementById(`qr-canvas-${idx}`);
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${code}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <FaUsers className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage all users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FaChartBar className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View system statistics</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <FaCog className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">System configuration</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate QR Codes</h2>
          <div className="flex items-center mb-4 gap-4">
            <input
              type="number"
              min="1"
              max="100"
              value={qrCount}
              onChange={e => setQrCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="border rounded px-3 py-2 w-32"
              placeholder="Number of QRs"
            />
            <button
              onClick={handleGenerate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Generate
            </button>
          </div>
          {codes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {codes.map((code, idx) => (
                <div key={code} className="flex flex-col items-center bg-gray-100 p-4 rounded shadow">
                  <QRCodeCanvas
                    id={`qr-canvas-${idx}`}
                    value={code}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="mt-2 font-mono text-sm">{code}</div>
                  <button
                    onClick={() => downloadQR(code, idx)}
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Features</h2>
          <p className="text-gray-600">
            Full admin dashboard with user management, analytics, and system settings will be implemented in the next version.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 