# 🚀 Trackify – Expense Tracking Platform

A full-stack **expense tracking application** built with **Next.js** (frontend) and **NestJS** (backend).  
Track, organize, and visualize your expenses with ease — all in one modern dashboard.

---

## ✨ Features

✅ User Authentication (JWT)  
✅ Expense Management  
✅ Category Organization  
✅ Dashboard Analytics  
✅ Responsive Design  
✅ Dark / Light Mode Support  

---

## 🧠 Tech Stack

| Layer | Technologies |
|:------|:--------------|
| **Frontend** | Next.js, TypeScript, Tailwind CSS |
| **Backend** | NestJS |
| **Database** | PostgreSQL |
| **Auth** | JSON Web Tokens (JWT) |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/kabirpofficial/trackify.git
cd trackify
```

### 2️⃣ Run the project
```bash
# Backend
npx nx serve backend

# Frontend
npx nx dev @trackify/frontend
```

### 3️⃣ Environment setup

Create your environment file:

```bash
# File: apps/backend/.env.example
```

Then configure your actual `.env` file accordingly.

---

## 🖼️ Screenshots

<p align="center">
  <img src="/images/sc1.png" alt="Screenshot 1" width="300" style="margin:6px; border-radius:10px;" />
  <img src="/images/sc2.png" alt="Screenshot 2" width="300" style="margin:6px; border-radius:10px;" />
  <img src="/images/sc3.png" alt="Screenshot 3" width="300" style="margin:6px; border-radius:10px;" />
</p>

<p align="center">
  <img src="/images/sc4.png" alt="Screenshot 4" width="300" style="margin:6px; border-radius:10px;" />
  <img src="/images/sc5.png" alt="Screenshot 5" width="300" style="margin:6px; border-radius:10px;" />
</p>

---

## 📦 Project Structure

```
trackify/
├── apps/
│   ├── backend/        # NestJS backend (API, Auth, DB)
│   └── frontend/       # Next.js frontend (UI, Pages)
├── libs/               # Shared utilities & modules
├── images/             # Project screenshots & assets
└── nx.json             # Nx monorepo configuration
```

---

## 🧩 Scripts

| Command | Description |
|:---------|:-------------|
| `npx nx serve backend` | Start backend (NestJS) server |
| `npx nx dev @trackify/frontend` | Start frontend (Next.js) app |
| `npx nx build` | Build all apps |
| `npx nx lint` | Run lint checks |
| `npx nx test` | Run tests |

---

## 🧑‍💻 Author

**Md Kabir Hassan**  
💼 [GitHub](https://github.com/kabirpofficial)  
🌐 [LinkedIn](https://www.linkedin.com/in/kabirpofficial/)

---

## ⭐ Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you’d like to change.

---

## 📜 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
