import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient'; // Correct import path
import './LoginSignup.css'; // Import the CSS file for styles
import iitdelhiImage from '../../assests/iitdelhi.png';
// import aiimsdelhiImage from '../../assests/aiimsdelhi.png';
import aihLogo from '../../assests/aihLogo.png';

const LoginSignup = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async e => {
    e.preventDefault();

    const response = await apiClient.obtainAuthTokenPair(username, password);
    if (response.success) {
      const { access, refresh } = response.result.tokens;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setIsAuthenticated(true); // Set authentication state
      navigate('/');

      console.log(response);
    } else {
      setError(response.error.user_friendly_message);
    }
  };

  return (
    // </div>
    <div className="login-container">
      {/* New heading and image */}
      <div className="header-container">
        <div className="logos">
          <img
            src={aihLogo} // Replace with your image path
            alt="Logo"
            className="circular-image"
            style={{
              width: '200px',
              height: '180px',
              marginRight: '25px',
              objectFit: 'contain', // Ensures the image is fully visible without cropping
            }}
          />
          <img
            src={iitdelhiImage} // Replace with your image path
            alt="Logo"
            className="circular-image"
            style={{
              width: '140px', // Adjust to your desired size
              height: '140px', // Keep it the same as width to maintain the circle
              // borderRadius: '50%', // Ensures the image is circular
              objectFit: 'contain', // Ensures the image is fully visible without cropping
            }}
          />
        </div>

        <span className="subsubheading">AI in Healthcare Lab at IIT Delhi</span>

        <h1 className="neon-heading">
          SWASTH
          <span className="subheading">
            Smart Workflow for AI-assisted <br />
            Screening and Treatment in Healthcare
          </span>
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="login-form"
      >
        <h1 className="login-title">Login</h1>
        {error && <p className="login-error">{error}</p>}
        <div className="login-field">
          <label className="login-label">Email Id</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div className="login-field">
          <label className="login-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <button
          type="submit"
          className="login-button"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginSignup;
