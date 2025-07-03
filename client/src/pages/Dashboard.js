import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaBriefcase, FaCalendar, FaShieldAlt } from 'react-icons/fa';
import QrScanner from 'react-qr-scanner';
import jsQR from 'jsqr';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Dashboard = () => {
  const { user } = useAuth();

  // QR code state
  const [qrModal, setQrModal] = useState(null); // 'scan' | 'upload' | 'manual' | null
  const [qrInput, setQrInput] = useState('');
  const [qrPurpose, setQrPurpose] = useState('');
  const [userQRCodes, setUserQRCodes] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Track if QR codes have been loaded for this user
  const loadedQRCodesRef = useRef(false);

  // Location state
  const [locationModalIdx, setLocationModalIdx] = useState(null); // index of QR code for location entry
  const [mapModalIdx, setMapModalIdx] = useState(null); // index of QR code for map display
  const [locationInput, setLocationInput] = useState({ lat: '', lng: '' });
  const [trackLocationMessage, setTrackLocationMessage] = useState('');

  // Load QR codes from localStorage only once per user
  useEffect(() => {
    if (user?.email && !loadedQRCodesRef.current) {
      const savedQRCodes = localStorage.getItem(`userQRCodes_${user.email}`);
      if (savedQRCodes) {
        setUserQRCodes(JSON.parse(savedQRCodes));
      }
      loadedQRCodesRef.current = true;
    }
  }, [user?.email]);

  // Save QR codes to localStorage whenever they change, but only if loaded
  useEffect(() => {
    if (user?.email && loadedQRCodesRef.current) {
      localStorage.setItem(`userQRCodes_${user.email}`, JSON.stringify(userQRCodes));
    }
  }, [userQRCodes, user?.email]);

  const openModal = (type) => {
    setQrModal(type);
    setQrInput('');
    setQrPurpose('');
    setError('');
  };
  const closeModal = () => setQrModal(null);

  // Handle QR scan from camera
  const handleScan = (data) => {
    if (data && data.text) {
      setQrInput(data.text);
    }
  };
  const handleScanError = (err) => {
    setError('Camera error: ' + err.message);
  };

  // Handle QR upload and decode
  const handleFileChange = async (e) => {
    setUploading(true);
    setError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, img.width, img.height);
          if (code) {
            setQrInput(code.data);
          } else {
            setError('Could not decode QR code from image.');
          }
          setUploading(false);
        };
      } catch (err) {
        setError('Could not decode QR code from image.');
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQrSubmit = (e) => {
    e.preventDefault();
    if (qrModal === 'manual' && !/^\d{16}$/.test(qrInput.trim())) {
      setError('Manual entry must be exactly 16 digits.');
      return;
    }
    if (!qrInput.trim() || !qrPurpose.trim()) {
      setError('QR code and purpose are required.');
      return;
    }
    setUserQRCodes([...userQRCodes, { code: qrInput.trim(), purpose: qrPurpose.trim() }]);
    closeModal();
  };

  // Handle location entry
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(locationInput.lat);
    const lng = parseFloat(locationInput.lng);
    if (isNaN(lat) || isNaN(lng)) return setError('Latitude and longitude must be numbers.');
    const updatedQRCodes = userQRCodes.map((qr, idx) =>
      idx === locationModalIdx ? { ...qr, location: { lat, lng } } : qr
    );
    setUserQRCodes(updatedQRCodes);
    setLocationModalIdx(null);
    setLocationInput({ lat: '', lng: '' });
    setError('');
  };

  // Handle stop location
  const handleStopLocation = (idx) => {
    const updatedQRCodes = userQRCodes.map((qr, i) =>
      i === idx ? { ...qr, location: undefined } : qr
    );
    setUserQRCodes(updatedQRCodes);
  };

  // Use browser geolocation to fill location input
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationInput({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        });
        setError('');
      },
      () => {
        setError('Unable to retrieve your location.');
      }
    );
  };

  // Handle Track Location button
  const handleTrackLocation = (idx) => {
    if (!userQRCodes[idx]?.location) {
      setTrackLocationMessage('No location set for this QR code. Please enter a location first.');
    } else {
      setTrackLocationMessage('');
    }
    setMapModalIdx(idx);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}!</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role)}`}>
              {getRoleBadge(user?.role)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <FaUser className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaEnvelope className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                </div>
              </div>
              
              {user?.phoneNumber && (
                <div className="flex items-center">
                  <FaPhone className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-900">{user?.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {user?.department && (
                <div className="flex items-center">
                  <FaBuilding className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{user?.department}</p>
                  </div>
                </div>
              )}
              
              {user?.position && (
                <div className="flex items-center">
                  <FaBriefcase className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium text-gray-900">{user?.position}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <FaCalendar className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaShieldAlt className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add QR Code</h2>
          <div className="flex gap-4 mb-4">
            <button onClick={() => openModal('scan')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Scan QR</button>
            <button onClick={() => openModal('upload')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Upload QR</button>
            <button onClick={() => openModal('manual')} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Manual Entry</button>
          </div>
          {/* Modal for QR input */}
          {qrModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="float-right text-gray-400 hover:text-gray-700" onClick={closeModal}>&times;</button>
                <h3 className="text-lg font-semibold mb-4">
                  {qrModal === 'scan' && 'Scan QR Code'}
                  {qrModal === 'upload' && 'Upload QR Code Image'}
                  {qrModal === 'manual' && 'Manual QR Code Entry'}
                </h3>
                <form onSubmit={handleQrSubmit}>
                  {qrModal === 'scan' && (
                    <div className="mb-4">
                      <QrScanner
                        delay={300}
                        onError={handleScanError}
                        onScan={handleScan}
                        style={{ width: '100%' }}
                      />
                      <input type="text" className="border rounded px-3 py-2 w-full mt-2" placeholder="Scanned QR code will appear here" value={qrInput} readOnly />
                    </div>
                  )}
                  {qrModal === 'upload' && (
                    <div className="mb-4">
                      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2" disabled={uploading} />
                      <input type="text" className="border rounded px-3 py-2 w-full" placeholder="Decoded QR code will appear here" value={qrInput} readOnly />
                    </div>
                  )}
                  {qrModal === 'manual' && (
                    <div className="mb-4">
                      <input type="text" className="border rounded px-3 py-2 w-full" placeholder="Enter 16-digit QR code" value={qrInput} onChange={e => setQrInput(e.target.value.replace(/[^0-9]/g, ''))} maxLength={16} />
                    </div>
                  )}
                  <div className="mb-4">
                    <input type="text" className="border rounded px-3 py-2 w-full" placeholder="Purpose of this QR code" value={qrPurpose} onChange={e => setQrPurpose(e.target.value)} />
                  </div>
                  {error && <div className="text-red-600 mb-2">{error}</div>}
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={uploading}>Add QR Code</button>
                </form>
              </div>
            </div>
          )}
          {/* List of user's QR codes */}
          {userQRCodes.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Your QR Codes</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>QR Code</th>
                    <th>Purpose</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userQRCodes.map((qr, idx) => (
                    <tr key={idx}>
                      <td className="font-mono">{qr.code}</td>
                      <td>{qr.purpose}</td>
                      <td>{qr.location ? `${qr.location.lat}, ${qr.location.lng}` : 'N/A'}</td>
                      <td>
                        <button onClick={() => handleTrackLocation(idx)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Track Location</button>
                        <button onClick={() => handleStopLocation(idx)} className="bg-red-500 text-white px-2 py-1 rounded mr-2">Stop Location</button>
                        <button onClick={() => { setLocationModalIdx(idx); setLocationInput(qr.location || { lat: '', lng: '' }); setError(''); }} className="bg-green-500 text-white px-2 py-1 rounded">Enter Location</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <FaUser className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Update Profile</h3>
                <p className="text-sm text-gray-600">Edit your personal information</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FaShieldAlt className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Security</h3>
                <p className="text-sm text-gray-600">Change password and security settings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <FaEnvelope className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Support</h3>
                <p className="text-sm text-gray-600">Get help and contact support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FaUser className="text-blue-600 text-sm" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Profile Updated</p>
                  <p className="text-sm text-gray-600">Your profile information was updated</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <FaShieldAlt className="text-green-600 text-sm" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Login Successful</p>
                  <p className="text-sm text-gray-600">You successfully logged into your account</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <FaEnvelope className="text-purple-600 text-sm" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Account Created</p>
                  <p className="text-sm text-gray-600">Your account was successfully created</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Entry Modal */}
      {locationModalIdx !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="float-right text-gray-400 hover:text-gray-700" onClick={() => setLocationModalIdx(null)}>&times;</button>
            <h3 className="text-lg font-semibold mb-4">Enter Location (Latitude & Longitude)</h3>
            <form onSubmit={handleLocationSubmit}>
              <input type="number" step="any" placeholder="Latitude" className="border rounded px-3 py-2 w-full mb-2" value={locationInput.lat} onChange={e => setLocationInput({ ...locationInput, lat: e.target.value })} required />
              <input type="number" step="any" placeholder="Longitude" className="border rounded px-3 py-2 w-full mb-2" value={locationInput.lng} onChange={e => setLocationInput({ ...locationInput, lng: e.target.value })} required />
              <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 mb-2" onClick={handleUseMyLocation}>Use My Location</button>
              {error && <div className="text-red-600 mb-2">{error}</div>}
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Location</button>
            </form>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapModalIdx !== null && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px', height: '400px' }}>
            <button className="float-right text-gray-400 hover:text-gray-700" onClick={() => setMapModalIdx(null)}>&times;</button>
            <h3 className="text-lg font-semibold mb-4">QR Code Location</h3>
            {trackLocationMessage ? (
              <div className="text-red-600">{trackLocationMessage}</div>
            ) : (
              userQRCodes[mapModalIdx]?.location && (
                <MapContainer center={[userQRCodes[mapModalIdx].location.lat, userQRCodes[mapModalIdx].location.lng]} zoom={15} style={{ height: '300px', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[userQRCodes[mapModalIdx].location.lat, userQRCodes[mapModalIdx].location.lng]}>
                    <Popup>QR Code Location</Popup>
                  </Marker>
                </MapContainer>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 