# Kapatika (Desktop)

[English](./README.en.md)

!React
!Electron

Windows için **Kapatika** bilgisayar zamanlayıcı uygulaması. Electron ve React ile geliştirilmiştir. İşletim sisteminizi belirtilen süre sonunda güvenli şekilde `shutdown.exe` çağrıları kullanarak kapatır.

## Teknoloji Yığını

- **Arayüz (Frontend):** React, Material-UI (MUI), Vite
- **Masaüstü Çerçevesi:** Electron, electron-builder

## Özellikler

- **Canlı Geri Sayım & İlerleme Çubuğu**: Aktif zamanlayıcılar için dijital saat ve görsel ilerleme çubuğu.
- **Hızlı Süre Butonları**: 15 dk, 30 dk, 45 dk, 1 saat gibi hazır butonlarla 1-tıkla zamanlama.
- **Tekerlek & Metin Senkronizasyonu**: Süre tekerleği ve serbest metin girişi (`90`, `600s`, `10m`, `1h30m`, `2h15m10s`) çift yönlü senkronizedir.
- **İptal Seçeneği**: Başlatılmış zamanlanmış kapatmayı tek tıkla anında ve güvenle iptal edebilme.
- **Web Önizleme Desteği**: Tarayıcı / Netlify üzerinde simülasyon olarak test edebilme imkanı.
- **Kullanıcı Dostu & Cam Efektli (Glassmorphism) Modern Arayüz**: Şık karanlık tema ve tepkisel tasarım.

## Geliştirme

```bash
npm install
npm run dev
```

> Not: `npm run dev` Vite sunucusunu başlatır ve port doluysa otomatik başka porta geçer. Electron otomatik doğru URL ile açılır.

## Build (release)

```bash
npm run dist
```

Çıktı `dist/` (renderer) ve `dist-electron/` (main/preload) altında hazırlanır; `electron-builder` Windows için installer/portable üretir.

Oluşan dosyalar:

- `dist/Kapatika Setup <versiyon>.exe` (NSIS installer)
- `dist/Kapatika <versiyon>.exe` (portable)

## Güvenlik

- Renderer tarafında **Node entegrasyonu kapalıdır**.
- `shutdown.exe` çağrıları sadece Electron **main process** içinden yapılır (IPC ile).

## Not: electron-builder (Windows) symlink hatası

Bazı Windows kurulumlarında `electron-builder` `winCodeSign` arşivini açarken **symbolic link** yetkisi yüzünden hata verebiliyor. Bu proje `npm run dist` öncesi otomatik olarak `winCodeSign` cache'ini **symlink gerektirmeyen zip** ile doldurur (`scripts/prefetch-winCodeSign.mjs`).
