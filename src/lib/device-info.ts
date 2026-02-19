export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Try to extract phone model
  let phoneModel = null;
  const iphoneMatch = ua.match(/iPhone\s?(\w+)?/);
  const androidMatch = ua.match(/;\s*([^;]+)\s*Build\//);
  if (iphoneMatch) phoneModel = iphoneMatch[0];
  else if (androidMatch) phoneModel = androidMatch[1]?.trim();

  return {
    deviceType,
    browser,
    os,
    phoneModel,
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}
