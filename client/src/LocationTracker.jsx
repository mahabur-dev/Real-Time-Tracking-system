import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const LocationTracker = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [targetLocation, setTargetLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [myUserId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2); // Distance in km
  };

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000');

    // Join with user ID
    socketRef.current.emit('join', myUserId);

    // Listen for location updates
    socketRef.current.on('locationUpdate', (data) => {
      if (data.userId === targetUserId) {
        setTargetLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    // Start watching user's location
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          // Send location to server
          socketRef.current.emit('updateLocation', {
            userId: myUserId,
            latitude,
            longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      socketRef.current.disconnect();
    };
  }, [myUserId, targetUserId]);

  // Calculate distance when locations change
  useEffect(() => {
    if (currentLocation && targetLocation) {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        targetLocation.latitude,
        targetLocation.longitude
      );
      setDistance(dist);
    }
  }, [currentLocation, targetLocation]);

  const handleTrackUser = () => {
    if (targetUserId.trim()) {
      socketRef.current.emit('trackUser', targetUserId);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Real-Time Location Tracker</h2>
        
        <div style={styles.section}>
          <h3 style={styles.subtitle}>Your User ID</h3>
          <p style={styles.userId}>{myUserId}</p>
          <small style={styles.hint}>Share this ID with others to let them track you</small>
        </div>

        <div style={styles.section}>
          <h3 style={styles.subtitle}>Your Location</h3>
          {currentLocation ? (
            <div style={styles.coords}>
              <p>Latitude: {currentLocation.latitude.toFixed(6)}</p>
              <p>Longitude: {currentLocation.longitude.toFixed(6)}</p>
              <span style={styles.liveIndicator}>🔴 Live</span>
            </div>
          ) : (
            <p style={styles.loading}>Getting your location...</p>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.subtitle}>Track Someone</h3>
          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter User ID to track"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleTrackUser} style={styles.button}>
              Track
            </button>
          </div>
        </div>

        {targetLocation && (
          <div style={styles.section}>
            <h3 style={styles.subtitle}>Target Location</h3>
            <div style={styles.coords}>
              <p>Latitude: {targetLocation.latitude.toFixed(6)}</p>
              <p>Longitude: {targetLocation.longitude.toFixed(6)}</p>
            </div>
          </div>
        )}

        {distance && (
          <div style={styles.distanceCard}>
            <h3 style={styles.distanceLabel}>Distance</h3>
            <p style={styles.distanceValue}>{distance} km</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center'
  },
  section: {
    marginBottom: '25px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '12px'
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '12px'
  },
  userId: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#667eea',
    padding: '10px',
    background: 'white',
    borderRadius: '8px',
    marginBottom: '8px',
    wordBreak: 'break-all'
  },
  hint: {
    color: '#888',
    fontSize: '13px'
  },
  coords: {
    color: '#555',
    fontSize: '14px'
  },
  liveIndicator: {
    display: 'inline-block',
    marginTop: '8px',
    padding: '4px 12px',
    background: '#ff4444',
    color: 'white',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  loading: {
    color: '#888',
    fontStyle: 'italic'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none'
  },
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  distanceCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    marginTop: '25px'
  },
  distanceLabel: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  distanceValue: {
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0
  }
};

export default LocationTracker;