# ⏰ Kapatika - Windows Otomatik Kapatma Zamanlayıcısı

![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MUI](https://img.shields.io/badge/MUI-5-007FFF?logo=mui)
![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

**Kapatika**, Windows bilgisayarınızın belirli bir süre veya saat sonunda otomatik ve güvenli şekilde kapatılmasını sağlayan modern bir masaüstü zamanlayıcı uygulamasıdır. **Electron**, **React**, **Material-UI (MUI)** ve **Vite** altyapısıyla geliştirilmiştir.

🌐 *Read this in [English](README.en.md).*

---

## ✨ Özellikler

- ⏳ **Canlı Geri Sayım & İlerleme Çubuğu:** Aktif zamanlayıcılar için dijital saat ve görsel dolum çubuğu.
- ⚡ **Hızlı Süre Butonları:** 15 dk, 30 dk, 45 dk, 1 saat gibi hazır butonlarla tek tıkla zamanlama.
- 🔄 **Akıllı Girdi ve Senkronizasyon:** Süre tekerleği ile serbest metin girişi (`90`, `600s`, `10m`, `1h30m`, `2h15m10s`) çift yönlü senkronize çalışır.
- 🛑 **Güvenli İptal Seçeneği:** Başlatılmış olan kapatma işlemini dilediğiniz an tek tıkla iptal etme.
- 🎨 **Modern Glassmorphism Tasarım:** Şık karanlık tema, göz yormayan renk paleti ve tepkisel arayüz.
- 🛡️ **Sistem Güvenliği:** Kapatma komutları yalnızca Electron **Main Process** içinden güvenli IPC ile çağrılır (`shutdown.exe`).

---

## 💻 Sistem Gereksinimleri

1. **Windows 10 veya Windows 11**
2. **Node.js** (v18.0.0 veya üzeri): [Node.js İndir](https://nodejs.org/)
3. **Git**: [Git İndir](https://git-scm.com/)

---

## 🚀 Kurulum ve Çalıştırma

### ⚡ Tek Satırda Kurulum ve Çalıştırma (Hızlı Başlangıç)

Terminalinizi (PowerShell / CMD) açıp aşağıdaki tek komutu yapıştırarak projeyi anında klonlayabilir, bağımlılıkları yükleyebilir ve uygulamayı çalıştırabilirsiniz:

```bash
git clone https://github.com/an1lbayram/Kapatika.git && cd Kapatika && npm install && npm run dev
```

---

### 📋 Adım Adım Kurulum (Hiç Bilmeyenler İçin)

#### 1️⃣ Terminal / Komut Satırını Açın
Windows Başlat menüsünden `PowerShell` veya `CMD` uygulamasını açın.

#### 2️⃣ Repoyu Klonlayın
Projeyi bilgisayarınıza indirmek için:
```bash
git clone https://github.com/an1lbayram/Kapatika.git
```

#### 3️⃣ Proje Klasörüne Geçin
```bash
cd Kapatika
```

#### 4️⃣ Bağımlılıkları (Gerekli Paketleri) Yükleyin
```bash
npm install
```

#### 5️⃣ Uygulamayı Geliştirici Modunda Başlatın
```bash
npm run dev
```
Vite geliştirme sunucusu başlayacak ve Electron masaüstü penceresi otomatik açılacaktır.

---

## 📦 Kurulum Dosyası (.exe) Oluşturma (Build)

Projeyi Windows yükleyicisi (`Setup.exe`) veya taşınabilir (`Portable.exe`) formatta derlemek için:

```bash
npm run dist
```

Oluşturulan dosyalar **`dist/`** klasörü altında yer alır:
- `Kapatika Setup <sürüm>.exe` (NSIS Yükleyici)
- `Kapatika <sürüm>.exe` (Portatif sürüm)

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

**Geliştirici:** [Anıl Bayram](https://github.com/an1lbayram)
