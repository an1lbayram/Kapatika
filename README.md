# Kapatika (Desktop)

[English](./README.en.md)

!React
!Electron

Windows için **Kapatika** bilgisayar zamanlayıcı uygulaması. Electron ve React ile geliştirilmiştir. İşletim sisteminizi belirtilen süre sonunda güvenli şekilde `shutdown.exe` çağrıları kullanarak kapatır.

## Teknoloji Yığını

- **Arayüz (Frontend):** React, Material-UI (MUI), Vite
- **Masaüstü Çerçevesi:** Electron, electron-builder

## Özellikler

- **Süre formatları**: `90`, `600s`, `10m`, `1h`, `1h30m`, `2h15m10s`
- **İptal Seçeneği**: Başlatılmış zamanlanmış kapatmayı anında iptal edebilirsiniz.
- **Kullanıcı Dostu Arayüz**: Tekerlek tipi kaydırılabilir menüler ile saniyeler içinde süre belirleme imkanı.

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
