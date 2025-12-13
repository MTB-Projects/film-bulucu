import '../styles/AboutPage.css'

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="container">
        <h1 className="about-title">Film Bulucu Hakkında</h1>
        
        <section className="about-section">
          <h2>Projemiz</h2>
          <p>
            Film Bulucu, film severlerin hatırladıkları sahneler, diyaloglar veya detaylar üzerinden 
            aradıkları filmleri bulmalarına yardımcı olan yapay zeka destekli bir arama platformudur.
          </p>
          <p>
            Bazen bir filmin sadece belirli bir sahnesini hatırlar, ancak adını bir türlü bulamazsınız. 
            İşte tam bu noktada Film Bulucu devreye girer ve yapay zeka algoritmaları sayesinde 
            hatırladığınız parçalardan yola çıkarak size en uygun film önerilerini sunar.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Nasıl Çalışır?</h2>
          <div className="how-it-works">
            <div className="work-step">
              <div className="step-icon">1</div>
              <div className="step-content">
                <h3>Hatırladığınız Sahneyi Yazın</h3>
                <p>
                  Hatırladığınız film sahnesini, diyaloğu, karakteri veya herhangi bir detayı arama kutusuna yazın.
                  Ne kadar detay verirseniz, sonuçlar o kadar isabetli olacaktır.
                </p>
              </div>
            </div>
            
            <div className="work-step">
              <div className="step-icon">2</div>
              <div className="step-content">
                <h3>Yapay Zeka Analizi</h3>
                <p>
                  Gelişmiş yapay zeka algoritmalarımız, verdiğiniz açıklamayı analiz eder ve geniş film veritabanımızda 
                  arama yaparak en iyi eşleşmeleri belirler.
                </p>
              </div>
            </div>
            
            <div className="work-step">
              <div className="step-icon">3</div>
              <div className="step-content">
                <h3>Sonuçları İnceleyin</h3>
                <p>
                  Size sunulan film önerilerini görebilir, eşleşme oranlarını ve hangi sahnelerin aramanızla eşleştiğini inceleyebilirsiniz.
                  Böylece aradığınız filme hızlıca ulaşabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="about-section">
          <h2>Teknolojimiz</h2>
          <p>
            Film Bulucu, en son yapay zeka ve doğal dil işleme teknolojilerini kullanarak geliştirilmiştir. 
            Sistemimiz sürekli öğrenir ve her yeni arama ile daha akıllı hale gelir.
          </p>
          <div className="tech-list">
            <div className="tech-item">
              <h3>Doğal Dil İşleme</h3>
              <p>Yazılan aramaları anlamlandırır ve film içeriklerini tarar.</p>
            </div>
            <div className="tech-item">
              <h3>Derin Öğrenme</h3>
              <p>Film içerikleri, sahneler ve diyaloglar arasında bağlantılar kurar.</p>
            </div>
            <div className="tech-item">
              <h3>Semantik Arama</h3>
              <p>Kelimelerin ötesinde anlam odaklı eşleştirmeler yapar.</p>
            </div>
          </div>
        </section>
        
        <section className="about-section contact-section">
          <h2>İletişim</h2>
          <p>
            Öneri, görüş ve sorularınız için bizimle iletişime geçebilirsiniz:
          </p>
          <a href="mailto:iletisim@filmbulucu.com" className="contact-email">iletisim@filmbulucu.com</a>
        </section>
      </div>
    </div>
  )
}

export default AboutPage 