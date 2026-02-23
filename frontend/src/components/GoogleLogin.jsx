import { GoogleLogin as GoogleLoginButton } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const GoogleLogin = () => {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    // Show only loading toast
    const loadingToast = toast.loading('Logging in with Google...');
    
    try {
      if (!credentialResponse.credential) {
        toast.error('Google login failed: No credential', { id: loadingToast });
        return;
      }

      // Send to backend
      const response = await authAPI.googleLogin({
        access_token: credentialResponse.credential,
        id_token: credentialResponse.credential
      });

      if (response.data) {
        // Store tokens
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        
        // Store user data if provided
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Let AuthContext handle the success toast
        // Just pass the data and it will show "Login successful"
        await authLogin({
          access: response.data.access_token,
          refresh: response.data.refresh_token,
          user: response.data.user
        });
        
        // Dismiss loading toast - AuthContext will show success
        toast.dismiss(loadingToast);
        
        // Redirect to home
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.', { id: loadingToast });
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };

  return (
    <div className="w-full">
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="100%"
      />
    </div>
  );
};

export default GoogleLogin;