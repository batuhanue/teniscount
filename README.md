# Courtly · Masa tenisi sayacı

React + Vite + Three.js ile mobil odaklı, Türkçe masa tenisi sayacı.

## Geliştirme

Node.js 22 veya üzeri kullanın.

```sh
npm ci
npm run dev
npm test
npm run build
```

İki oyuncunun adı, 3/5/7 setlik maç formatı, ilk servis ve masa tarafları seçilir. Setler 11 sayı ve iki farkla kazanılır. Servis iki sayıda bir, 10–10 sonrası her sayıda değişir. Sayı ekleme, geri alma, manuel taraf değiştirme, mola, isteğe bağlı ses ve titreşim desteklenir. Maç bu tarayıcının localStorage alanına kaydedilir. Masa tarafları oyuncuların fiziksel konumuna göre manuel değiştirilir. Hesap veya sunucu gerekmez.

## Vercel

Depoyu GitHub'a gönderip Vercel'de **Add New → Project** ile içe aktarın. Framework: Vite; build: `npm run build`; output: `dist`. Ortam değişkeni gerekmez. `vercel.json` yapılandırmayı içerir. Yayın için kendi Vercel hesabınız ve depo bağlantınız gerekir.

## PWA

HTTPS üzerinde manifest ve service worker devreye girer. Chromium'da destekleniyorsa yükleme düğmesi görünür; iOS Safari'de Paylaş → Ana Ekrana Ekle kullanılır. İlk çevrimiçi ziyarette service worker kurulumu tamamlandığında bütün derlenmiş JavaScript/CSS dosyaları (ayrı 3D modülü dahil) önbelleğe alınır; sonraki açılışlarda çevrimdışı çalışır. `vite.config.js` her derlemede kesin dosya adlarını `src/service-worker.js` şablonuna yazar. Servis worker geliştirme modunda kaydedilmez; `npm run build && npm run preview` ile test edilir. Arayüz cihazın sistem yazı tipini kullanır; harici font isteği gerekmez.

## Doğrulama

`npm test`: servis dönüşümü, uzatma, set ve maç kazanma kuralları. Mobil tarayıcıda maç kurulumu, puanlama, geri alma, mola, taraf değişimi ve yeniden yükleme sonrası kayıt doğrulanmıştır.

## Tablet ve ses

Ana ekranda yalnızca canlı masa, iki büyük skor kartı ve temel kontroller bulunur. Set detayları üstteki set düğmesinden, yeni maç ayarları sağ üstten açılır. Telefon ve tabletlerin dikey/yatay görünümüne, Split View ve ekranın güvenli kenarlarına uyarlanır. Dokunmatik kontroller en az 44 px yüksekliğindedir.

Üstteki hoparlör düğmesi tüm sesleri açar/kapatır; tercih cihazda saklanır. Sayı sesi yerel Web Audio senteziyle üretilen kısa masa tenisi topu çarpmasıdır (gerçek kayıt değildir); animasyondaki sekmeye eşlenir. Diğer kontroller kısa, düşük seviyeli tonlar kullanır. iPadOS sesin ilk kullanıcı etkileşiminde açılmasını gerektirir. Ses kapatıldığında ve sayı geri alındığında bekleyen çarpma iptal edilir.

## 3D ralli

Masa, ayaklar, file, raketler ve top gerçek WebGL geometrileridir. Raketler masanın iki ucunda topu karşılar. Her dönüşte yeni hedef, hız ve yay yüksekliği hesaplanır; hızlı, çapraz ve yüksek vuruşlar değişir. Ralli görseldir, skoru değiştirmez. Sayı girildiğinde ralli kesilir, raketler gizlenir ve kazanan vuruş oynatılır. Molada ralli durur; azaltılmış hareket tercihinde ralli ve ışık hareketleri sabit kalır; sekme arka plandayken çizim durur. WebGL olmayan cihazlarda skor kontrolleri kullanılabilir. 3D motor ayrı bir paket olarak yüklenir.

## Liquid glass

`src/liquidGlass.js` canlı 3D sahneyi bir render hedefinden okuyan ikinci WebGL geçişidir. DOM cam panellerinin gerçek ekran koordinatlarını izler; yuvarlatılmış kenar normalleriyle görüntüyü kırar, hafif renk ayrışması, yumuşatma ve imleç/dokunma konumuna tepki veren kenar parlamaları üretir. Zemindeki ışık desenleri de shader ile zaman içinde hesaplanır. Bu bir gerçek zamanlı ekran alanı optik efektidir; ray tracing kullanılmaz. Metin ve kontroller erişilebilir HTML olarak kalır.

Piksel oranı 1.5 ile, çoklu örnekleme 2 ile sınırlıdır. WebGL yoksa CSS cam görünümüne geçilir; skor tutma devam eder. Hareket azaltma ve yüksek kontrast tercihleri desteklenir. Fiziksel iPad üzerinde GPU performansı ayrıca ölçülmelidir.
