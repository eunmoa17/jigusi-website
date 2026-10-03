import React from 'react'

function Hero() {
  return (
    <section id="top" className="relative h-screen w-full overflow-hidden">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/히어로 영상.mp4" type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        {/* 모바일 제목 - 정확히 2줄 고정 */}
        <h1 className="block md:hidden elegant-serif text-white mb-6 opacity-0 animate-fade-in">
          <span className="block whitespace-nowrap text-[38px] sm:text-[42px] leading-[1.1]">지그시 바라보는</span>
          <span className="block whitespace-nowrap text-[38px] sm:text-[42px] leading-[1.1]">작은 풍경</span>
        </h1>
        
        {/* 데스크톱 제목 - 정확히 1줄 고정 */}
        <h1 className="hidden md:block elegant-serif text-6xl lg:text-7xl text-white mb-6 opacity-0 animate-fade-in whitespace-nowrap">
          지그시 바라보는 작은 풍경
        </h1>
        
        <p className="text-white text-lg md:text-xl lg:text-2xl opacity-0 animate-fade-in-delay leading-relaxed">
          천천히 흐르고, 반짝이고, 쌓이는<br />
          책상 위의 작은 오브제
        </p>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1.5s ease-out 0.5s forwards;
        }
        
        .animate-fade-in-delay {
          animation: fadeIn 1.5s ease-out 1s forwards;
        }
      `}</style>
    </section>
  )
}

export default Hero
