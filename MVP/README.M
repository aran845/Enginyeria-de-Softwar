# Subly

Aplicació web per gestionar subscripcions personals. Permet afegir, editar i eliminar subscripcions, veure el cost mensual/anual i rebre alertes de renovació.

## Tecnologies

- **Backend:** Python (Flask) + MySQL
- **Frontend:** React + Vite
- **Autenticació:** JWT

## Requisits

- Python
- Node.js + npm
- MySQL

## Instal·lació

### 1. Base de dades

Engegar MySQL. L'app crea la base de dades `subly` automàticament al iniciar.

### 2. Backend

```bash
cd MVP
pip install -r requirements.txt
python app.py
```

El backend s'executa a `http://localhost:5000`.

### 3. Frontend

```bash
cd MVP/frontend
npm install
npm run dev
```

El frontend s'executa a `http://localhost:5173`.

## Ús

1. Obrir `http://localhost:5173` al navegador
2. Registrar-se o iniciar sessió (usuari de prova: `test@test.com` / `1111`)
3. Afegir subscripcions des del dashboard

## Estructura

```
MVP/
├── app.py              # API REST (endpoints)
├── database.py         # Connexió i creació de taules MySQL
├── models.py           # Funcions d'accés a dades
├── requirements.txt    # Dependències Python
├── start.bat           # Script per llançar tot (Windows)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx           # Component principal + rutes
        ├── main.jsx          # Punt d'entrada
        ├── index.css         # Estils
        ├── api/api.js        # Crides HTTP al backend
        ├── context/          # Context d'autenticació
        ├── components/       # Components reutilitzables
        └── pages/            # Pàgines (Login, Register, Dashboard)
```

