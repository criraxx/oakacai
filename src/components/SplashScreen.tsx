import splashFull from "@/assets/splash-full.png";

const SplashScreen = () => {
  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ 
        width: '100vw', 
        height: '100dvh', 
        margin: 0, 
        padding: 0,
        background: '#ffffff'
      }}
    >
      <img 
        src={splashFull} 
        alt="Logo" 
        className="w-full h-full object-cover animate-scale-in"
        style={{
          objectPosition: 'center center',
          minWidth: '100%',
          minHeight: '100%'
        }}
      />
    </div>
  );
};

export default SplashScreen;
