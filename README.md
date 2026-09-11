<div align="center">

# All Work

### ระบบจัดการงานทีม

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**เว็บแอปพลิเคชันสำหรับบริหารจัดการงานในทีม (Project Management Tool) ที่เน้นความรวดเร็ว สวยงาม และใช้งานง่าย**


</div>

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### ⚡ Real-time Updates
เห็นความเคลื่อนไหวของเพื่อนร่วมทีมทันทีโดยไม่ต้องรีเฟรชหน้าจอ ขับเคลื่อนด้วย Supabase Realtime

### 🎯 Drag & Drop Kanban
จัดการสถานะงาน (To Do / Doing / Done) ได้ง่ายๆ แค่ลากวางด้วยระบบ dnd-kit

### 👥 Team Collaboration
สร้างทีม เชิญสมาชิก และจัดการสิทธิ์การเข้าถึงได้

### 🗑️ Interactive Deletion
ลากการ์ดงานหรือทีมไปที่ "ถังขยะ" เพื่อลบ พร้อม Animation สุดลื่นไหล

</td>
<td width="50%">

### 🎨 Multi-Theme Support
รองรับ Light Mode, Dark Mode และธีมพิเศษ Pride Month 🏳️‍🌈

### 📝 Task Management
ใส่รายละเอียดงาน ความสำคัญ (Priority) และกำหนดวันส่งงาน (Due Date)

### 🔍 Search & Filter
ค้นหางานที่ต้องการได้อย่างรวดเร็ว

### 👤 Profile Management
แก้ไขข้อมูลส่วนตัว ชื่อ นามสกุล และตำแหน่งงาน

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React (Vite) |
| **Styling** | Tailwind CSS |
| **UI Components** | Shadcn UI (Radix UI base) |
| **Icons** | Lucide React |
| **Drag & Drop** | @dnd-kit/core |
| **Backend & Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Deployment** | Vercel |

</div>

---

## 🚀 Getting Started

### Prerequisites

ตรวจสอบให้แน่ใจว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

- Node.js (v16 หรือสูงกว่า)
- npm หรือ yarn
- Supabase Account

### Installation

**1. Clone Repository**

```bash
git clone https://github.com/your-username/all-work-app.git
cd all-work-app
```

**2. Install Dependencies**

```bash
npm install
```

**3. Environment Variables**

คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่าจาก Supabase:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

**4. Database Setup**

ไปที่ Supabase SQL Editor แล้วรันไฟล์ทั้งหมดใน `supabase/schema.sql`

สคริปต์นี้จะสร้างตาราง, trigger สร้างโปรไฟล์/เจ้าของทีม/กระดาน To Do-Doing-Done, RLS และฟังก์ชันเชิญสมาชิก รันซ้ำได้

ใน Authentication → URL Configuration เพิ่ม:

- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/login` (และโดเมน production ถ้ามี)

**5. Run Development Server**

```bash
npm run dev
```

เปิด browser ที่ `http://localhost:5173`

---

## 📸 Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/b16ff12a-b1c3-487c-820f-8fdd794bf944" alt="All Work Screenshot" width="100%"/>
</div>

---

## 📦 Project Structure

```
all-work-app/
├── src/
│   ├── components/      # React components
│   ├── context/        # Auth state
│   ├── lib/            # Utilities & Supabase client
│   ├── pages/          # Login, teams, board
│   └── App.jsx
├── supabase/
│   └── schema.sql      # Tables, RLS, triggers
├── public/
├── .env.example
└── package.json
```

---


**Made with ❤️ in Thailand**

</div>
