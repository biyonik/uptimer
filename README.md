# 🚀 Full-Stack GraphQL & Next.js Uygulaması

> GraphQL ve Next.js teknolojilerini kullanarak sıfırdan geliştirilmiş modern full-stack web uygulaması. Backend API'den frontend implementasyonuna kadar tüm geliştirme sürecini kapsayan kapsamlı bir proje.

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Teknoloji Stack](#-teknoloji-stack)
- [Öğrenme Hedefleri](#-öğrenme-hedefleri)
- [Kurulum](#-kurulum)
- [Proje Yapısı](#-proje-yapısı)
- [Geliştirme Süreci](#-geliştirme-süreci)
- [Önemli Kavramlar](#-önemli-kavramlar)
- [Deployment](#-deployment)
- [Kaynaklar](#-kaynaklar)

## 🎯 Proje Hakkında

Bu proje, **GraphQL** ve **Next.js** teknolojilerini kullanarak modern bir full-stack web uygulaması geliştirme sürecini kapsar. Kurs boyunca teorik bilgileri pratikle birleştirerek, gerçek dünya senaryolarına uygun bir uygulama inşa edilmektedir.

### ✨ Teknik Özellikler

- **🔧 GraphQL API**: Esnek ve güçlü veri sorgulama
- **⚡ Next.js 15**: Modern React framework ile frontend geliştirme
- **🔐 JWT Authentication**: Güvenli kullanıcı kimlik doğrulama
- **📡 Real-time Subscriptions**: WebSocket ile gerçek zamanlı veri iletişimi
- **🎨 TailwindCSS**: Utility-first CSS framework ile styling
- **📱 Responsive Design**: Tüm cihazlarda uyumlu tasarım
- **🔒 Authorization**: Yetkilendirme ve güvenlik kontrolleri
- **⚡ Apollo Ecosystem**: Client ve server tarafında Apollo kullanımıına uygun bir uygulama inşa edeceğiz.

### ✨ Temel Özellikler

- **GraphQL API** ile esnek veri sorgulama
- **Next.js 15** ile modern React uygulaması
- **JWT** ile güvenli kimlik doğrulama
- **WebSocket** ile gerçek zamanlı veri iletişimi
- **TailwindCSS** ile responsive tasarım
- **TypeScript** ile tip güvenliği

## 🛠 Teknoloji Stack

### Backend
<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![Apollo Server](https://img.shields.io/badge/Apollo%20Server-311C87?style=for-the-badge&logo=apollo-graphql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

</div>

- **Node.js** - JavaScript runtime environment
- **Express.js** - Minimal web framework
- **Apollo Server** - GraphQL server implementation
- **GraphQL** - Query language ve runtime
- **JWT** - Token-based authentication
- **WebSocket** - Real-time communication

### Frontend
<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Apollo Client](https://img.shields.io/badge/Apollo%20Client-311C87?style=for-the-badge&logo=apollo-graphql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

- **Next.js 15** - React framework with App Router
- **Apollo Client** - GraphQL client library
- **React** - UI component library
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

### Tools & Deployment
- **Git** - Version control
- **Vercel/Netlify** - Frontend deployment
- **Heroku/Railway** - Backend deployment

## 🎓 Öğrenme Hedefleri

### 📚 Backend Geliştirme
- [ ] GraphQL şema tasarımı ve resolver yazma
- [ ] Apollo Server kurulumu ve yapılandırması
- [ ] Queries, Mutations ve Subscriptions implementasyonu
- [ ] JWT ile authentication/authorization
- [ ] WebSocket ile real-time özellikler
- [ ] Error handling ve validation

### 🎨 Frontend Geliştirme
- [ ] Next.js 14 ve App Router kullanımı
- [ ] Apollo Client entegrasyonu
- [ ] GraphQL queries ve mutations
- [ ] Real-time subscriptions
- [ ] TailwindCSS ile component styling
- [ ] Responsive design implementasyonu

### 🔗 Full-Stack Entegrasyon
- [ ] Client-server iletişimi
- [ ] State management
- [ ] Caching strategies
- [ ] Performance optimization
- [ ] Production deployment

## 🚀 Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Git

### Backend Kurulumu
```bash
# Backend klasörü oluştur
mkdir server
cd server

# Package.json oluştur
npm init -y

# Gerekli paketleri yükle
npm install apollo-server-express express graphql jsonwebtoken bcryptjs
npm install -D nodemon @types/node typescript
```

### Frontend Kurulumu
```bash
# Next.js 15 projesi oluştur
npx create-next-app@latest client --typescript --tailwind --app

# Apollo Client yükle
cd client
npm install @apollo/client graphql
```

## 📁 Proje Yapısı

```
project-root/
├── server/                 # GraphQL Backend
│   ├── src/
│   │   ├── schema/        # GraphQL şemaları
│   │   ├── resolvers/     # GraphQL resolvers
│   │   ├── models/        # Veri modelleri
│   │   ├── middleware/    # Authentication middleware
│   │   └── server.js      # Ana server dosyası
│   ├── package.json
│   └── .env
│
├── client/                # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router (Next.js 14)
│   │   ├── components/    # React bileşenleri
│   │   ├── lib/           # Apollo Client konfigürasyonu
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   └── next.config.js
│
└── README.md
```

## 🔄 Geliştirme Süreci

### Aşama 1: Backend Geliştirme
1. **GraphQL Schema Tasarımı**
    - Type definitions
    - Query ve Mutation şemaları
    - Subscription şemaları

2. **Resolver Implementasyonu**
    - Query resolvers
    - Mutation resolvers
    - Subscription resolvers

3. **Authentication Sistemi**
    - JWT token üretimi
    - Middleware yazımı
    - Authorization kontrolü

### Aşama 2: Frontend Geliştirme
1. **Next.js Kurulumu**
    - App Router yapılandırması
    - TailwindCSS entegrasyonu
    - TypeScript konfigürasyonu

2. **Apollo Client Entegrasyonu**
    - Client konfigürasyonu
    - Query ve Mutation hooks
    - Cache yönetimi

3. **UI Geliştirme**
    - Component tasarımı
    - Responsive layout
    - Form handling

### Aşama 3: Full-Stack Entegrasyon
1. **Real-time Özellikler**
    - WebSocket bağlantısı
    - Subscription handling
    - Live updates

2. **State Management**
    - Apollo Cache
    - Local state yönetimi
    - Error handling

## 💡 Önemli Kavramlar

### GraphQL Temelleri
- **Schema**: Veri yapısının tanımlandığı yer
- **Query**: Veri okuma işlemleri
- **Mutation**: Veri değiştirme işlemleri
- **Subscription**: Real-time veri akışı
- **Resolver**: GraphQL sorgularını işleyen fonksiyonlar

### Next.js Kavramları
- **App Router**: Next.js 15'in yeni routing sistemi
- **Server Components**: Sunucu tarafında render edilen bileşenler
- **Client Components**: Tarayıcıda render edilen bileşenler
- **Dynamic Routes**: Dinamik sayfa yönlendirmeleri

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
npm run build

# Environment variables
NODE_ENV=production
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
```

### Frontend Deployment
```bash
# Next.js 15 build
npm run build

# Environment variables
NEXT_PUBLIC_GRAPHQL_URL=your-graphql-endpoint
```

## 📚 Kaynaklar

### Resmi Dokümantasyonlar
- [GraphQL Resmi Dokümantasyon](https://graphql.org/learn/)
- [Apollo Server Dokümantasyon](https://www.apollographql.com/docs/apollo-server/)
- [Next.js 15 Dokümantasyon](https://nextjs.org/docs)
- [Apollo Client Dokümantasyon](https://www.apollographql.com/docs/react/)

### Faydalı Linkler
- [GraphQL Playground](https://github.com/graphql/graphql-playground)
- [TailwindCSS Dokümantasyon](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*Bu README dosyası proje gelişimi sırasında güncellenmektedir.*