import React from 'react'

function Products() {
  const products = [
    {
      id: 1,
      name: '글리터 워터볼 문진',
      description: '빛을 담은 작은 풍경',
      detail: '실버 글리터가 투명한 워터볼 안에서 반짝이고\n천천히 가라앉는 문진',
      price: '45,000원',
      image: '/글리터 문진.png'
    },
    {
      id: 2,
      name: '스노우 워터볼 문진',
      description: '가만히 내려앉는 겨울',
      detail: '흰 입자가 투명한 워터볼 안에서\n눈처럼 움직이는 문진',
      price: '45,000원',
      image: '/눈 문진.png'
    },
    {
      id: 3,
      name: '모래사장 문진',
      description: '작은 모래 풍경',
      detail: '따뜻한 자연광과 베이지 모래가\n어우러진 투명 유리 문진',
      price: '38,000원',
      image: '/모래 문진.png'
    }
  ]

  return (
    <section id="products" className="py-20 md:py-32 px-6 bg-warm-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="elegant-serif text-4xl md:text-5xl lg:text-6xl mb-6">문진</h2>
          <p className="text-lg md:text-xl text-charcoal/80">
            오래 곁에 두고 바라볼 세 가지 풍경
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12">
          {products.map((product) => (
            <div 
              key={product.id}
              className="group cursor-pointer"
            >
              <div className="aspect-[4/5] overflow-hidden mb-6 bg-gray-100 rounded-sm">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              
              <div className="text-center space-y-3">
                <h3 className="elegant-serif text-2xl md:text-3xl">
                  {product.name}
                </h3>
                <p className="text-base md:text-lg text-charcoal/70">
                  {product.description}
                </p>
                <p className="text-sm md:text-base text-charcoal/60 leading-relaxed whitespace-pre-line">
                  {product.detail}
                </p>
                <p className="text-xl md:text-2xl font-medium pt-2">
                  {product.price}
                </p>
                <a 
                  href="#contact" 
                  className="inline-block text-sm text-charcoal/60 hover:text-charcoal underline mt-4"
                >
                  문의하기
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Products
