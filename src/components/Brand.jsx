import React from 'react'

function Brand() {
  return (
    <section id="brand" className="py-20 md:py-32 px-6 bg-white">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center space-y-8 md:space-y-12">
          <h2 className="elegant-serif text-4xl md:text-5xl lg:text-6xl">
            지그시
          </h2>
          
          <p className="elegant-serif text-2xl md:text-3xl lg:text-4xl leading-relaxed">
            오래 바라보게 되는 작은 것들
          </p>
          
          <div className="h-px w-24 bg-charcoal/20 mx-auto my-12" />
          
          <div className="space-y-6 text-base md:text-lg lg:text-xl leading-loose text-charcoal/80">
            <p>
              가끔은 아무것도 하지 않고<br />
              무언가를 지그시 바라보는 시간이 필요합니다.
            </p>
            
            <p className="pt-4">
              빛을 따라 움직이는 반짝임,<br />
              천천히 흘러내리는 모래,<br />
              조용히 쌓이는 작은 눈.
            </p>
            
            <p className="pt-4">
              지그시는 일상의 한편에 놓아두고<br />
              지그시 바라볼 수 있는 작은 풍경을 만듭니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Brand
