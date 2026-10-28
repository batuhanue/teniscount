# Courtly · Masa tenisi sayacı

React + Vite ile mobil odaklı, Türkçe, claymorphic masa tenisi sayacı.

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

HTTPS üzerinde manifest ve service worker devreye girer. Chromium'da destekleniyorsa yükleme düğmesi görünür; iOS Safari'de Paylaş → Ana Ekrana Ekle kullanılır. İlk çevrimiçi ziyarette yüklenen uygulama kaynakları önbelleğe alınır; sonraki açılışlarda çevrimdışı çalışır. Servis worker geliştirme modunda kaydedilmez; `npm run build && npm run preview` ile test edilir. Sistem yazı tipi yedeği çevrimdışıyken kullanılır.

## Doğrulama

`npm test`: servis dönüşümü, uzatma, set ve maç kazanma kuralları. Mobil tarayıcıda maç kurulumu, puanlama, geri alma, mola, taraf değişimi ve yeniden yükleme sonrası kayıt doğrulanmıştır.

## Tablet ve ses

iPad/tablet dikey görünümünde geniş masa ve altta yan yana özet kartları; yatayda masa ve sağ özet kullanılır. iPad Split View daraldığında tek sütuna geçilir. Dokunmatik kontroller en az 44 px yüksekliğindedir.

Üstteki hoparlör düğmesi tüm sesleri açar/kapatır; tercih cihazda saklanır. Sayı sesi yerel Web Audio senteziyle üretilen kısa masa tenisi topu çarpmasıdır (gerçek kayıt değildir); animasyondaki sekmeye eşlenir. Diğer kontroller kısa, düşük seviyeli tonlar kullanır. iPadOS sesin ilk kullanıcı etkileşiminde açılmasını gerektirir. Ses kapatıldığında ve sayı geri alındığında bekleyen çarpma iptal edilir.
