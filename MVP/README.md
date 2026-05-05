# 💳 Subly

> Gestiona les teves subscripcions de forma senzilla.

Aplicació web que permet afegir, editar i eliminar subscripcions, veure el cost mensual i anual, i rebre alertes quan s'acosta una renovació.

---

## 🛠 Tecnologies

| Capa | Tecnologia |
|------|-----------|
| Frontend | React + Vite |
| Backend | Python (Flask) |
| Base de dades | MySQL |
| Autenticació | JWT |

---

## 📋 Requisits

- Python 3.x
- Node.js + npm
- MySQL (XAMPP o similar)

---

## 🚀 Com llançar l'app

**1. Engegar MySQL** (amb XAMPP o similar). La base de dades `subly` es crea automàticament.

**2. Backend**
```bash
cd MVP
pip install -r requirements.txt
python app.py
```
> Corre a `http://localhost:5000`

**3. Frontend**
```bash
cd MVP/frontend
npm install          # descarrega les dependències
npm run dev
```
> Corre a `http://localhost:5173`

**4. Obrir** → `http://localhost:5173` al navegador

---

## 👤 Usuari de prova

| Email | Contrasenya |
|-------|------------|
| `test@test.com` | `1111` |

---

## 📁 Estructura del projecte

```
MVP/
├── app.py              # API REST (endpoints)
├── database.py         # Connexió i taules MySQL
├── models.py           # Accés a dades
├── requirements.txt    # Dependències Python
├── start.bat           # Llançar tot (Windows)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx         # Component principal + rutes
        ├── main.jsx        # Punt d'entrada
        ├── index.css       # Estils
        ├── api/            # Crides al backend
        ├── components/     # Components (SubCard, Sidebar...)
        ├── context/        # Autenticació
        └── pages/          # Login, Register, Dashboard
```
